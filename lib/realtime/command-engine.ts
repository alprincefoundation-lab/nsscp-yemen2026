/**
 * Command Decision Engine — Auto-escalation protocols and dispatch coordination
 * Implements military-grade decision trees for threat response
 */

import type { DomainEvent, AnomalyEvent } from './event-types';
import { EventCategory, EventSeverity, EventStatus, createEventId, createCorrelationId } from './event-types';
import { eventBus } from './event-bus';
import { anomalyDetector, type AnomalyResult } from './anomaly-detector';

// ─── Threat Levels (DEFCON-style) ───────────────────────────────────────────
export enum ThreatLevel {
  GREEN = 1,    // Normal operations
  BLUE = 2,     // Increased vigilance
  YELLOW = 3,   // Heightened readiness
  ORANGE = 4,   // High alert
  RED = 5,      // Maximum alert / emergency
}

export const THREAT_LEVEL_META: Record<ThreatLevel, { label: string; color: string; description: string }> = {
  [ThreatLevel.GREEN]:  { label: 'GREEN',  color: '#22c55e', description: 'Normal operations' },
  [ThreatLevel.BLUE]:   { label: 'BLUE',   color: '#3b82f6', description: 'Increased vigilance' },
  [ThreatLevel.YELLOW]: { label: 'YELLOW', color: '#eab308', description: 'Heightened readiness' },
  [ThreatLevel.ORANGE]: { label: 'ORANGE', color: '#f97316', description: 'High alert' },
  [ThreatLevel.RED]:    { label: 'RED',    color: '#ef4444', description: 'Maximum alert' },
};

// ─── Decision Types ─────────────────────────────────────────────────────────
export interface CommandDecision {
  id: string;
  type: 'escalate' | 'deploy' | 'lockdown' | 'alert' | 'stand_down' | 'reinforce';
  threatLevel: ThreatLevel;
  region: string;
  description: string;
  priority: number;
  autoExecuted: boolean;
  timestamp: number;
  relatedAnomaly?: string;
  assets: string[];
  status: 'pending' | 'executing' | 'completed' | 'cancelled';
}

export interface RegionState {
  region: string;
  threatLevel: ThreatLevel;
  activeThreats: number;
  deployedAssets: string[];
  lastDecision: CommandDecision | null;
  escalationHistory: { level: ThreatLevel; timestamp: number; reason: string }[];
}

interface CommandState {
  globalThreatLevel: ThreatLevel;
  regions: Map<string, RegionState>;
  decisions: CommandDecision[];
  protocolActive: boolean;
  autoEscalationEnabled: boolean;
}

const MAX_DECISIONS = 200;

export class CommandDecisionEngine {
  private static instance: CommandDecisionEngine | null = null;
  private state: CommandState = {
    globalThreatLevel: ThreatLevel.GREEN,
    regions: new Map(),
    decisions: [],
    protocolActive: false,
    autoEscalationEnabled: true,
  };
  private evaluationTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(state: Partial<CommandState>) => void> = new Set();

  // Province list for initialization
  private readonly PROVINCES = [
    'Sana\'a', 'Aden', 'Taiz', 'Hodeidah', 'Hadramaut', 'Marib', 'Lahj', 'Dhamar'
  ];

  private constructor() {
    this.initializeRegions();
  }

  static getInstance(): CommandDecisionEngine {
    if (!CommandDecisionEngine.instance) {
      CommandDecisionEngine.instance = new CommandDecisionEngine();
    }
    return CommandDecisionEngine.instance;
  }

  private initializeRegions(): void {
    for (const province of this.PROVINCES) {
      this.state.regions.set(province, {
        region: province,
        threatLevel: ThreatLevel.GREEN,
        activeThreats: 0,
        deployedAssets: [],
        lastDecision: null,
        escalationHistory: [{ level: ThreatLevel.GREEN, timestamp: Date.now(), reason: 'System initialization' }],
      });
    }
  }

  start(): void {
    eventBus.subscribe('intelligence.anomalies', (envelope) => this.handleAnomaly(envelope.event));
    eventBus.subscribe('command.security', (envelope) => this.handleSecurityEvent(envelope.event));
    eventBus.subscribe('simulation.threats', (envelope) => this.handleThreatEvent(envelope.event));

    this.evaluationTimer = setInterval(() => this.assessGlobalThreat(), 5000);

    this.state.protocolActive = true;
    console.log('[CommandEngine] Active — monitoring all channels');
  }

  stop(): void {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = null;
    }
    this.state.protocolActive = false;
  }

  private handleThreatEvent(event: DomainEvent): void {
    const region = event.region;
    const regionState = this.state.regions.get(region);
    if (!regionState) return;

    regionState.activeThreats++;

    // Auto-escalation based on threat accumulation
    if (this.state.autoEscalationEnabled) {
      this.evaluateRegion(region);
    }
  }

  private handleAnomaly(event: DomainEvent): void {
    const anomaly = (event as AnomalyEvent).metadata?.anomaly as AnomalyResult | undefined;
    if (!anomaly) return;

    // Critical anomaly → immediate escalation
    if (anomaly.severity === EventSeverity.EMERGENCY) {
      for (const region of anomaly.affectedRegions) {
        this.makeDecision({
          type: 'escalate',
          threatLevel: ThreatLevel.RED,
          region,
          description: `EMERGENCY: ${anomaly.description}`,
          priority: 100,
          relatedAnomaly: anomaly.patternId,
          assets: ['ALL_AVAILABLE'],
        });
      }
    } else if (anomaly.severity === EventSeverity.CRITICAL) {
      for (const region of anomaly.affectedRegions) {
        this.makeDecision({
          type: 'escalate',
          threatLevel: ThreatLevel.ORANGE,
          region,
          description: `CRITICAL ANOMALY: ${anomaly.description}`,
          priority: 85,
          relatedAnomaly: anomaly.patternId,
          assets: ['RAPID_RESPONSE'],
        });
      }
    }
  }

  private handleSecurityEvent(event: DomainEvent): void {
    const region = event.region;
    this.makeDecision({
      type: 'alert',
      threatLevel: Math.max(this.getRegionLevel(region), ThreatLevel.YELLOW) as ThreatLevel,
      region,
      description: `Security event: ${event.type}`,
      priority: 70,
      assets: ['SECURITY_TEAM'],
    });
  }

  private evaluateRegion(region: string): void {
    const regionState = this.state.regions.get(region);
    if (!regionState) return;

    const { activeThreats } = regionState;
    let recommendedLevel = ThreatLevel.GREEN;

    if (activeThreats >= 10) recommendedLevel = ThreatLevel.RED;
    else if (activeThreats >= 7) recommendedLevel = ThreatLevel.ORANGE;
    else if (activeThreats >= 4) recommendedLevel = ThreatLevel.YELLOW;
    else if (activeThreats >= 2) recommendedLevel = ThreatLevel.BLUE;

    if (recommendedLevel > regionState.threatLevel) {
      this.makeDecision({
        type: 'escalate',
        threatLevel: recommendedLevel,
        region,
        description: `Auto-escalation: ${activeThreats} active threats in ${region}`,
        priority: 50 + activeThreats * 5,
        assets: this.getAssetsForLevel(recommendedLevel),
      });
    }
  }

  private makeDecision(params: Omit<CommandDecision, 'id' | 'autoExecuted' | 'timestamp' | 'status'>): CommandDecision {
    const decision: CommandDecision = {
      ...params,
      id: `cmd_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      autoExecuted: true,
      timestamp: Date.now(),
      status: 'executing',
    };

    // Update region state
    const regionState = this.state.regions.get(decision.region);
    if (regionState) {
      if (decision.threatLevel > regionState.threatLevel) {
        regionState.threatLevel = decision.threatLevel;
        regionState.escalationHistory.push({
          level: decision.threatLevel,
          timestamp: Date.now(),
          reason: decision.description,
        });
      }
      regionState.deployedAssets = [...new Set([...regionState.deployedAssets, ...decision.assets])];
      regionState.lastDecision = decision;
    }

    // Update global threat level
    this.updateGlobalThreat();

    // Store decision
    this.state.decisions.push(decision);
    if (this.state.decisions.length > MAX_DECISIONS) {
      this.state.decisions = this.state.decisions.slice(-MAX_DECISIONS);
    }

    eventBus.publish('command.center', {
      id: decision.id,
      type: `command.${decision.type}`,
      category: EventCategory.COMMAND,
      severity: decision.threatLevel >= ThreatLevel.ORANGE ? EventSeverity.CRITICAL : EventSeverity.HIGH,
      status: EventStatus.PROCESSING,
      source: 'command',
      region: decision.region,
      payload: {
        commandId: decision.id,
        commandType: 'DIRECTIVE',
        authority: 'AUTO',
        targetRegions: [decision.region],
        priority: decision.priority,
      },
      timestamp: Date.now(),
      correlationId: createCorrelationId(),
      metadata: { decision },
      version: 1,
    });

    // Auto-complete after simulated execution
    setTimeout(() => {
      decision.status = 'completed';
      this.notifyListeners();
    }, 2000 + Math.random() * 3000);

    this.notifyListeners();
    return decision;
  }

  private updateGlobalThreat(): void {
    let maxLevel = ThreatLevel.GREEN;
    for (const [, region] of this.state.regions) {
      if (region.threatLevel > maxLevel) {
        maxLevel = region.threatLevel;
      }
    }
    this.state.globalThreatLevel = maxLevel;
  }

  private assessGlobalThreat(): void {
    // Decay inactive regions over time
    const now = Date.now();
    for (const [, region] of this.state.regions) {
      if (region.activeThreats > 0) {
        region.activeThreats = Math.max(0, region.activeThreats - 1);

        // Stand down if threats cleared
        if (region.activeThreats === 0 && region.threatLevel > ThreatLevel.GREEN) {
          region.threatLevel = Math.max(
            ThreatLevel.GREEN,
            region.threatLevel - 1
          ) as ThreatLevel;
          region.escalationHistory.push({
            level: region.threatLevel,
            timestamp: now,
            reason: 'Threat decay — no active threats',
          });
        }
      }
    }
    this.updateGlobalThreat();
    this.notifyListeners();
  }

  private getAssetsForLevel(level: ThreatLevel): string[] {
    const assetMap: Record<ThreatLevel, string[]> = {
      [ThreatLevel.GREEN]: [],
      [ThreatLevel.BLUE]: ['PATROL_UNIT'],
      [ThreatLevel.YELLOW]: ['PATROL_UNIT', 'SECURITY_TEAM'],
      [ThreatLevel.ORANGE]: ['PATROL_UNIT', 'SECURITY_TEAM', 'RAPID_RESPONSE', 'AERIAL_SURVEILLANCE'],
      [ThreatLevel.RED]: ['ALL_AVAILABLE', 'SPECIAL_OPS', 'AERIAL_SURVEILLANCE', 'RAPID_RESPONSE'],
    };
    return assetMap[level] ?? [];
  }

  private getRegionLevel(region: string): ThreatLevel {
    return this.state.regions.get(region)?.threatLevel ?? ThreatLevel.GREEN;
  }

  // ─── Public API ────────────────────────────────────────────────────────────
  getGlobalThreatLevel(): ThreatLevel {
    return this.state.globalThreatLevel;
  }

  getRegionStates(): RegionState[] {
    return [...this.state.regions.values()];
  }

  getRecentDecisions(limit = 20): CommandDecision[] {
    return this.state.decisions.slice(-limit);
  }

  isProtocolActive(): boolean {
    return this.state.protocolActive;
  }

  setAutoEscalation(enabled: boolean): void {
    this.state.autoEscalationEnabled = enabled;
  }

  manualDecision(params: Omit<CommandDecision, 'id' | 'autoExecuted' | 'timestamp' | 'status'>): CommandDecision {
    return this.makeDecision({ ...params });
  }

  subscribe(listener: (state: Partial<CommandState>) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notifyListeners(): void {
    const snapshot: Partial<CommandState> = {
      globalThreatLevel: this.state.globalThreatLevel,
      regions: new Map(this.state.regions),
      decisions: [...this.state.decisions.slice(-20)],
    };
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  destroy(): void {
    this.stop();
    this.state.regions.clear();
    this.state.decisions = [];
    this.listeners.clear();
    CommandDecisionEngine.instance = null;
  }
}

export const commandEngine = CommandDecisionEngine.getInstance();