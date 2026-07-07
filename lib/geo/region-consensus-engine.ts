export type RegionNode = {
  id: string;
  name: string;
  status: 'active' | 'degraded' | 'isolated' | 'failed';
  latencyMs: number;
  lastHeartbeat: number;
  vectorClock: Record<string, number>;
  eventCount: number;
};

export type ReplicationMessage<T = unknown> = {
  id: string;
  originRegion: string;
  targetRegion: string;
  payload: T;
  vectorClock: Record<string, number>;
  timestamp: number;
  priority: number;
};

export type ConflictResolution = {
  strategy: 'vector-clock-priority' | 'last-write-wins' | 'merge';
  winnerRegion: string;
  loserRegion: string;
  resolutionTimestamp: number;
  metadata: Record<string, unknown>;
};

export type ConsensusState<T = unknown> = {
  value: T;
  version: number;
  vectorClock: Record<string, number>;
  lastWriter: string;
  lastUpdated: number;
  conflictHistory: ConflictResolution[];
};

export type FailoverRoute = {
  primary: string;
  fallbacks: string[];
  currentActive: string;
  switchCount: number;
  lastSwitchAt: number;
};

export type RegionHealthReport = {
  regionCount: number;
  activeRegions: number;
  isolatedRegions: number;
  failedRegions: number;
  replicationLagMs: number;
  pendingConflicts: number;
  failoverEvents: number;
  partitionToleranceActive: boolean;
};

function incrementClock(clock: Record<string, number>, nodeId: string): Record<string, number> {
  const next = { ...clock };
  next[nodeId] = (next[nodeId] || 0) + 1;
  return next;
}

function mergeClocks(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const merged = { ...a };
  for (const key of Object.keys(b)) {
    merged[key] = Math.max(merged[key] || 0, b[key]);
  }
  return merged;
}

function compareClocks(a: Record<string, number>, b: Record<string, number>): -1 | 0 | 1 {
  let aDominates = false;
  let bDominates = false;
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of allKeys) {
    const va = a[key] || 0;
    const vb = b[key] || 0;
    if (va > vb) aDominates = true;
    if (vb > va) bDominates = true;
  }
  if (aDominates && !bDominates) return 1;
  if (!aDominates && bDominates) return -1;
  return 0;
}

function isConcurrent(a: Record<string, number>, b: Record<string, number>): boolean {
  return compareClocks(a, b) === 0;
}

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

function generateId(): string {
  return Date.now().toString(36) + '-' + Math.floor(Math.random() * 0xFFFFFF).toString(36);
}

function simulateLatency(baseMs: number): number {
  const jitter = Math.floor(Math.random() * (baseMs * 0.3));
  return baseMs + jitter;
}

export class RegionConsensusEngine<T = unknown> {
  private regions: Map<string, RegionNode> = new Map();
  private state: ConsensusState<T>;
  private messageQueue: Map<string, ReplicationMessage<T>[]> = new Map();
  private failoverRoutes: Map<string, FailoverRoute> = new Map();
  private conflictHistory: ConflictResolution[] = [];
  private failoverEventCount = 0;
  private partitionMode = false;
  private isolatedRegions: Set<string> = new Set();
  private listeners: Array<(report: RegionHealthReport) => void> = [];

  constructor(initialState: T, initialRegion: string) {
    this.state = {
      value: initialState,
      version: 1,
      vectorClock: {},
      lastWriter: initialRegion,
      lastUpdated: Date.now(),
      conflictHistory: [],
    };
  }

  addRegion(id: string, name: string, latencyMs: number = 50): void {
    this.regions.set(id, {
      id,
      name,
      status: 'active',
      latencyMs,
      lastHeartbeat: Date.now(),
      vectorClock: {},
      eventCount: 0,
    });
    this.messageQueue.set(id, []);
  }

  removeRegion(id: string): void {
    this.regions.delete(id);
    this.messageQueue.delete(id);
    this.isolatedRegions.delete(id);

    for (const [routeKey, route] of this.failoverRoutes.entries()) {
      if (route.primary === id || route.fallbacks.includes(id)) {
        this.failoverRoutes.delete(routeKey);
      }
    }
  }

  update(originRegion: string, newValue: T): ConsensusState<T> {
    const region = this.regions.get(originRegion);
    if (!region) return this.state;
    if (this.isolatedRegions.has(originRegion)) return this.state;

    this.state.vectorClock = incrementClock(this.state.vectorClock, originRegion);
    this.state.value = newValue;
    this.state.version++;
    this.state.lastWriter = originRegion;
    this.state.lastUpdated = Date.now();
    region.eventCount++;

    this.replicate(originRegion, newValue);

    return { ...this.state, value: newValue };
  }

  replicate(originRegion: string, value: T): void {
    for (const [regionId, region] of this.regions.entries()) {
      if (regionId === originRegion) continue;
      if (region.status === 'failed' || this.isolatedRegions.has(regionId)) continue;

      const message: ReplicationMessage<T> = {
        id: generateId(),
        originRegion,
        targetRegion: regionId,
        payload: value,
        vectorClock: { ...this.state.vectorClock },
        timestamp: Date.now(),
        priority: 0,
      };

      const queue = this.messageQueue.get(regionId) || [];
      queue.push(message);
      this.messageQueue.set(regionId, queue);
    }
  }

  processIncoming(regionId: string, message: ReplicationMessage<T>): ConsensusState<T> {
    const region = this.regions.get(regionId);
    if (!region) return this.state;
    if (this.isolatedRegions.has(regionId)) return this.state;

    const comparison = compareClocks(message.vectorClock, this.state.vectorClock);

    if (comparison === 1) {
      this.state.value = message.payload;
      this.state.vectorClock = mergeClocks(this.state.vectorClock, message.vectorClock);
      this.state.version++;
      this.state.lastWriter = message.originRegion;
      this.state.lastUpdated = Date.now();
    } else if (comparison === -1) {
      // incoming is older, ignore value but merge clocks
      this.state.vectorClock = mergeClocks(this.state.vectorClock, message.vectorClock);
    } else if (comparison === 0) {
      // concurrent - conflict resolution
      const resolution = this.resolveConflict(message);
      this.conflictHistory.push(resolution);
      this.state.conflictHistory.push(resolution);
    }

    region.vectorClock = mergeClocks(region.vectorClock, message.vectorClock);

    return { ...this.state };
  }

  drainMessageQueue(regionId: string): ConsensusState<T> | null {
    const queue = this.messageQueue.get(regionId);
    if (!queue || queue.length === 0) return null;

    const sorted = queue.sort((a, b) => a.timestamp - b.timestamp);
    this.messageQueue.set(regionId, []);

    let lastState: ConsensusState<T> | null = null;
    for (const msg of sorted) {
      lastState = this.processIncoming(regionId, msg);
    }
    return lastState;
  }

  setRegionStatus(regionId: string, status: RegionNode['status']): void {
    const region = this.regions.get(regionId);
    if (!region) return;

    region.status = status;

    if (status === 'failed' || status === 'isolated') {
      this.isolatedRegions.add(regionId);
      this.triggerFailover(regionId);
    } else {
      this.isolatedRegions.delete(regionId);
    }
  }

  setPartitionMode(active: boolean): void {
    this.partitionMode = active;
    if (active) {
      for (const [id, region] of this.regions.entries()) {
        if (region.status === 'active') {
          region.status = 'degraded';
        }
      }
    } else {
      for (const [id, region] of this.regions.entries()) {
        if (region.status === 'degraded') {
          region.status = 'active';
        }
      }
      this.resyncAll();
    }
  }

  configureFailover(primary: string, fallbacks: string[]): void {
    this.failoverRoutes.set(primary, {
      primary,
      fallbacks: [...fallbacks],
      currentActive: primary,
      switchCount: 0,
      lastSwitchAt: Date.now(),
    });
  }

  heartbeat(regionId: string): void {
    const region = this.regions.get(regionId);
    if (region) {
      region.lastHeartbeat = Date.now();
      if (region.status === 'degraded') {
        region.status = 'active';
      }
    }
  }

  checkStaleRegions(timeoutMs: number = 15000): string[] {
    const now = Date.now();
    const stale: string[] = [];
    for (const [id, region] of this.regions.entries()) {
      if (now - region.lastHeartbeat > timeoutMs && region.status === 'active') {
        region.status = 'degraded';
        stale.push(id);
      }
    }
    return stale;
  }

  getState(): ConsensusState<T> {
    return { ...this.state, value: this.state.value };
  }

  getStateValue(): T {
    return this.state.value;
  }

  getRegion(regionId: string): RegionNode | null {
    return this.regions.get(regionId) ?? null;
  }

  getAllRegions(): RegionNode[] {
    return Array.from(this.regions.values());
  }

  getActiveRegions(): RegionNode[] {
    return Array.from(this.regions.values()).filter(r => r.status === 'active');
  }

  getConflictHistory(): ConflictResolution[] {
    return [...this.conflictHistory];
  }

  getFailoverRoute(regionId: string): FailoverRoute | null {
    return this.failoverRoutes.get(regionId) ?? null;
  }

  getQueueSize(regionId: string): number {
    return (this.messageQueue.get(regionId) || []).length;
  }

  getHealthReport(): RegionHealthReport {
    const all = Array.from(this.regions.values());
    const active = all.filter(r => r.status === 'active').length;
    const isolated = this.isolatedRegions.size;
    const failed = all.filter(r => r.status === 'failed').length;

    const latencies = all.filter(r => r.status === 'active').map(r => r.latencyMs);
    const avgLag = latencies.length > 0
      ? latencies.reduce((s, l) => s + l, 0) / latencies.length
      : 0;

    let totalPending = 0;
    for (const queue of this.messageQueue.values()) {
      totalPending += queue.length;
    }

    return {
      regionCount: all.length,
      activeRegions: active,
      isolatedRegions: isolated,
      failedRegions: failed,
      replicationLagMs: avgLag,
      pendingConflicts: totalPending,
      failoverEvents: this.failoverEventCount,
      partitionToleranceActive: this.partitionMode,
    };
  }

  onHealthReport(listener: (report: RegionHealthReport) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private resolveConflict(incoming: ReplicationMessage<T>): ConflictResolution {
    const resolution: ConflictResolution = {
      strategy: 'vector-clock-priority',
      winnerRegion: '',
      loserRegion: '',
      resolutionTimestamp: Date.now(),
      metadata: {},
    };

    if (isConcurrent(incoming.vectorClock, this.state.vectorClock)) {
      // true concurrency — use last-write-wins as tiebreaker
      if (incoming.timestamp > this.state.lastUpdated) {
        resolution.strategy = 'last-write-wins';
        resolution.winnerRegion = incoming.originRegion;
        resolution.loserRegion = this.state.lastWriter;
        this.state.value = incoming.payload;
        this.state.lastWriter = incoming.originRegion;
        this.state.lastUpdated = incoming.timestamp;
        this.state.version++;
        this.state.vectorClock = mergeClocks(this.state.vectorClock, incoming.vectorClock);
      } else {
        resolution.strategy = 'last-write-wins';
        resolution.winnerRegion = this.state.lastWriter;
        resolution.loserRegion = incoming.originRegion;
      }
    } else {
      // not actually concurrent — vector clock decides
      resolution.winnerRegion = this.state.lastWriter;
      resolution.loserRegion = incoming.originRegion;
    }

    return resolution;
  }

  private triggerFailover(failedRegionId: string): void {
    const route = this.failoverRoutes.get(failedRegionId);
    if (!route) return;

    for (const fallback of route.fallbacks) {
      const region = this.regions.get(fallback);
      if (region && region.status === 'active') {
        route.currentActive = fallback;
        route.switchCount++;
        route.lastSwitchAt = Date.now();
        this.failoverEventCount++;
        return;
      }
    }
  }

  private resyncAll(): void {
    for (const regionId of this.regions.keys()) {
      if (!this.isolatedRegions.has(regionId)) {
        this.replicate(this.state.lastWriter, this.state.value);
      }
    }
  }
}