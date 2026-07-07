export type ReplayableEvent<T = unknown> = {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  sequenceNumber: number;
  vectorClock: Record<string, number>;
  region: string;
  source: string;
};

export type ReplayCheckpoint<T = unknown> = {
  id: string;
  sequenceNumber: number;
  state: T;
  eventCount: number;
  timestamp: number;
  checksum: string;
};

export type ReplayConfig = {
  mode: 'deterministic' | 'live';
  batchSize: number;
  checkpointInterval: number;
  maxEventsInMemory: number;
};

export type ReplayProgress = {
  totalEvents: number;
  processedEvents: number;
  percentComplete: number;
  currentSequence: number;
  elapsedMs: number;
  estimatedRemainingMs: number;
};

export type ReplayResult<T = unknown> = {
  finalState: T;
  totalEventsReplayed: number;
  checkpointsCreated: number;
  duration: number;
  deterministic: boolean;
  checksum: string;
};

type EventReducer<T> = (state: T, event: ReplayableEvent<unknown>) => T;
type ReplayListener = (progress: ReplayProgress) => void;

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

function sortEventsDeterministically(events: ReplayableEvent[]): ReplayableEvent[] {
  return [...events].sort((a, b) => {
    if (a.sequenceNumber !== b.sequenceNumber) return a.sequenceNumber - b.sequenceNumber;
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

export class EventReplayEngine<T> {
  private reducer: EventReducer<T>;
  private config: ReplayConfig;
  private checkpoints: Map<number, ReplayCheckpoint<T>> = new Map();
  private listeners: ReplayListener[] = [];
  private eventStore: Map<string, ReplayableEvent<unknown>> = new Map();
  private replayHistory: ReplayResult<T>[] = [];

  constructor(reducer: EventReducer<T>, config?: Partial<ReplayConfig>) {
    this.reducer = reducer;
    this.config = {
      mode: config?.mode ?? 'deterministic',
      batchSize: config?.batchSize ?? 100,
      checkpointInterval: config?.checkpointInterval ?? 1000,
      maxEventsInMemory: config?.maxEventsInMemory ?? 100000,
    };
  }

  storeEvent(event: ReplayableEvent<unknown>): void {
    if (this.eventStore.has(event.id)) return;
    this.eventStore.set(event.id, event);

    if (this.eventStore.size > this.config.maxEventsInMemory) {
      const entries = Array.from(this.eventStore.entries());
      const toRemove = entries.slice(0, entries.length - this.config.maxEventsInMemory);
      for (const [key] of toRemove) {
        this.eventStore.delete(key);
      }
    }
  }

  storeEvents(events: ReplayableEvent<unknown>[]): void {
    for (const event of events) {
      this.storeEvent(event);
    }
  }

  replay(initialState: T, region?: string): ReplayResult<T> {
    const startTime = Date.now();
    let events = Array.from(this.eventStore.values());

    if (region) {
      events = events.filter(e => e.region === region);
    }

    const sorted = sortEventsDeterministically(events as ReplayableEvent[]);
    let state = initialState;
    let checkpointsCreated = 0;
    const totalEvents = sorted.length;

    this.checkpoints.clear();

    for (let i = 0; i < sorted.length; i += this.config.batchSize) {
      const batch = sorted.slice(i, i + this.config.batchSize);

      for (const event of batch) {
        state = this.reducer(state, event);
      }

      const processedEvents = Math.min(i + this.config.batchSize, totalEvents);

      if (processedEvents % this.config.checkpointInterval === 0 || processedEvents === totalEvents) {
        const checkpoint: ReplayCheckpoint<T> = {
          id: 'cp-' + processedEvents,
          sequenceNumber: sorted[processedEvents - 1]?.sequenceNumber ?? 0,
          state,
          eventCount: processedEvents,
          timestamp: Date.now(),
          checksum: computeChecksum(state),
        };
        this.checkpoints.set(processedEvents, checkpoint);
        checkpointsCreated++;
      }

      this.notifyProgress({
        totalEvents,
        processedEvents,
        percentComplete: totalEvents > 0 ? (processedEvents / totalEvents) * 100 : 100,
        currentSequence: sorted[processedEvents - 1]?.sequenceNumber ?? 0,
        elapsedMs: Date.now() - startTime,
        estimatedRemainingMs: totalEvents > 0
          ? ((Date.now() - startTime) / processedEvents) * (totalEvents - processedEvents)
          : 0,
      });
    }

    const result: ReplayResult<T> = {
      finalState: state,
      totalEventsReplayed: totalEvents,
      checkpointsCreated,
      duration: Date.now() - startTime,
      deterministic: this.config.mode === 'deterministic',
      checksum: computeChecksum(state),
    };

    this.replayHistory.push(result);
    return result;
  }

  replayFromCheckpoint(checkpointIndex: number, additionalEvents: ReplayableEvent<unknown>[], initialState: T): ReplayResult<T> | null {
    const checkpoint = Array.from(this.checkpoints.values())
      .find(cp => cp.eventCount === checkpointIndex);

    if (!checkpoint) return null;

    const sorted = sortEventsDeterministically(additionalEvents);
    let state = checkpoint.state;

    const startTime = Date.now();

    for (const event of sorted) {
      state = this.reducer(state, event);
    }

    const result: ReplayResult<T> = {
      finalState: state,
      totalEventsReplayed: sorted.length,
      checkpointsCreated: 0,
      duration: Date.now() - startTime,
      deterministic: this.config.mode === 'deterministic',
      checksum: computeChecksum(state),
    };

    this.replayHistory.push(result);
    return result;
  }

  getLatestCheckpoint(): ReplayCheckpoint<T> | null {
    if (this.checkpoints.size === 0) return null;
    let latest: ReplayCheckpoint<T> | null = null;
    for (const cp of this.checkpoints.values()) {
      if (!latest || cp.eventCount > latest.eventCount) {
        latest = cp;
      }
    }
    return latest;
  }

  getCheckpoint(eventCount: number): ReplayCheckpoint<T> | null {
    return this.checkpoints.get(eventCount) ?? null;
  }

  getAllCheckpoints(): ReplayCheckpoint<T>[] {
    return Array.from(this.checkpoints.values()).sort((a, b) => a.eventCount - b.eventCount);
  }

  getStoredEventCount(): number {
    return this.eventStore.size;
  }

  getReplayHistory(): ReplayResult<T>[] {
    return [...this.replayHistory];
  }

  verifyDeterminism(initialState: T, region?: string): boolean {
    const result1 = this.replay(initialState, region);
    const result2 = this.replay(initialState, region);
    return result1.checksum === result2.checksum;
  }

  getEventWindow(fromSequence: number, toSequence: number): ReplayableEvent<unknown>[] {
    return Array.from(this.eventStore.values())
      .filter(e => e.sequenceNumber >= fromSequence && e.sequenceNumber <= toSequence)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  onProgress(listener: ReplayListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  clearCheckpoints(): void {
    this.checkpoints.clear();
  }

  clearEventStore(): void {
    this.eventStore.clear();
  }

  private notifyProgress(progress: ReplayProgress): void {
    for (const listener of this.listeners) {
      try {
        listener(progress);
      } catch {
        // listener errors do not block replay
      }
    }
  }
}