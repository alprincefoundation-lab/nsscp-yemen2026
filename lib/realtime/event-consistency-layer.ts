export type VectorClock = Record<string, number>;

export type CausalEvent<T = unknown> = {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  vectorClock: VectorClock;
  causationId: string | null;
  correlationId: string | null;
  region: string;
  sequenceNumber: number;
};

export type ConsistencyMode = 'strict' | 'causal' | 'eventual';

export type OrderingViolation = {
  eventId: string;
  expectedAfter: string;
  actualOrder: number;
  region: string;
  resolvedAt: number;
};

export type ConsistencyReport = {
  mode: ConsistencyMode;
  totalEvents: number;
  violations: OrderingViolation[];
  pendingEvents: number;
  resolvedEvents: number;
  causalChains: number;
};

function incrementClock(clock: VectorClock, nodeId: string): VectorClock {
  const next = { ...clock };
  next[nodeId] = (next[nodeId] || 0) + 1;
  return next;
}

function mergeClocks(a: VectorClock, b: VectorClock): VectorClock {
  const merged = { ...a };
  for (const key of Object.keys(b)) {
    merged[key] = Math.max(merged[key] || 0, b[key]);
  }
  return merged;
}

function happensBefore(a: VectorClock, b: VectorClock): boolean {
  let anyLess = false;
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of allKeys) {
    const va = a[key] || 0;
    const vb = b[key] || 0;
    if (va > vb) return false;
    if (va < vb) anyLess = true;
  }
  return anyLess;
}

function isConcurrent(a: VectorClock, b: VectorClock): boolean {
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

function hasAllDependencies(event: CausalEvent, delivered: Map<string, CausalEvent>): boolean {
  if (!event.causationId) return true;
  return delivered.has(event.causationId);
}

export class EventConsistencyLayer {
  private mode: ConsistencyMode;
  private nodeId: string;
  private globalClock: VectorClock;
  private pendingQueue: CausalEvent<unknown>[] = [];
  private deliveredEvents: Map<string, CausalEvent<unknown>> = new Map();
  private violations: OrderingViolation[] = [];
  private causalChains: Map<string, Set<string>> = new Map();
  private listeners: Array<(event: CausalEvent<unknown>) => void> = [];

  constructor(nodeId: string, mode: ConsistencyMode = 'causal') {
    this.nodeId = nodeId;
    this.mode = mode;
    this.globalClock = {};
  }

  process<T>(event: CausalEvent<T>): CausalEvent<T>[] {
    const merged = mergeClocks(this.globalClock, event.vectorClock);
    this.globalClock = incrementClock(merged, this.nodeId);

    const typedEvent = event as CausalEvent<unknown>;

    if (this.mode === 'strict') {
      return this.processStrict(typedEvent) as CausalEvent<T>[];
    }
    if (this.mode === 'causal') {
      return this.processCausal(typedEvent) as CausalEvent<T>[];
    }
    return this.processEventual(typedEvent) as CausalEvent<T>[];
  }

  wrapEvent<T>(id: string, type: string, payload: T, region: string, options?: {
    causationId?: string;
    correlationId?: string;
    sequenceNumber?: number;
  }): CausalEvent<T> {
    this.globalClock = incrementClock(this.globalClock, this.nodeId);
    return {
      id,
      type,
      payload,
      timestamp: Date.now(),
      vectorClock: { ...this.globalClock },
      causationId: options?.causationId ?? null,
      correlationId: options?.correlationId ?? null,
      region,
      sequenceNumber: options?.sequenceNumber ?? 0,
    };
  }

  getPendingCount(): number {
    return this.pendingQueue.length;
  }

  getDeliveredCount(): number {
    return this.deliveredEvents.size;
  }

  getViolations(): OrderingViolation[] {
    return [...this.violations];
  }

  getGlobalClock(): VectorClock {
    return { ...this.globalClock };
  }

  getReport(): ConsistencyReport {
    return {
      mode: this.mode,
      totalEvents: this.deliveredEvents.size + this.pendingQueue.length,
      violations: [...this.violations],
      pendingEvents: this.pendingQueue.length,
      resolvedEvents: this.deliveredEvents.size,
      causalChains: this.causalChains.size,
    };
  }

  getCausalChain(eventId: string): string[] {
    const chain: string[] = [];
    const visited = new Set<string>();
    let current: string | null = eventId;

    while (current && !visited.has(current)) {
      visited.add(current);
      chain.push(current);
      const event = this.deliveredEvents.get(current);
      if (event) {
        current = event.causationId;
      } else {
        break;
      }
    }

    return chain;
  }

  onDelivered(listener: (event: CausalEvent<unknown>) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  flushPending(): CausalEvent<unknown>[] {
    const delivered: CausalEvent<unknown>[] = [];
    let madeProgress = true;

    while (madeProgress) {
      madeProgress = false;
      const remaining: CausalEvent<unknown>[] = [];

      for (const event of this.pendingQueue) {
        if (hasAllDependencies(event, this.deliveredEvents)) {
          this.deliverEvent(event);
          delivered.push(event);
          madeProgress = true;
        } else {
          remaining.push(event);
        }
      }

      this.pendingQueue = remaining;
    }

    return delivered;
  }

  private processStrict<T>(event: CausalEvent<T>): CausalEvent<T>[] {
    if (event.causationId && !this.deliveredEvents.has(event.causationId)) {
      this.pendingQueue.push(event as CausalEvent<unknown>);
      this.flushPending();
      return [];
    }

    this.deliverEvent(event as CausalEvent<unknown>);
    const flushed = this.flushPending();
    return [event, ...flushed] as CausalEvent<T>[];
  }

  private processCausal<T>(event: CausalEvent<T>): CausalEvent<T>[] {
    const typedEvent = event as CausalEvent<unknown>;

    for (const pending of this.pendingQueue) {
      if (isConcurrent(pending.vectorClock, typedEvent.vectorClock)) {
        continue;
      }
      if (happensBefore(typedEvent.vectorClock, pending.vectorClock)) {
        if (!hasAllDependencies(typedEvent, this.deliveredEvents)) {
          this.pendingQueue.push(typedEvent);
          return [];
        }
      }
    }

    if (hasAllDependencies(typedEvent, this.deliveredEvents)) {
      this.deliverEvent(typedEvent);
      const flushed = this.flushPending();
      return [event, ...flushed] as CausalEvent<T>[];
    }

    this.pendingQueue.push(typedEvent);
    this.flushPending();
    return [];
  }

  private processEventual<T>(event: CausalEvent<T>): CausalEvent<T>[] {
    if (event.causationId && !this.deliveredEvents.has(event.causationId)) {
      this.violations.push({
        eventId: event.id,
        expectedAfter: event.causationId,
        actualOrder: event.sequenceNumber,
        region: event.region,
        resolvedAt: Date.now(),
      });
    }

    this.deliverEvent(event as CausalEvent<unknown>);
    return [event];
  }

  private deliverEvent(event: CausalEvent<unknown>): void {
    this.deliveredEvents.set(event.id, event);

    if (event.causationId) {
      let chain = this.causalChains.get(event.causationId);
      if (!chain) {
        chain = new Set();
        this.causalChains.set(event.causationId, chain);
      }
      chain.add(event.id);
    }

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // listener errors do not block delivery
      }
    }
  }
}