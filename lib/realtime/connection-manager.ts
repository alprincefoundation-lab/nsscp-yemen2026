/**
 * Connection Manager — Manages real-time client connections with heartbeat monitoring
 * Supports connection pooling, health checks, and graceful degradation
 */

export interface ConnectionInfo {
  id: string;
  region: string;
  connectedAt: number;
  lastHeartbeat: number;
  metadata: Record<string, unknown>;
  status: 'ACTIVE' | 'IDLE' | 'DEGRADED' | 'DISCONNECTED';
  subscriptions: string[];
  messageCount: number;
  latencyMs: number;
}

export interface ConnectionManagerConfig {
  heartbeatIntervalMs: number;
  heartbeatTimeoutMs: number;
  idleThresholdMs: number;
  maxConnections: number;
  degradedLatencyMs: number;
}

const DEFAULT_CONFIG: ConnectionManagerConfig = {
  heartbeatIntervalMs: 5000,
  heartbeatTimeoutMs: 15000,
  idleThresholdMs: 30000,
  maxConnections: 10000,
  degradedLatencyMs: 500,
};

export class ConnectionManager {
  private static instance: ConnectionManager | null = null;
  private connections: Map<string, ConnectionInfo> = new Map();
  private config: ConnectionManagerConfig;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private onDisconnectCallbacks: Map<string, (conn: ConnectionInfo) => void> = new Map();

  private constructor(config: Partial<ConnectionManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startHeartbeatMonitor();
  }

  static getInstance(config?: Partial<ConnectionManagerConfig>): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager(config);
    }
    return ConnectionManager.instance;
  }

  registerConnection(id: string, region: string, metadata: Record<string, unknown> = {}): ConnectionInfo {
    if (this.connections.size >= this.config.maxConnections) {
      this.evictIdlestConnection();
    }

    const conn: ConnectionInfo = {
      id,
      region,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
      metadata,
      status: 'ACTIVE',
      subscriptions: [],
      messageCount: 0,
      latencyMs: 0,
    };

    this.connections.set(id, conn);
    return conn;
  }

  unregisterConnection(id: string): ConnectionInfo | null {
    const conn = this.connections.get(id);
    if (conn) {
      conn.status = 'DISCONNECTED';
      this.connections.delete(id);
      const callback = this.onDisconnectCallbacks.get(id);
      if (callback) {
        callback(conn);
        this.onDisconnectCallbacks.delete(id);
      }
    }
    return conn ?? null;
  }

  heartbeat(id: string, latencyMs = 0): boolean {
    const conn = this.connections.get(id);
    if (!conn) return false;

    conn.lastHeartbeat = Date.now();
    conn.latencyMs = latencyMs;

    if (latencyMs > this.config.degradedLatencyMs) {
      conn.status = 'DEGRADED';
    } else {
      conn.status = 'ACTIVE';
    }

    return true;
  }

  addSubscription(id: string, topic: string): boolean {
    const conn = this.connections.get(id);
    if (!conn) return false;
    if (!conn.subscriptions.includes(topic)) {
      conn.subscriptions.push(topic);
    }
    return true;
  }

  removeSubscription(id: string, topic: string): boolean {
    const conn = this.connections.get(id);
    if (!conn) return false;
    conn.subscriptions = conn.subscriptions.filter(t => t !== topic);
    return true;
  }

  incrementMessageCount(id: string): void {
    const conn = this.connections.get(id);
    if (conn) conn.messageCount++;
  }

  getConnection(id: string): ConnectionInfo | null {
    return this.connections.get(id) ?? null;
  }

  getConnectionsByRegion(region: string): ConnectionInfo[] {
    return Array.from(this.connections.values()).filter(c => c.region === region);
  }

  getConnectionsByTopic(topic: string): ConnectionInfo[] {
    return Array.from(this.connections.values()).filter(c => c.subscriptions.includes(topic));
  }

  getActiveConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values()).filter(c => c.status === 'ACTIVE');
  }

  getAllConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  onDisconnect(id: string, callback: (conn: ConnectionInfo) => void): () => void {
    this.onDisconnectCallbacks.set(id, callback);
    return () => this.onDisconnectCallbacks.delete(id);
  }

  getMetrics() {
    const conns = Array.from(this.connections.values());
    const active = conns.filter(c => c.status === 'ACTIVE').length;
    const degraded = conns.filter(c => c.status === 'DEGRADED').length;
    const idle = conns.filter(c => c.status === 'IDLE').length;
    const avgLatency = conns.length > 0
      ? conns.reduce((sum, c) => sum + c.latencyMs, 0) / conns.length
      : 0;

    const regionDistribution: Record<string, number> = {};
    for (const conn of conns) {
      regionDistribution[conn.region] = (regionDistribution[conn.region] || 0) + 1;
    }

    return {
      total: conns.length,
      active,
      degraded,
      idle,
      avgLatency: Math.round(avgLatency),
      regionDistribution,
      totalMessages: conns.reduce((sum, c) => sum + c.messageCount, 0),
    };
  }

  private startHeartbeatMonitor(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      for (const [id, conn] of this.connections) {
        const timeSinceHeartbeat = now - conn.lastHeartbeat;

        if (timeSinceHeartbeat > this.config.heartbeatTimeoutMs) {
          this.unregisterConnection(id);
        } else if (timeSinceHeartbeat > this.config.idleThresholdMs) {
          conn.status = 'IDLE';
        }
      }
    }, this.config.heartbeatIntervalMs);
  }

  private evictIdlestConnection(): void {
    let oldest: ConnectionInfo | null = null;
    for (const conn of this.connections.values()) {
      if (!oldest || conn.lastHeartbeat < oldest.lastHeartbeat) {
        oldest = conn;
      }
    }
    if (oldest) {
      this.unregisterConnection(oldest.id);
    }
  }

  destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const [id] of this.connections) {
      this.unregisterConnection(id);
    }
    this.connections.clear();
    ConnectionManager.instance = null;
  }
}

export const connectionManager = ConnectionManager.getInstance();