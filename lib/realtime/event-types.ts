/**
 * Global Event Type Definitions for Real-Time Command & Control System
 * Military-grade event taxonomy with severity classification
 */

export enum EventSeverity {
  DEBUG = 0,
  INFO = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  CRITICAL = 5,
  EMERGENCY = 6,
}

export enum EventCategory {
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
  OPERATIONS = 'OPERATIONS',
  INTELLIGENCE = 'INTELLIGENCE',
  THREAT = 'THREAT',
  ANOMALY = 'ANOMALY',
  COMMAND = 'COMMAND',
  SYNC = 'SYNC',
  REGION = 'REGION',
  OFFLINE = 'OFFLINE',
}

export enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ESCALATED = 'ESCALATED',
}

export interface BaseEvent {
  id: string;
  type: string;
  category: EventCategory;
  severity: EventSeverity;
  status: EventStatus;
  timestamp: number;
  source: string;
  region: string;
  correlationId?: string;
  metadata: Record<string, unknown>;
  version: number;
  ttl?: number;
}

export interface SystemEvent extends BaseEvent {
  category: EventCategory.SYSTEM;
  payload: {
    component: string;
    health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE';
    metrics: Record<string, number>;
  };
}

export interface SecurityEvent extends BaseEvent {
  category: EventCategory.SECURITY;
  payload: {
    threatType: string;
    targetId: string;
    targetType: string;
    riskScore: number;
    indicators: string[];
  };
}

export interface OperationsEvent extends BaseEvent {
  category: EventCategory.OPERATIONS;
  payload: {
    operationId: string;
    operationType: string;
    status: string;
    personnel: number;
    location: string;
    resources: string[];
  };
}

export interface IntelligenceEvent extends BaseEvent {
  category: EventCategory.INTELLIGENCE;
  payload: {
    sourceType: 'HUMINT' | 'SIGINT' | 'OSINT' | 'IMINT' | 'ANALYSIS';
    classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
    summary: string;
    entities: string[];
    confidence: number;
  };
}

export interface ThreatEvent extends BaseEvent {
  category: EventCategory.THREAT;
  payload: {
    threatId: string;
    threatLevel: number;
    threatVector: string;
    affectedRegions: string[];
    escalationChain: string[];
    estimatedImpact: number;
  };
}

export interface AnomalyEvent extends BaseEvent {
  category: EventCategory.ANOMALY;
  payload: {
    anomalyType: string;
    baseline: number;
    observed: number;
    deviation: number;
    confidence: number;
    modelVersion: string;
  };
}

export interface CommandEvent extends BaseEvent {
  category: EventCategory.COMMAND;
  payload: {
    commandId: string;
    commandType: 'DIRECTIVE' | 'ALERT' | 'DEPLOYMENT' | 'ESCALATION' | 'STAND_DOWN';
    authority: string;
    targetRegions: string[];
    priority: number;
    deadline?: number;
  };
}

export interface SyncEvent extends BaseEvent {
  category: EventCategory.SYNC;
  payload: {
    syncId: string;
    syncType: 'FULL' | 'INCREMENTAL' | 'CONFLICT_RESOLUTION';
    sourceRegion: string;
    targetRegions: string[];
    eventCount: number;
    checksum: string;
  };
}

export type DomainEvent =
  | SystemEvent
  | SecurityEvent
  | OperationsEvent
  | IntelligenceEvent
  | ThreatEvent
  | AnomalyEvent
  | CommandEvent
  | SyncEvent;

export interface EventEnvelope<T extends DomainEvent = DomainEvent> {
  id: string;
  event: T;
  channel: string;
  publishedAt: number;
  publishedBy: string;
  retryCount: number;
  maxRetries: number;
  deadLettered: boolean;
}

export interface EventFilter {
  categories?: EventCategory[];
  severities?: EventSeverity[];
  regions?: string[];
  sources?: string[];
  timeRange?: { from: number; to: number };
  types?: string[];
}

export type EventHandler = (envelope: EventEnvelope) => void | Promise<void>;

export function createEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `evt_${timestamp}_${random}`;
}

export function createCorrelationId(): string {
  return `corr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}