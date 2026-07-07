export type SystemFeature = {
  id: string;
  name: string;
  priority: number;
  status: 'active' | 'degraded' | 'disabled';
  dependencies: string[];
  degradationThreshold: number;
  fallbackBehavior: () => void;
  restoreBehavior: () => void;
};

export type DegradationLevel = 'NONE' | 'PARTIAL' | 'SIGNIFICANT' | 'SEVERE' | 'MINIMAL';

export type DegradationState = {
  level: DegradationLevel;
  activeFeatures: string[];
  degradedFeatures: string[];
  disabledFeatures: string[];
  systemLoad: number;
  lastAssessed: number;
  degradationHistory: DegradationEvent[];
};

export type DegradationEvent = {
  featureId: string;
  fromStatus: SystemFeature['status'];
  toStatus: SystemFeature['status'];
  reason: string;
  timestamp: number;
  systemLoadAtTime: number;
};

export type DegradationConfig = {
  loadThresholds: Record<DegradationLevel, number>;
  assessmentIntervalMs: number;
  autoRecoveryEnabled: boolean;
  recoveryHysteresisMs: number;
  minActiveFeatures: number;
};

const DEFAULT_CONFIG: DegradationConfig = {
  loadThresholds: {
    NONE: 0.7,
    PARTIAL: 0.8,
    SIGNIFICANT: 0.85,
    SEVERE: 0.92,
    MINIMAL: 0.98,
  },
  assessmentIntervalMs: 10000,
  autoRecoveryEnabled: true,
  recoveryHysteresisMs: 30000,
  minActiveFeatures: 1,
};

function classifyLoadLevel(load: number, thresholds: DegradationConfig['loadThresholds']): DegradationLevel {
  if (load >= thresholds.MINIMAL) return 'MINIMAL';
  if (load >= thresholds.SEVERE) return 'SEVERE';
  if (load >= thresholds.SIGNIFICANT) return 'SIGNIFICANT';
  if (load >= thresholds.PARTIAL) return 'PARTIAL';
  return 'NONE';
}

export class GracefulDegradationEngine {
  private features: Map<string, SystemFeature> = new Map();
  private state: DegradationState;
  private config: DegradationConfig;
  private assessmentTimer: ReturnType<typeof setInterval> | null = null;
  private lastDegradationTime = 0;
  private listeners: Array<(state: DegradationState) => void> = [];

  constructor(config?: Partial<DegradationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      level: 'NONE',
      activeFeatures: [],
      degradedFeatures: [],
      disabledFeatures: [],
      systemLoad: 0,
      lastAssessed: Date.now(),
      degradationHistory: [],
    };
  }

  registerFeature(feature: SystemFeature): void {
    this.features.set(feature.id, feature);
    this.updateFeatureLists();
  }

  unregisterFeature(featureId: string): void {
    this.features.delete(featureId);
    this.updateFeatureLists();
  }

  assess(systemLoad: number): DegradationState {
    const now = Date.now();
    const targetLevel = classifyLoadLevel(systemLoad, this.config.loadThresholds);

    this.state.systemLoad = systemLoad;
    this.state.lastAssessed = now;
    this.state.level = targetLevel;

    const featuresByPriority = Array.from(this.features.values())
      .sort((a, b) => a.priority - b.priority);

    if (targetLevel === 'NONE') {
      if (this.config.autoRecoveryEnabled && now - this.lastDegradationTime > this.config.recoveryHysteresisMs) {
        for (const feature of featuresByPriority) {
          if (feature.status !== 'active') {
            const oldStatus = feature.status;
            feature.status = 'active';
            try {
              feature.restoreBehavior();
            } catch {
              // restore errors do not block assessment
            }
            this.addHistoryEvent(feature.id, oldStatus, 'active', 'System load recovered', systemLoad);
          }
        }
      }
    } else {
      const featuresToDisable = this.calculateFeaturesToDisable(featuresByPriority, targetLevel);

      for (const feature of featuresByPriority) {
        const shouldDisable = featuresToDisable.includes(feature.id);
        const shouldDegrade = targetLevel === 'PARTIAL' || targetLevel === 'SIGNIFICANT';
        const activeCount = featuresByPriority.filter(f => f.status === 'active').length;

        if (shouldDisable && activeCount > this.config.minActiveFeatures) {
          if (feature.status === 'active') {
            const oldStatus = feature.status;
            feature.status = 'disabled';
            try {
              feature.fallbackBehavior();
            } catch {
              // fallback errors do not block degradation
            }
            this.addHistoryEvent(feature.id, oldStatus, 'disabled', 'Load-based degradation', systemLoad);
          }
        } else if (shouldDegrade && feature.status === 'active' && feature.priority > 5) {
          const oldStatus = feature.status;
          feature.status = 'degraded';
          try {
            feature.fallbackBehavior();
          } catch {
            // fallback errors do not block degradation
          }
          this.addHistoryEvent(feature.id, oldStatus, 'degraded', 'Partial degradation', systemLoad);
        }
      }

      this.lastDegradationTime = now;
    }

    this.updateFeatureLists();
    this.notify();
    return { ...this.state };
  }

  forceDegrade(featureId: string, reason: string): boolean {
    const feature = this.features.get(featureId);
    if (!feature || feature.status !== 'active') return false;

    const oldStatus = feature.status;
    feature.status = 'degraded';
    try {
      feature.fallbackBehavior();
    } catch {
      // fallback errors do not block degradation
    }
    this.addHistoryEvent(featureId, oldStatus, 'degraded', reason, this.state.systemLoad);
    this.updateFeatureLists();
    this.notify();
    return true;
  }

  forceDisable(featureId: string, reason: string): boolean {
    const feature = this.features.get(featureId);
    if (!feature) return false;

    const oldStatus = feature.status;
    feature.status = 'disabled';
    try {
      feature.fallbackBehavior();
    } catch {
      // fallback errors do not block degradation
    }
    this.addHistoryEvent(featureId, oldStatus, 'disabled', reason, this.state.systemLoad);
    this.updateFeatureLists();
    this.notify();
    return true;
  }

  forceRestore(featureId: string): boolean {
    const feature = this.features.get(featureId);
    if (!feature || feature.status === 'active') return false;

    const activeCount = Array.from(this.features.values()).filter(f => f.status === 'active').length;
    const allDependenciesMet = feature.dependencies.every(depId => {
      const dep = this.features.get(depId);
      return dep && dep.status === 'active';
    });

    if (!allDependenciesMet) return false;

    const oldStatus = feature.status;
    feature.status = 'active';
    try {
      feature.restoreBehavior();
    } catch {
      // restore errors do not block restoration
    }
    this.addHistoryEvent(featureId, oldStatus, 'active', 'Manual restore', this.state.systemLoad);
    this.updateFeatureLists();
    this.notify();
    return true;
  }

  getState(): DegradationState {
    return { ...this.state };
  }

  getDegradationLevel(): DegradationLevel {
    return this.state.level;
  }

  isFeatureActive(featureId: string): boolean {
    const feature = this.features.get(featureId);
    return feature ? feature.status === 'active' : false;
  }

  getFeatureStatus(featureId: string): SystemFeature['status'] | null {
    const feature = this.features.get(featureId);
    return feature ? feature.status : null;
  }

  getHistory(count: number = 100): DegradationEvent[] {
    return this.state.degradationHistory.slice(-count);
  }

  startAutoAssessment(getSystemLoad: () => number): void {
    if (this.assessmentTimer) return;
    this.assessmentTimer = setInterval(() => {
      this.assess(getSystemLoad());
    }, this.config.assessmentIntervalMs);
  }

  stopAutoAssessment(): void {
    if (this.assessmentTimer) {
      clearInterval(this.assessmentTimer);
      this.assessmentTimer = null;
    }
  }

  onStateChange(listener: (state: DegradationState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private calculateFeaturesToDisable(features: SystemFeature[], level: DegradationLevel): string[] {
    const toDisable: string[] = [];

    switch (level) {
      case 'MINIMAL': {
        const lowPriority = features.filter(f => f.priority > 8 && f.status === 'active');
        toDisable.push(...lowPriority.map(f => f.id));
        break;
      }
      case 'SEVERE': {
        const mediumPlus = features.filter(f => f.priority > 5 && f.status === 'active');
        toDisable.push(...mediumPlus.map(f => f.id));
        break;
      }
      case 'SIGNIFICANT': {
        const lowMed = features.filter(f => f.priority > 7 && f.status === 'active');
        toDisable.push(...lowMed.map(f => f.id));
        break;
      }
      default:
        break;
    }

    return toDisable;
  }

  private updateFeatureLists(): void {
    this.state.activeFeatures = [];
    this.state.degradedFeatures = [];
    this.state.disabledFeatures = [];

    for (const feature of this.features.values()) {
      switch (feature.status) {
        case 'active':
          this.state.activeFeatures.push(feature.id);
          break;
        case 'degraded':
          this.state.degradedFeatures.push(feature.id);
          break;
        case 'disabled':
          this.state.disabledFeatures.push(feature.id);
          break;
      }
    }
  }

  private addHistoryEvent(
    featureId: string,
    fromStatus: SystemFeature['status'],
    toStatus: SystemFeature['status'],
    reason: string,
    systemLoad: number,
  ): void {
    this.state.degradationHistory.push({
      featureId,
      fromStatus,
      toStatus,
      reason,
      timestamp: Date.now(),
      systemLoadAtTime: systemLoad,
    });

    if (this.state.degradationHistory.length > 5000) {
      this.state.degradationHistory = this.state.degradationHistory.slice(-2500);
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch {
        // listener errors do not block degradation engine
      }
    }
  }
}