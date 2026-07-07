export type EscalationLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'LOCKDOWN';

export type EscalationTrigger = {
  type: string;
  region: string;
  severity: EscalationLevel;
  score: number;
  timestamp: number;
  metadata: Record<string, unknown>;
};

export type EscalationState = {
  currentLevel: EscalationLevel;
  activeRegions: string[];
  escalationHistory: EscalationTrigger[];
  cooldownUntil: number;
  autoLockdownActive: boolean;
  lastEscalationAt: number;
  consecutiveCriticalCount: number;
};

export type EscalationAction = {
  level: EscalationLevel;
  action: string;
  targetRegions: string[];
  executedAt: number;
  automated: boolean;
};

export type EscalationConfig = {
  levelThresholds: Record<EscalationLevel, number>;
  escalationCooldownMs: number;
  deescalationDelayMs: number;
  autoLockdownThreshold: number;
  consecutiveCriticalForLockdown: number;
};

const DEFAULT_CONFIG: EscalationConfig = {
  levelThresholds: {
    LOW: 0.3,
    MEDIUM: 0.5,
    HIGH: 0.7,
    CRITICAL: 0.9,
    LOCKDOWN: 1.0,
  },
  escalationCooldownMs: 30000,
  deescalationDelayMs: 60000,
  autoLockdownThreshold: 0.95,
  consecutiveCriticalForLockdown: 3,
};

const LEVEL_ORDER: EscalationLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'LOCKDOWN'];

function getLevelIndex(level: EscalationLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

function isHigherThan(a: EscalationLevel, b: EscalationLevel): boolean {
  return getLevelIndex(a) > getLevelIndex(b);
}

function classifyLevel(score: number, thresholds: EscalationConfig['levelThresholds']): EscalationLevel {
  if (score >= thresholds.LOCKDOWN) return 'LOCKDOWN';
  if (score >= thresholds.CRITICAL) return 'CRITICAL';
  if (score >= thresholds.HIGH) return 'HIGH';
  if (score >= thresholds.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

function levelToAction(level: EscalationLevel): string {
  switch (level) {
    case 'LOW': return 'LOG_AND_MONITOR';
    case 'MEDIUM': return 'ALERT_OPERATORS';
    case 'HIGH': return 'INCREASE_PATROL_AND_ALERT';
    case 'CRITICAL': return 'LOCK_REGION_RESOURCES';
    case 'LOCKDOWN': return 'FULL_SYSTEM_LOCKDOWN';
  }
}

export class AutoEscalationEngine {
  private state: EscalationState;
  private config: EscalationConfig;
  private actionHistory: EscalationAction[] = [];
  private listeners: Array<(state: EscalationState, action: EscalationAction) => void> = [];
  private deescalationTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config?: Partial<EscalationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      currentLevel: 'LOW',
      activeRegions: [],
      escalationHistory: [],
      cooldownUntil: 0,
      autoLockdownActive: false,
      lastEscalationAt: 0,
      consecutiveCriticalCount: 0,
    };
  }

  processScore(score: number, type: string, region: string, metadata: Record<string, unknown> = {}): EscalationAction | null {
    const now = Date.now();
    const targetLevel = classifyLevel(score, this.config.levelThresholds);

    if (now < this.state.cooldownUntil) {
      return null;
    }

    const trigger: EscalationTrigger = {
      type,
      region,
      severity: targetLevel,
      score,
      timestamp: now,
      metadata,
    };

    this.state.escalationHistory.push(trigger);
    if (this.state.escalationHistory.length > 1000) {
      this.state.escalationHistory = this.state.escalationHistory.slice(-500);
    }

    if (isHigherThan(targetLevel, this.state.currentLevel)) {
      return this.escalate(targetLevel, region);
    }

    if (targetLevel === 'CRITICAL') {
      this.state.consecutiveCriticalCount++;
      if (this.state.consecutiveCriticalCount >= this.config.consecutiveCriticalForLockdown) {
        return this.escalate('LOCKDOWN', region);
      }
    } else {
      this.state.consecutiveCriticalCount = Math.max(0, this.state.consecutiveCriticalCount - 1);
    }

    this.maybeDeescalate(now);
    return null;
  }

  processBatchScores(scores: Array<{ score: number; type: string; region: string; metadata?: Record<string, unknown> }>): EscalationAction[] {
    const actions: EscalationAction[] = [];
    for (const s of scores) {
      const action = this.processScore(s.score, s.type, s.region, s.metadata);
      if (action) actions.push(action);
    }
    return actions;
  }

  activateLockdown(region: string): EscalationAction {
    return this.escalate('LOCKDOWN', region);
  }

  deactivateLockdown(): void {
    this.state.autoLockdownActive = false;
    this.state.currentLevel = 'HIGH';
    this.state.consecutiveCriticalCount = 0;
    this.state.cooldownUntil = Date.now() + this.config.deescalationDelayMs;
  }

  manualOverride(level: EscalationLevel): void {
    this.state.currentLevel = level;
    this.state.cooldownUntil = Date.now() + this.config.escalationCooldownMs;
  }

  getState(): EscalationState {
    return { ...this.state };
  }

  getCurrentLevel(): EscalationLevel {
    return this.state.currentLevel;
  }

  isActive(): boolean {
    return this.state.currentLevel !== 'LOW';
  }

  isLockdownActive(): boolean {
    return this.state.autoLockdownActive;
  }

  getActionHistory(count: number = 100): EscalationAction[] {
    return this.actionHistory.slice(-count);
  }

  getEscalationHistory(count: number = 100): EscalationTrigger[] {
    return this.state.escalationHistory.slice(-count);
  }

  onEscalation(listener: (state: EscalationState, action: EscalationAction) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private escalate(targetLevel: EscalationLevel, region: string): EscalationAction {
    const now = Date.now();

    this.state.currentLevel = targetLevel;
    this.state.lastEscalationAt = now;
    this.state.cooldownUntil = now + this.config.escalationCooldownMs;

    if (!this.state.activeRegions.includes(region)) {
      this.state.activeRegions.push(region);
    }

    if (targetLevel === 'LOCKDOWN') {
      this.state.autoLockdownActive = true;
    }

    const action: EscalationAction = {
      level: targetLevel,
      action: levelToAction(targetLevel),
      targetRegions: [...this.state.activeRegions],
      executedAt: now,
      automated: true,
    };

    this.actionHistory.push(action);
    if (this.actionHistory.length > 1000) {
      this.actionHistory = this.actionHistory.slice(-500);
    }

    this.notify(action);
    return action;
  }

  private maybeDeescalate(now: number): void {
    if (this.state.currentLevel === 'LOW') return;
    if (now < this.state.lastEscalationAt + this.config.deescalationDelayMs) return;

    const recentTriggers = this.state.escalationHistory.filter(
      t => t.timestamp > now - this.config.deescalationDelayMs,
    );

    const recentMaxLevel: EscalationLevel = recentTriggers.length > 0
      ? recentTriggers.reduce<EscalationLevel>((max, t) => {
          return isHigherThan(t.severity, max) ? t.severity : max;
        }, 'LOW')
      : 'LOW';

    if (getLevelIndex(recentMaxLevel) < getLevelIndex(this.state.currentLevel)) {
      const currentIndex = getLevelIndex(this.state.currentLevel);
      const newLevel = LEVEL_ORDER[currentIndex - 1] || 'LOW';
      this.state.currentLevel = newLevel;

      if (newLevel === 'LOW') {
        this.state.activeRegions = [];
        this.state.consecutiveCriticalCount = 0;
      }
    }
  }

  private notify(action: EscalationAction): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state, action);
      } catch {
        // listener errors do not block escalation
      }
    }
  }
}