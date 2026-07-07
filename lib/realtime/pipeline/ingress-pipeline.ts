export type RawIngressEvent<T = unknown> = {
  id: string;
  type: string;
  payload: T;
  source: string;
  region: string;
  timestamp: number;
  metadata: Record<string, unknown>;
};

export type IngressResult<T = unknown> = {
  accepted: boolean;
  event: RawIngressEvent<T> | null;
  rejectionReason: string | null;
  ingressTimestamp: number;
  queuePosition: number;
};

export type IngressConfig = {
  maxQueueSize: number;
  maxEventSizeBytes: number;
  allowedSources: Set<string> | null;
  allowedRegions: Set<string> | null;
  rateLimitPerSecond: number;
  deduplicationWindowMs: number;
};

type IngressListener<T> = (result: IngressResult<T>) => void;

function estimateSize(value: unknown): number {
  const str = JSON.stringify(value);
  return str ? str.length * 2 : 0;
}

const DEFAULT_CONFIG: IngressConfig = {
  maxQueueSize: 10000,
  maxEventSizeBytes: 1048576,
  allowedSources: null,
  allowedRegions: null,
  rateLimitPerSecond: 1000,
  deduplicationWindowMs: 5000,
};

export class IngressPipeline<T = unknown> {
  private config: IngressConfig;
  private queue: RawIngressEvent<T>[] = [];
  private seenIds: Map<string, number> = new Map();
  private rateLimitWindow: number[] = [];
  private listeners: IngressListener<T>[] = [];
  private totalAccepted = 0;
  private totalRejected = 0;

  constructor(config?: Partial<IngressConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  ingest(event: RawIngressEvent<T>): IngressResult<T> {
    const ingressTimestamp = Date.now();

    if (this.seenIds.has(event.id)) {
      const lastSeen = this.seenIds.get(event.id)!;
      if (ingressTimestamp - lastSeen < this.config.deduplicationWindowMs) {
        this.totalRejected++;
        return this.reject(event, 'Duplicate event within deduplication window', ingressTimestamp);
      }
    }

    if (this.queue.length >= this.config.maxQueueSize) {
      this.totalRejected++;
      return this.reject(event, 'Queue full: ' + this.queue.length + ' / ' + this.config.maxQueueSize, ingressTimestamp);
    }

    const eventSize = estimateSize(event.payload);
    if (eventSize > this.config.maxEventSizeBytes) {
      this.totalRejected++;
      return this.reject(event, 'Event size ' + eventSize + ' exceeds max ' + this.config.maxEventSizeBytes, ingressTimestamp);
    }

    if (this.config.allowedSources && !this.config.allowedSources.has(event.source)) {
      this.totalRejected++;
      return this.reject(event, 'Source not allowed: ' + event.source, ingressTimestamp);
    }

    if (this.config.allowedRegions && !this.config.allowedRegions.has(event.region)) {
      this.totalRejected++;
      return this.reject(event, 'Region not allowed: ' + event.region, ingressTimestamp);
    }

    if (!this.checkRateLimit(ingressTimestamp)) {
      this.totalRejected++;
      return this.reject(event, 'Rate limit exceeded: ' + this.config.rateLimitPerSecond + '/s', ingressTimestamp);
    }

    if (!event.id || event.id.length === 0) {
      this.totalRejected++;
      return this.reject(event, 'Missing event id', ingressTimestamp);
    }

    if (!event.type || event.type.length === 0) {
      this.totalRejected++;
      return this.reject(event, 'Missing event type', ingressTimestamp);
    }

    this.seenIds.set(event.id, ingressTimestamp);
    this.cleanupSeenIds(ingressTimestamp);

    this.queue.push(event);
    this.totalAccepted++;

    const result: IngressResult<T> = {
      accepted: true,
      event,
      rejectionReason: null,
      ingressTimestamp,
      queuePosition: this.queue.length - 1,
    };

    this.notify(result);
    return result;
  }

  dequeue(count: number = 1): RawIngressEvent<T>[] {
    const batch = this.queue.splice(0, count);
    return batch;
  }

  peek(count: number = 1): RawIngressEvent<T>[] {
    return this.queue.slice(0, count);
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getStats(): { accepted: number; rejected: number; queueSize: number; dedupCacheSize: number } {
    return {
      accepted: this.totalAccepted,
      rejected: this.totalRejected,
      queueSize: this.queue.length,
      dedupCacheSize: this.seenIds.size,
    };
  }

  clearQueue(): void {
    this.queue = [];
  }

  updateConfig(config: Partial<IngressConfig>): void {
    this.config = { ...this.config, ...config };
  }

  onIngress(listener: IngressListener<T>): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private reject(event: RawIngressEvent<T>, reason: string, timestamp: number): IngressResult<T> {
    const result: IngressResult<T> = {
      accepted: false,
      event,
      rejectionReason: reason,
      ingressTimestamp: timestamp,
      queuePosition: -1,
    };
    this.notify(result);
    return result;
  }

  private checkRateLimit(now: number): boolean {
    const windowStart = now - 1000;
    this.rateLimitWindow = this.rateLimitWindow.filter(t => t > windowStart);
    if (this.rateLimitWindow.length >= this.config.rateLimitPerSecond) {
      return false;
    }
    this.rateLimitWindow.push(now);
    return true;
  }

  private cleanupSeenIds(now: number): void {
    if (this.seenIds.size > this.config.maxQueueSize * 2) {
      const cutoff = now - this.config.deduplicationWindowMs;
      for (const [id, timestamp] of this.seenIds.entries()) {
        if (timestamp < cutoff) {
          this.seenIds.delete(id);
        }
      }
    }
  }

  private notify(result: IngressResult<T>): void {
    for (const listener of this.listeners) {
      try {
        listener(result);
      } catch {
        // listener errors do not block pipeline
      }
    }
  }
}