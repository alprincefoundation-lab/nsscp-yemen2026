export type SovereignEvent<T = unknown> = {
  id: string;
  type: string;
  region: string;
  payload: T;
  timestamp: number;
  sequenceNumber: number;
  vectorClock: Record<string, number>;
  causationId: string | null;
  correlationId: string | null;
  checksum: string;
  source: string;
};

export type EventHandler<T = unknown> = (event: SovereignEvent<T>) => void | Promise<void>;

export type Subscription = {
  id: string;
  eventType: string;
  handler: EventHandler<unknown>;
  region: string | null;
  priority: number;
};

export type BusMetrics = {
  totalEventsProcessed: number;
  totalDuplicatesRejected: number;
  eventsPerRegion: Record<string, number>;
  eventsPerType: Record<string, number>;
  averageProcessingTimeMs: number;
  lastEventTimestamp: number;
};

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return '{' + keys.map(k => k + ':' + stableStringify((value as Record<string, unknown>)[k])).join(',') + '}';
  }
  return String(value);
}

function computeChecksum(value: unknown): string {
  const str = stableStringify(value);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString(16);
}

function generateEventId(): string {
  return Date.now().toString(36) + '-' + Math.floor(Math.random() * 0xFFFFFF).toString(36);
}

function createVectorClock(): Record<string, number> {
  return {};
}

function incrementVectorClock(clock: Record<string, number>, nodeId: string): Record<string, number> {
  const next = { ...clock };
  next[nodeId] = (next[nodeId] || 0) + 1;
  return next;
}

function mergeVectorClocks(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const merged = { ...a };
  for (const key of Object.keys(b)) {
    merged[key] = Math.max(merged[key] || 0, b[key]);
  }
  return merged;
}

function isConcurrent(a: Record<string, number>, b: Record<string, number>): boolean {
  let aDominates = false;
  let bDominates = false;
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of allKeys) {
    const va = a[key] || 0;
    const vb = b[key] || 0;
    if (va > vb) aDominates = true;
    if (vb > va) bDominates = true;
  }
  return aDominates && bDominates;
}

function compareVectorClocks(a: Record<string, number>, b: Record<string, number>): number {
  if (isConcurrent(a, b)) return 0;
  let aAllLessOrEqual = true;
  let aAnyLess = false;
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of allKeys) {
    const va = a[key] || 0;
    const vb = b[key] || 0;
    if (va > vb) aAllLessOrEqual = false;
    if (va < vb) aAnyLess = true;
  }
  if (aAllLessOrEqual && aAnyLess) return -1;
  if (!aAllLessOrEqual && !aAnyLess) return 1;
  return 0;
}

export class EventSovereignBus {
  private subscriptions: Map<string, Subscription[]> = new Map();
  private processedEventIds: Set<string> = new Set();
  private regionSequenceCounters: Map<string, number> = new Map();
  private globalVectorClock: Record<string, number> = {};
  private nodeId: string;
  private eventHistory: SovereignEvent<unknown>[] = [];
  private metrics: BusMetrics = {
    totalEventsProcessed: 0,
    totalDuplicatesRejected: 0,
    eventsPerRegion: {},
    eventsPerType: {},
    averageProcessingTimeMs: 0,
    lastEventTimestamp: 0,
  };
  private processingTimes: number[] = [];
  private maxHistorySize: number;

  constructor(nodeId: string, maxHistorySize: number = 10000) {
    this.nodeId = nodeId;
    this.maxHistorySize = maxHistorySize;
    this.globalVectorClock = createVectorClock();
  }

  publish<T>(type: string, payload: T, region: string, options?: {
    causationId?: string;
    correlationId?: string;
    source?: string;
  }): SovereignEvent<T> {
    const sequenceNumber = this.getNextSequence(region);
    this.globalVectorClock = incrementVectorClock(this.globalVectorClock, this.nodeId);

    const event: SovereignEvent<T> = {
      id: generateEventId(),
      type,
      region,
      payload,
      timestamp: Date.now(),
      sequenceNumber,
      vectorClock: { ...this.globalVectorClock },
      causationId: options?.causationId ?? null,
      correlationId: options?.correlationId ?? null,
      checksum: computeChecksum(payload),
      source: options?.source ?? this.nodeId,
    };

    this.processEvent(event as SovereignEvent<unknown>);
    return event;
  }

  ingest<T>(event: SovereignEvent<T>): boolean {
    if (this.processedEventIds.has(event.id)) {
      this.metrics.totalDuplicatesRejected++;
      return false;
    }

    const computed = computeChecksum(event.payload);
    if (computed !== event.checksum) {
      return false;
    }

    this.globalVectorClock = mergeVectorClocks(this.globalVectorClock, event.vectorClock);
    this.processEvent(event as SovereignEvent<unknown>);
    return true;
  }

  subscribe<T>(eventType: string, handler: EventHandler<T>, options?: {
    region?: string;
    priority?: number;
  }): Subscription {
    const subscription: Subscription = {
      id: generateEventId(),
      eventType,
      handler: handler as EventHandler<unknown>,
      region: options?.region ?? null,
      priority: options?.priority ?? 0,
    };

    const existing = this.subscriptions.get(eventType) || [];
    existing.push(subscription);
    existing.sort((a, b) => b.priority - a.priority);
    this.subscriptions.set(eventType, existing);

    return subscription;
  }

  unsubscribe(subscription: Subscription): void {
    const existing = this.subscriptions.get(subscription.eventType);
    if (existing) {
      const idx = existing.findIndex(s => s.id === subscription.id);
      if (idx >= 0) {
        existing.splice(idx, 1);
      }
    }
  }

  getEventHistory(eventType?: string, region?: string): SovereignEvent<unknown>[] {
    let events = this.eventHistory;
    if (eventType) {
      events = events.filter(e => e.type === eventType);
    }
    if (region) {
      events = events.filter(e => e.region === region);
    }
    return [...events];
  }

  getOrderedEvents(region: string): SovereignEvent<unknown>[] {
    return this.eventHistory
      .filter(e => e.region === region)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  getVectorClock(): Record<string, number> {
    return { ...this.globalVectorClock };
  }

  getMetrics(): BusMetrics {
    return { ...this.metrics };
  }

  getProcessedCount(): number {
    return this.processedEventIds.size;
  }

  isProcessed(eventId: string): boolean {
    return this.processedEventIds.has(eventId);
  }

  clearHistory(): void {
    this.eventHistory = [];
    this.processedEventIds.clear();
    this.regionSequenceCounters.clear();
  }

  private processEvent(event: SovereignEvent<unknown>): void {
    const startTime = Date.now();

    this.processedEventIds.add(event.id);
    this.eventHistory.push(event);

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }

    this.metrics.totalEventsProcessed++;
    this.metrics.lastEventTimestamp = event.timestamp;
    this.metrics.eventsPerRegion[event.region] = (this.metrics.eventsPerRegion[event.region] || 0) + 1;
    this.metrics.eventsPerType[event.type] = (this.metrics.eventsPerType[event.type] || 0) + 1;

    const subscribers = this.subscriptions.get(event.type) || [];
    const wildcardSubscribers = this.subscriptions.get('*') || [];
    const allSubscribers = [...subscribers, ...wildcardSubscribers]
      .filter(s => s.region === null || s.region === event.region)
      .sort((a, b) => b.priority - a.priority);

    for (const sub of allSubscribers) {
      try {
        const result = sub.handler(event);
        if (result && typeof (result as Promise<void>).then === 'function') {
          (result as Promise<void>).catch(() => {});
        }
      } catch {
        // handler errors do not block bus
      }
    }

    const duration = Date.now() - startTime;
    this.processingTimes.push(duration);
    if (this.processingTimes.length > 1000) {
      this.processingTimes = this.processingTimes.slice(-500);
    }
    this.metrics.averageProcessingTimeMs =
      this.processingTimes.reduce((s, t) => s + t, 0) / this.processingTimes.length;
  }

  private getNextSequence(region: string): number {
    const current = this.regionSequenceCounters.get(region) || 0;
    const next = current + 1;
    this.regionSequenceCounters.set(region, next);
    return next;
  }
}