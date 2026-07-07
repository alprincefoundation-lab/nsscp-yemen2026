export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'offline';

export type HealthMetric = {
  name: string;
  value: number;
  threshold: number;
  unit: string;
  status: HealthStatus;
  measuredAt: number;
};

export type NodeHealth = {
  nodeId: string;
  region: string;
  status: HealthStatus;
  metrics: HealthMetric[];
  lastHeartbeat: number;
  uptime: number;
  eventThroughput: number;
  errorRate: number;
};

export type SystemHealthReport = {
  overallStatus: HealthStatus;
  nodes: NodeHealth[];
  anomalies: HealthAnomaly[];
  memoryPressure: number;
  eventDuplicationRate: number;
  desyncNodePairs: Array<{ nodeA: string; nodeB: string; lagMs: number }>;
  invalidEventOrderings: number;
  generatedAt: number;
};

export type HealthAnomaly = {
  type: 'memory_leak' | 'event_duplication' | 'node_desync' | 'invalid_ordering' | 'throughput_drop' | 'error_spike';
  severity: HealthStatus;
  message: string;
  affectedNodes: string[];
  detectedAt: number;
  metadata: Record<string, unknown>;
};

type MemorySample = {
  heapUsed: number;
  heapTotal: number;
  timestamp: number;
};

type EventSample = {
  eventId: string;
  hash: string;
  sequenceNumber: number;
  nodeId: string;
  timestamp: number;
};

type HealthListener = (report: SystemHealthReport) => void;

const MEMORY_LEAK_WINDOW = 50;
const MEMORY_GROWTH_THRESHOLD = 0.15;
const DUPLICATION_WINDOW_MS = 10000;
const DESYNC_THRESHOLD_MS = 5000;
const ORDERING_WINDOW = 100;
const HEARTBEAT_TIMEOUT_MS = 15000;
const THROUGHPUT_WINDOW_MS = 60000;
const ERROR_RATE_THRESHOLD = 0.05;
const DUPLICATION_RATE_THRESHOLD = 0.02;
const THROUGHPUT_DROP_THRESHOLD = 0.5;

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

function simpleHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const chr = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString(16);
}

function detectMemoryLeak(samples: MemorySample[]): boolean {
  if (samples.length < MEMORY_LEAK_WINDOW) return false;
  const recent = samples.slice(-MEMORY_LEAK_WINDOW);
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  const avgFirst = firstHalf.reduce((sum, s) => sum + s.heapUsed, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, s) => sum + s.heapUsed, 0) / secondHalf.length;
  if (avgFirst === 0) return false;
  const growthRate = (avgSecond - avgFirst) / avgFirst;
  return growthRate > MEMORY_GROWTH_THRESHOLD;
}

function detectDuplicateEvents(events: EventSample[]): number {
  const seen = new Map<string, number>();
  let duplicates = 0;
  for (const event of events) {
    const count = seen.get(event.hash) || 0;
    seen.set(event.hash, count + 1);
    if (count > 0) duplicates++;
  }
  return duplicates;
}

function detectNodeDesync(nodes: NodeHealth[]): Array<{ nodeA: string; nodeB: string; lagMs: number }> {
  const desynced: Array<{ nodeA: string; nodeB: string; lagMs: number }> = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (a.region === b.region) {
        const lag = Math.abs(a.lastHeartbeat - b.lastHeartbeat);
        if (lag > DESYNC_THRESHOLD_MS) {
          desynced.push({ nodeA: a.nodeId, nodeB: b.nodeId, lagMs: lag });
        }
      }
    }
  }
  return desynced;
}

function detectInvalidOrderings(events: EventSample[]): number {
  if (events.length < 2) return 0;
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  let invalidCount = 0;
  for (let i = 1; i < Math.min(sorted.length, ORDERING_WINDOW); i++) {
    if (sorted[i].sequenceNumber < sorted[i - 1].sequenceNumber) {
      if (sorted[i].nodeId === sorted[i - 1].nodeId) {
        invalidCount++;
      }
    }
  }
  return invalidCount;
}

export class SystemHealthMonitor {
  private nodeRegistry: Map<string, NodeHealth> = new Map();
  private memorySamples: MemorySample[] = [];
  private eventSamples: EventSample[] = [];
  private reportHistory: SystemHealthReport[] = [];
  private listeners: HealthListener[] = [];
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private baselineThroughput: Map<string, number> = new Map();

  registerNode(nodeId: string, region: string): void {
    this.nodeRegistry.set(nodeId, {
      nodeId,
      region,
      status: 'healthy',
      metrics: [],
      lastHeartbeat: Date.now(),
      uptime: 0,
      eventThroughput: 0,
      errorRate: 0,
    });
  }

  unregisterNode(nodeId: string): void {
    this.nodeRegistry.delete(nodeId);
    this.baselineThroughput.delete(nodeId);
  }

  recordHeartbeat(nodeId: string): void {
    const node = this.nodeRegistry.get(nodeId);
    if (node) {
      node.lastHeartbeat = Date.now();
    }
  }

  recordMemorySample(heapUsed: number, heapTotal: number): void {
    this.memorySamples.push({ heapUsed, heapTotal, timestamp: Date.now() });
    if (this.memorySamples.length > MEMORY_LEAK_WINDOW * 3) {
      this.memorySamples = this.memorySamples.slice(-MEMORY_LEAK_WINDOW * 2);
    }
  }

  recordEvent(eventId: string, payload: unknown, sequenceNumber: number, nodeId: string): void {
    const hash = simpleHash(stableStringify(payload));
    this.eventSamples.push({
      eventId,
      hash,
      sequenceNumber,
      nodeId,
      timestamp: Date.now(),
    });
    const cutoff = Date.now() - DUPLICATION_WINDOW_MS;
    this.eventSamples = this.eventSamples.filter(e => e.timestamp > cutoff);

    const node = this.nodeRegistry.get(nodeId);
    if (node) {
      node.eventThroughput++;
    }
  }

  recordError(nodeId: string): void {
    const node = this.nodeRegistry.get(nodeId);
    if (node) {
      const totalEvents = Math.max(node.eventThroughput, 1);
      node.errorRate = node.errorRate * 0.9 + (1 / totalEvents) * 0.1;
    }
  }

  generateReport(): SystemHealthReport {
    const now = Date.now();
    const anomalies: HealthAnomaly[] = [];
    const nodes: NodeHealth[] = [];

    for (const node of this.nodeRegistry.values()) {
      const timeSinceHeartbeat = now - node.lastHeartbeat;
      if (timeSinceHeartbeat > HEARTBEAT_TIMEOUT_MS) {
        node.status = 'offline';
      } else if (node.errorRate > ERROR_RATE_THRESHOLD) {
        node.status = 'degraded';
      } else {
        node.status = 'healthy';
      }
      nodes.push({ ...node });
    }

    const memoryPressure = this.calculateMemoryPressure();
    const memoryLeakDetected = detectMemoryLeak(this.memorySamples);
    if (memoryLeakDetected) {
      anomalies.push({
        type: 'memory_leak',
        severity: 'critical',
        message: 'Sustained memory growth detected over ' + MEMORY_LEAK_WINDOW + ' samples',
        affectedNodes: nodes.map(n => n.nodeId),
        detectedAt: now,
        metadata: {
          currentPressure: memoryPressure,
          sampleCount: this.memorySamples.length,
        },
      });
    }

    const duplicateCount = detectDuplicateEvents(this.eventSamples);
    const duplicationRate = this.eventSamples.length > 0
      ? duplicateCount / this.eventSamples.length
      : 0;
    if (duplicationRate > DUPLICATION_RATE_THRESHOLD) {
      anomalies.push({
        type: 'event_duplication',
        severity: duplicationRate > 0.1 ? 'critical' : 'degraded',
        message: 'Event duplication rate ' + (duplicationRate * 100).toFixed(1) + '% exceeds threshold',
        affectedNodes: [...new Set(this.eventSamples.filter((e, i, arr) =>
          arr.findIndex(x => x.hash === e.hash) !== i
        ).map(e => e.nodeId))],
        detectedAt: now,
        metadata: { duplicationRate, duplicateCount, totalEvents: this.eventSamples.length },
      });
    }

    const desyncNodePairs = detectNodeDesync(nodes);
    if (desyncNodePairs.length > 0) {
      anomalies.push({
        type: 'node_desync',
        severity: desyncNodePairs.some(d => d.lagMs > DESYNC_THRESHOLD_MS * 3) ? 'critical' : 'degraded',
        message: desyncNodePairs.length + ' node pair(s) detected out of sync',
        affectedNodes: desyncNodePairs.flatMap(d => [d.nodeA, d.nodeB]),
        detectedAt: now,
        metadata: { pairs: desyncNodePairs },
      });
    }

    const invalidOrderings = detectInvalidOrderings(this.eventSamples);
    if (invalidOrderings > 0) {
      anomalies.push({
        type: 'invalid_ordering',
        severity: 'degraded',
        message: invalidOrderings + ' invalid event ordering(s) detected',
        affectedNodes: [...new Set(this.eventSamples.map(e => e.nodeId))],
        detectedAt: now,
        metadata: { invalidOrderings },
      });
    }

    for (const node of nodes) {
      const baseline = this.baselineThroughput.get(node.nodeId);
      if (baseline !== undefined && baseline > 0) {
        const currentRate = node.eventThroughput / (THROUGHPUT_WINDOW_MS / 1000);
        const baselineRate = baseline / (THROUGHPUT_WINDOW_MS / 1000);
        if (currentRate < baselineRate * THROUGHPUT_DROP_THRESHOLD) {
          anomalies.push({
            type: 'throughput_drop',
            severity: 'degraded',
            message: 'Node ' + node.nodeId + ' throughput dropped below ' + (THROUGHPUT_DROP_THRESHOLD * 100) + '% of baseline',
            affectedNodes: [node.nodeId],
            detectedAt: now,
            metadata: { currentRate, baselineRate },
          });
        }
      }

      if (node.errorRate > ERROR_RATE_THRESHOLD * 2) {
        anomalies.push({
          type: 'error_spike',
          severity: 'critical',
          message: 'Node ' + node.nodeId + ' error rate at ' + (node.errorRate * 100).toFixed(1) + '%',
          affectedNodes: [node.nodeId],
          detectedAt: now,
          metadata: { errorRate: node.errorRate },
        });
      }
    }

    const overallStatus = this.determineOverallStatus(nodes, anomalies);

    const report: SystemHealthReport = {
      overallStatus,
      nodes,
      anomalies,
      memoryPressure,
      eventDuplicationRate: duplicationRate,
      desyncNodePairs,
      invalidEventOrderings: invalidOrderings,
      generatedAt: now,
    };

    this.reportHistory.push(report);
    if (this.reportHistory.length > 1000) {
      this.reportHistory = this.reportHistory.slice(-500);
    }

    this.notify(report);
    return report;
  }

  startMonitoring(intervalMs: number): void {
    if (this.monitoringInterval) return;
    this.monitoringInterval = setInterval(() => {
      this.generateReport();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  calibrateBaseline(nodeId: string): void {
    const node = this.nodeRegistry.get(nodeId);
    if (node) {
      this.baselineThroughput.set(nodeId, node.eventThroughput);
    }
  }

  getReportHistory(): SystemHealthReport[] {
    return [...this.reportHistory];
  }

  onHealthReport(listener: HealthListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private calculateMemoryPressure(): number {
    if (this.memorySamples.length === 0) return 0;
    const latest = this.memorySamples[this.memorySamples.length - 1];
    if (latest.heapTotal === 0) return 0;
    return latest.heapUsed / latest.heapTotal;
  }

  private determineOverallStatus(nodes: NodeHealth[], anomalies: HealthAnomaly[]): HealthStatus {
    if (anomalies.some(a => a.severity === 'critical')) return 'critical';
    if (nodes.some(n => n.status === 'offline')) return 'critical';
    if (anomalies.some(a => a.severity === 'degraded')) return 'degraded';
    if (nodes.some(n => n.status === 'degraded')) return 'degraded';
    return 'healthy';
  }

  private notify(report: SystemHealthReport): void {
    for (const listener of this.listeners) {
      listener(report);
    }
  }
}