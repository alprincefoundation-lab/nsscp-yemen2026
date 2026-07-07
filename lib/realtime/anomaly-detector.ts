/**
 * AI Anomaly Detection Layer — Pattern matching, clustering, and threat scoring
 * Monitors event streams for anomalous behavior and escalation triggers
 */

import type { DomainEvent } from './event-types';
import { EventCategory, EventSeverity, EventStatus, createEventId, createCorrelationId } from './event-types';
import { eventBus } from './event-bus';

export interface AnomalyPattern {
  id: string;
  name: string;
  description: string;
  detector: (events: DomainEvent[], window: number) => AnomalyResult | null;
  windowMs: number;
  enabled: boolean;
}

export interface AnomalyResult {
  patternId: string;
  severity: EventSeverity;
  confidence: number; // 0-1
  description: string;
  affectedRegions: string[];
  relatedEvents: string[];
  recommendation: string;
  timestamp: number;
}

interface AnomalyState {
  activeAnomalies: AnomalyResult[];
  recentEvents: DomainEvent[];
  eventCounts: Map<string, number>;
  regionActivity: Map<string, number[]>;
}

const MAX_EVENTS_WINDOW = 500;
const ANOMALY_RETENTION_MS = 5 * 60 * 1000; // 5 minutes

export class AnomalyDetector {
  private static instance: AnomalyDetector | null = null;
  private state: AnomalyState = {
    activeAnomalies: [],
    recentEvents: [],
    eventCounts: new Map(),
    regionActivity: new Map(),
  };
  private patterns: AnomalyPattern[] = [];
  private evaluationTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(anomalies: AnomalyResult[]) => void> = new Set();

  private constructor() {
    this.registerDefaultPatterns();
  }

  static getInstance(): AnomalyDetector {
    if (!AnomalyDetector.instance) {
      AnomalyDetector.instance = new AnomalyDetector();
    }
    return AnomalyDetector.instance;
  }

  start(): void {
    eventBus.subscribe('simulation.threats', (envelope) => this.ingestEvent(envelope.event));
    eventBus.subscribe('intelligence.threats', (envelope) => this.ingestEvent(envelope.event));
    eventBus.subscribe('analytics.all', (envelope) => this.ingestEvent(envelope.event));

    this.evaluationTimer = setInterval(() => this.evaluateAll(), 2000);

    console.log('[AnomalyDetector] Started — monitoring event streams');
  }

  stop(): void {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = null;
    }
  }

  ingestEvent(event: DomainEvent): void {
    // Maintain sliding window
    this.state.recentEvents.push(event);
    if (this.state.recentEvents.length > MAX_EVENTS_WINDOW) {
      this.state.recentEvents = this.state.recentEvents.slice(-MAX_EVENTS_WINDOW);
    }

    // Update counts
    const key = `${event.region}:${event.type}`;
    this.state.eventCounts.set(key, (this.state.eventCounts.get(key) ?? 0) + 1);

    // Track region activity over time
    const regionKey = event.region;
    if (!this.state.regionActivity.has(regionKey)) {
      this.state.regionActivity.set(regionKey, []);
    }
    this.state.regionActivity.get(regionKey)!.push(event.timestamp);
  }

  private evaluateAll(): void {
    const now = Date.now();
    const newAnomalies: AnomalyResult[] = [];

    for (const pattern of this.patterns) {
      if (!pattern.enabled) continue;

      // Get events within pattern window
      const windowEvents = this.state.recentEvents.filter(
        e => now - e.timestamp < pattern.windowMs
      );

      if (windowEvents.length < 2) continue;

      const result = pattern.detector(windowEvents, pattern.windowMs);
      if (result) {
        // Deduplicate: check if same pattern already active
        const existing = this.state.activeAnomalies.find(
          a => a.patternId === result.patternId &&
               now - a.timestamp < ANOMALY_RETENTION_MS
        );

        if (!existing) {
          newAnomalies.push(result);
        }
      }
    }

    if (newAnomalies.length > 0) {
      this.state.activeAnomalies = [
        ...this.state.activeAnomalies.filter(a => now - a.timestamp < ANOMALY_RETENTION_MS),
        ...newAnomalies,
      ];

      for (const anomaly of newAnomalies) {
        eventBus.publish('intelligence.anomalies', {
          id: createEventId(),
          type: 'anomaly.detected',
          category: EventCategory.ANOMALY,
          severity: anomaly.severity,
          status: EventStatus.COMPLETED,
          source: 'system',
          region: anomaly.affectedRegions[0] ?? 'GLOBAL',
          payload: {
            anomalyType: 'pattern_detection',
            baseline: 0,
            observed: anomaly.confidence,
            deviation: anomaly.confidence,
            confidence: anomaly.confidence,
            modelVersion: 'v1',
          },
          timestamp: Date.now(),
          correlationId: createCorrelationId(),
          metadata: { anomaly },
          version: 1,
        });
      }

      // Notify listeners
      this.notifyListeners();
    }
  }

  registerPattern(pattern: AnomalyPattern): void {
    this.patterns.push(pattern);
  }

  private registerDefaultPatterns(): void {
    // Pattern 1: Rapid escalation — spike in events from single region
    this.patterns.push({
      id: 'rapid-escalation',
      name: 'Rapid Regional Escalation',
      description: 'Detects sudden spikes in threat activity from a single region',
      windowMs: 30_000, // 30 seconds
      enabled: true,
      detector: (events) => {
        const regionCounts = new Map<string, number>();
        for (const e of events) {
          regionCounts.set(e.region, (regionCounts.get(e.region) ?? 0) + 1);
        }

        for (const [region, count] of regionCounts) {
          if (count >= 8) {
            const relatedIds = events.filter(e => e.region === region).map(e => e.id);
            return {
              patternId: 'rapid-escalation',
              severity: EventSeverity.CRITICAL,
              confidence: Math.min(0.95, 0.6 + (count - 8) * 0.05),
              description: `Rapid escalation detected in ${region}: ${count} events in 30s`,
              affectedRegions: [region],
              relatedEvents: relatedIds.slice(0, 10),
              recommendation: `Initiate emergency protocol for ${region}. Increase surveillance and dispatch rapid response units.`,
              timestamp: Date.now(),
            };
          }
        }
        return null;
      },
    });

    // Pattern 2: Coordinated multi-region attack
    this.patterns.push({
      id: 'coordinated-attack',
      name: 'Coordinated Multi-Region Attack',
      description: 'Detects synchronized threat activity across multiple regions',
      windowMs: 60_000, // 60 seconds
      enabled: true,
      detector: (events) => {
        const regionCounts = new Map<string, number>();
        for (const e of events) {
          if (e.severity === EventSeverity.CRITICAL || e.severity === EventSeverity.HIGH) {
            regionCounts.set(e.region, (regionCounts.get(e.region) ?? 0) + 1);
          }
        }

        const activeRegions = [...regionCounts.entries()].filter(([, c]) => c >= 2).map(([r]) => r);

        if (activeRegions.length >= 3) {
          return {
            patternId: 'coordinated-attack',
            severity: EventSeverity.EMERGENCY,
            confidence: Math.min(0.98, 0.7 + (activeRegions.length - 3) * 0.07),
            description: `Coordinated attack pattern across ${activeRegions.length} regions: ${activeRegions.join(', ')}`,
            affectedRegions: activeRegions,
            relatedEvents: [],
            recommendation: 'ACTIVATE DEFCON 2. Deploy counter-measures across all affected regions. Notify national command authority.',
            timestamp: Date.now(),
          };
        }
        return null;
      },
    });

    // Pattern 3: Critical threat clustering
    this.patterns.push({
      id: 'critical-clustering',
      name: 'Critical Threat Clustering',
      description: 'Detects clusters of critical threats in proximity',
      windowMs: 45_000,
      enabled: true,
      detector: (events) => {
        const criticals = events.filter(e => e.severity === EventSeverity.CRITICAL);
        if (criticals.length >= 4) {
          const regions = [...new Set(criticals.map(e => e.region))];
          return {
            patternId: 'critical-clustering',
            severity: EventSeverity.CRITICAL,
            confidence: Math.min(0.95, 0.5 + criticals.length * 0.08),
            description: `${criticals.length} critical threats clustered across ${regions.length} regions`,
            affectedRegions: regions,
            relatedEvents: criticals.map(e => e.id),
            recommendation: 'Elevate threat level to ORANGE. Activate all reserve units in affected regions.',
            timestamp: Date.now(),
          };
        }
        return null;
      },
    });

    // Pattern 4: Unusual pattern — low-severity flood (potential distraction)
    this.patterns.push({
      id: 'low-severity-flood',
      name: 'Low-Severity Flood',
      description: 'Detects unusually high volume of low-severity events (potential distraction tactic)',
      windowMs: 20_000,
      enabled: true,
      detector: (events) => {
        const lowEvents = events.filter(e => e.severity === EventSeverity.LOW || e.severity === EventSeverity.MEDIUM);
        if (lowEvents.length >= 15) {
          const regions = [...new Set(lowEvents.map(e => e.region))];
          return {
            patternId: 'low-severity-flood',
            severity: EventSeverity.HIGH,
            confidence: 0.65,
            description: `Possible distraction tactic: ${lowEvents.length} low-severity events flooding ${regions.length} regions`,
            affectedRegions: regions,
            relatedEvents: lowEvents.slice(0, 5).map(e => e.id),
            recommendation: 'Investigate potential diversion. Check critical assets while attention may be divided.',
            timestamp: Date.now(),
          };
        }
        return null;
      },
    });
  }

  getActiveAnomalies(): AnomalyResult[] {
    const now = Date.now();
    return this.state.activeAnomalies.filter(a => now - a.timestamp < ANOMALY_RETENTION_MS);
  }

  subscribe(listener: (anomalies: AnomalyResult[]) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notifyListeners(): void {
    const active = this.getActiveAnomalies();
    for (const listener of this.listeners) {
      listener(active);
    }
  }

  destroy(): void {
    this.stop();
    this.state.recentEvents = [];
    this.state.activeAnomalies = [];
    this.state.eventCounts.clear();
    this.state.regionActivity.clear();
    this.listeners.clear();
    AnomalyDetector.instance = null;
  }
}

export const anomalyDetector = AnomalyDetector.getInstance();