/**
 * Event Bus — Central pub/sub backbone for real-time event distribution
 * Supports topic-based routing, priority queues, and dead-letter handling
 */

import {
  type DomainEvent,
  type EventEnvelope,
  type EventHandler,
  type EventFilter,
  EventSeverity,
  createEventId,
} from './event-types';

interface EventHandlerWrapper {
  id: string;
  handler: EventHandler;
  filter?: EventFilter;
  active: boolean;
  priority: number;
}

interface PendingEvent {
  envelope: EventEnvelope;
  attempts: number;
  nextRetryAt: number;
}

class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number): void {
    const entry = { item, priority };
    let inserted = false;
    for (let i = 0; i < this.items.length; i++) {
      if (priority > this.items[i].priority) {
        this.items.splice(i, 0, entry);
        inserted = true;
        break;
      }
    }
    if (!inserted) this.items.push(entry);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  get size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }
}

export interface EventBusConfig {
  maxRetries: number;
  retryDelayMs: number;
  deadLetterMaxSize: number;
  processingConcurrency: number;
  eventTtlMs: number;
}

const DEFAULT_CONFIG: EventBusConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  deadLetterMaxSize: 1000,
  processingConcurrency: 10,
  eventTtlMs: 300_000, // 5 minutes
};

export class EventBus {
  private static instance: EventBus | null = null;

  private topics: Map<string, EventHandlerWrapper[]> = new Map();
  private processingQueue: PriorityQueue<PendingEvent> = new PriorityQueue();
  private deadLetterQueue: EventEnvelope[] = [];
  private eventHistory: EventEnvelope[] = [];
  private config: EventBusConfig;
  private processing = false;
  private eventListeners: Map<string, Set<(envelope: EventEnvelope) => void>> = new Map();
  private metrics = {
    totalPublished: 0,
    totalDelivered: 0,
    totalFailed: 0,
    totalDeadLettered: 0,
    avgProcessingTimeMs: 0,
    processingTimes: [] as number[],
  };

  private constructor(config: Partial<EventBusConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<EventBusConfig>): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(config);
    }
    return EventBus.instance;
  }

  subscribe(topic: string, handler: EventHandler, filter?: EventFilter): () => void {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, []);
    }

    const wrapper: EventHandlerWrapper = { 
      id: createEventId(), 
      handler, 
      filter, 
      active: true,
      priority: 0
    };
    this.topics.get(topic)!.push(wrapper);

    return () => {
      wrapper.active = false;
      const subs = this.topics.get(topic);
      if (subs) {
        const idx = subs.indexOf(wrapper);
        if (idx !== -1) subs.splice(idx, 1);
      }
    };
  }

  async publish(topic: string, event: DomainEvent): Promise<string> {
    const envelope: EventEnvelope = {
      id: createEventId(),
      event,
      channel: topic,
      publishedAt: Date.now(),
      publishedBy: event.source,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      deadLettered: false,
    };

    this.metrics.totalPublished++;
    this.eventHistory.push(envelope);

    // Trim history
    if (this.eventHistory.length > 5000) {
      this.eventHistory = this.eventHistory.slice(-2500);
    }

    // Notify raw listeners
    this.notifyListeners(topic, envelope);

    // Dispatch to subscribers
    await this.dispatch(topic, envelope);

    return envelope.id;
  }

  async publishBatch(topic: string, events: DomainEvent[]): Promise<string[]> {
    const ids: string[] = [];
    for (const event of events) {
      ids.push(await this.publish(topic, event));
    }
    return ids;
  }

  on(topic: string, listener: (envelope: EventEnvelope) => void): () => void {
    if (!this.eventListeners.has(topic)) {
      this.eventListeners.set(topic, new Set());
    }
    this.eventListeners.get(topic)!.add(listener);
    return () => {
      this.eventListeners.get(topic)?.delete(listener);
    };
  }

  private notifyListeners(topic: string, envelope: EventEnvelope): void {
    const listeners = this.eventListeners.get(topic);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(envelope);
        } catch {
          // Listeners should not break the pipeline
        }
      }
    }
  }

  private async dispatch(topic: string, envelope: EventEnvelope): Promise<void> {
    const subscriptions = this.topics.get(topic);
    if (!subscriptions || subscriptions.length === 0) return;

    const startTime = performance.now();

    const activeSubs = subscriptions.filter(s => s.active);
    const matchingSubs = activeSubs.filter(s => {
      if (!s.filter) return true;
      return this.matchesFilter(envelope.event, s.filter);
    });

    const results = await Promise.allSettled(
      matchingSubs.map(s => Promise.resolve(s.handler(envelope)))
    );

    const elapsed = performance.now() - startTime;
    this.metrics.processingTimes.push(elapsed);
    if (this.metrics.processingTimes.length > 1000) {
      this.metrics.processingTimes = this.metrics.processingTimes.slice(-500);
    }
    this.metrics.avgProcessingTimeMs =
      this.metrics.processingTimes.reduce((a, b) => a + b, 0) /
      this.metrics.processingTimes.length;

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      this.metrics.totalFailed += failed.length;
      this.enqueueRetry(envelope);
    } else {
      this.metrics.totalDelivered++;
    }
  }

  private matchesFilter(event: DomainEvent, filter: EventFilter): boolean {
    if (filter.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(event.category)) return false;
    }
    if (filter.severities && filter.severities.length > 0) {
      if (!filter.severities.includes(event.severity)) return false;
    }
    if (filter.regions && filter.regions.length > 0) {
      if (!filter.regions.includes(event.region)) return false;
    }
    if (filter.sources && filter.sources.length > 0) {
      if (!filter.sources.includes(event.source)) return false;
    }
    if (filter.types && filter.types.length > 0) {
      if (!filter.types.includes(event.type)) return false;
    }
    if (filter.timeRange) {
      if (event.timestamp < filter.timeRange.from || event.timestamp > filter.timeRange.to) {
        return false;
      }
    }
    return true;
  }

  private enqueueRetry(envelope: EventEnvelope): void {
    const pendingEvent: PendingEvent = {
      envelope: {
        ...envelope,
        retryCount: envelope.retryCount + 1,
      },
      attempts: envelope.retryCount + 1,
      nextRetryAt: Date.now() + this.config.retryDelayMs * (envelope.retryCount + 1),
    };

    if (pendingEvent.attempts >= this.config.maxRetries) {
      // Move to dead letter queue
      const deadLettered = { ...envelope, deadLettered: true };
      this.deadLetterQueue.push(deadLettered);
      if (this.deadLetterQueue.length > this.config.deadLetterMaxSize) {
        this.deadLetterQueue.shift();
      }
      this.metrics.totalDeadLettered++;
      return;
    }

    this.processingQueue.enqueue(pendingEvent, EventSeverity.CRITICAL - envelope.event.severity);
    this.processRetries();
  }

  private async processRetries(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.processingQueue.size > 0) {
      const pending = this.processingQueue.dequeue();
      if (!pending) break;

      const now = Date.now();
      if (pending.nextRetryAt > now) {
        // Re-enqueue for later
        this.processingQueue.enqueue(pending, pending.envelope.event.severity);
        break;
      }

      try {
        await this.dispatch(pending.envelope.channel, pending.envelope);
      } catch {
        // Will be re-enqueued by dispatch
      }
    }

    this.processing = false;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getDeadLetterQueue(): EventEnvelope[] {
    return [...this.deadLetterQueue];
  }

  getEventHistory(limit = 100): EventEnvelope[] {
    return this.eventHistory.slice(-limit);
  }

  getTopicNames(): string[] {
    return Array.from(this.topics.keys());
  }

  getSubscriberCount(topic: string): number {
    return this.topics.get(topic)?.filter(s => s.active).length ?? 0;
  }

  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  destroy(): void {
    this.topics.clear();
    this.eventListeners.clear();
    this.processingQueue.clear();
    this.deadLetterQueue = [];
    this.eventHistory = [];
    EventBus.instance = null;
  }
}

export const eventBus = EventBus.getInstance();