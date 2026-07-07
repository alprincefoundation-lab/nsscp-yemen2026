export type DecisionContext = {
  anomalies: AnomalyInput[];
  regionHealth: RegionHealthInput[];
  systemLoad: SystemLoadInput;
  eventCorrelations: EventCorrelationInput[];
  timestamp: number;
};

export type AnomalyInput = {
  type: string;
  region: string;
  score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: number;
  metadata: Record<string, unknown>;
};

export type RegionHealthInput = {
  region: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  activeNodes: number;
  totalNodes: number;
  eventThroughput: number;
  errorRate: number;
  replicationLagMs: number;
};

export type SystemLoadInput = {
  cpuUtilization: number;
  memoryUtilization: number;
  eventQueueDepth: number;
  activeConnections: number;
  requestRate: number;
};

export type EventCorrelationInput = {
  eventA: string;
  eventB: string;
  region: string;
  correlationStrength: number;
  coOccurrenceCount: number;
};

export type Decision = {
  id: string;
  type: DecisionType;
  priority: number;
  confidence: number;
  recommendedActions: RecommendedAction[];
  rollbackSafe: boolean;
  reasoning: string[];
  context: DecisionContext;
  graph: DecisionGraph;
  computedAt: number;
};

export type DecisionType =
  | 'ESCALATE_SECURITY'
  | 'REDUCE_LOAD'
  | 'FAILOVER_REGION'
  | 'ISOLATE_REGION'
  | 'INCREASE_MONITORING'
  | 'TRIGGER_REPAIR'
  | 'THROTTLE_EVENTS'
  | 'LOCKDOWN'
  | 'NO_ACTION';

export type RecommendedAction = {
  action: string;
  target: string;
  priority: number;
  estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
  reversible: boolean;
  parameters: Record<string, unknown>;
};

export type DecisionGraph = {
  nodes: DecisionNode[];
  edges: DecisionEdge[];
  rootId: string;
  terminalNodeId: string;
};

export type DecisionNode = {
  id: string;
  label: string;
  type: 'condition' | 'action' | 'terminal';
  evaluated: boolean;
  result: boolean | null;
};

export type DecisionEdge = {
  from: string;
  to: string;
  condition: string;
  weight: number;
};

function generateId(): string {
  return Date.now().toString(36) + '-' + Math.floor(Math.random() * 0xFFFFFF).toString(36);
}

function computeAggregateAnomalyScore(anomalies: AnomalyInput[]): number {
  if (anomalies.length === 0) return 0;
  const weights = { LOW: 0.25, MEDIUM: 0.5, HIGH: 0.75, CRITICAL: 1.0 };
  let total = 0;
  for (const a of anomalies) {
    total += a.score * weights[a.severity];
  }
  return Math.min(total / anomalies.length, 1);
}

function computeSystemStress(load: SystemLoadInput): number {
  const cpuWeight = 0.3;
  const memWeight = 0.3;
  const queueWeight = 0.2;
  const connWeight = 0.1;
  const rateWeight = 0.1;

  return (
    load.cpuUtilization * cpuWeight +
    load.memoryUtilization * memWeight +
    Math.min(load.eventQueueDepth / 10000, 1) * queueWeight +
    Math.min(load.activeConnections / 1000, 1) * connWeight +
    Math.min(load.requestRate / 5000, 1) * rateWeight
  );
}

function buildDecisionGraph(context: DecisionContext, decisionType: DecisionType): DecisionGraph {
  const nodes: DecisionNode[] = [];
  const edges: DecisionEdge[] = [];

  const rootId = 'root';
  const terminalNodeId = 'terminal';

  nodes.push({ id: rootId, label: 'Evaluate Context', type: 'condition', evaluated: true, result: true });
  nodes.push({ id: terminalNodeId, label: 'Decision: ' + decisionType, type: 'terminal', evaluated: true, result: null });

  let prevId = rootId;
  let stepIndex = 0;

  if (context.anomalies.length > 0) {
    const nodeId = 'step_' + stepIndex++;
    nodes.push({ id: nodeId, label: 'Anomalies Detected: ' + context.anomalies.length, type: 'condition', evaluated: true, result: true });
    edges.push({ from: prevId, to: nodeId, condition: 'anomalies.length > 0', weight: 1 });
    prevId = nodeId;
  }

  const criticalRegions = context.regionHealth.filter(r => r.status === 'critical' || r.status === 'offline');
  if (criticalRegions.length > 0) {
    const nodeId = 'step_' + stepIndex++;
    nodes.push({ id: nodeId, label: 'Critical Regions: ' + criticalRegions.map(r => r.region).join(', '), type: 'condition', evaluated: true, result: true });
    edges.push({ from: prevId, to: nodeId, condition: 'criticalRegions.length > 0', weight: 0.9 });
    prevId = nodeId;
  }

  const systemStress = computeSystemStress(context.systemLoad);
  if (systemStress > 0.8) {
    const nodeId = 'step_' + stepIndex++;
    nodes.push({ id: nodeId, label: 'High System Stress: ' + (systemStress * 100).toFixed(0) + '%', type: 'condition', evaluated: true, result: true });
    edges.push({ from: prevId, to: nodeId, condition: 'systemStress > 0.8', weight: 0.8 });
    prevId = nodeId;
  }

  if (context.eventCorrelations.length > 0) {
    const strongCorrelations = context.eventCorrelations.filter(c => c.correlationStrength > 0.7);
    if (strongCorrelations.length > 0) {
      const nodeId = 'step_' + stepIndex++;
      nodes.push({ id: nodeId, label: 'Strong Correlations: ' + strongCorrelations.length, type: 'condition', evaluated: true, result: true });
      edges.push({ from: prevId, to: nodeId, condition: 'strongCorrelations.length > 0', weight: 0.7 });
      prevId = nodeId;
    }
  }

  const actionNode = 'action_' + stepIndex;
  nodes.push({ id: actionNode, label: 'Execute: ' + decisionType, type: 'action', evaluated: true, result: true });
  edges.push({ from: prevId, to: actionNode, condition: 'decision reached', weight: 1 });
  edges.push({ from: actionNode, to: terminalNodeId, condition: 'complete', weight: 1 });

  return { nodes, edges, rootId, terminalNodeId };
}

export class AutonomousDecisionEngine {
  private decisionHistory: Decision[] = [];
  private listeners: Array<(decision: Decision) => void> = [];
  private maxHistorySize: number;
  private confidenceThreshold: number;

  constructor(confidenceThreshold: number = 0.6, maxHistorySize: number = 5000) {
    this.confidenceThreshold = confidenceThreshold;
    this.maxHistorySize = maxHistorySize;
  }

  decide(context: DecisionContext): Decision {
    const decisionType = this.evaluateDecisionType(context);
    const confidence = this.computeConfidence(context);
    const priority = this.computePriority(context);
    const recommendedActions = this.generateActions(decisionType, context);
    const rollbackSafe = this.evaluateRollbackSafety(decisionType, context);
    const reasoning = this.generateReasoning(context, decisionType);

    const graph = buildDecisionGraph(context, decisionType);

    const decision: Decision = {
      id: generateId(),
      type: decisionType,
      priority,
      confidence,
      recommendedActions,
      rollbackSafe,
      reasoning,
      context,
      graph,
      computedAt: Date.now(),
    };

    this.decisionHistory.push(decision);
    if (this.decisionHistory.length > this.maxHistorySize) {
      this.decisionHistory = this.decisionHistory.slice(-this.maxHistorySize / 2);
    }

    this.notify(decision);
    return decision;
  }

  getDecisionHistory(count: number = 100): Decision[] {
    return this.decisionHistory.slice(-count);
  }

  getConfidenceThreshold(): number {
    return this.confidenceThreshold;
  }

  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
  }

  onDecision(listener: (decision: Decision) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private evaluateDecisionType(context: DecisionContext): DecisionType {
    const anomalyScore = computeAggregateAnomalyScore(context.anomalies);
    const systemStress = computeSystemStress(context.systemLoad);
    const criticalRegions = context.regionHealth.filter(r => r.status === 'critical' || r.status === 'offline');
    const degradedRegions = context.regionHealth.filter(r => r.status === 'degraded');

    if (anomalyScore > 0.9 && criticalRegions.length > 0) {
      return 'LOCKDOWN';
    }

    if (anomalyScore > 0.8) {
      return 'ESCALATE_SECURITY';
    }

    if (criticalRegions.length > 0) {
      return 'FAILOVER_REGION';
    }

    if (systemStress > 0.85) {
      return 'REDUCE_LOAD';
    }

    if (degradedRegions.length >= context.regionHealth.length / 2) {
      return 'ISOLATE_REGION';
    }

    if (systemStress > 0.7) {
      return 'THROTTLE_EVENTS';
    }

    if (anomalyScore > 0.5) {
      return 'TRIGGER_REPAIR';
    }

    if (anomalyScore > 0.3 || degradedRegions.length > 0) {
      return 'INCREASE_MONITORING';
    }

    return 'NO_ACTION';
  }

  private computeConfidence(context: DecisionContext): number {
    const dataPoints =
      context.anomalies.length +
      context.regionHealth.length +
      context.eventCorrelations.length;

    const dataConfidence = Math.min(dataPoints / 20, 1);

    const anomalyConsistency = context.anomalies.length > 0
      ? 1 - (context.anomalies.reduce((sum, a) => sum + Math.abs(a.score - computeAggregateAnomalyScore(context.anomalies)), 0) / context.anomalies.length)
      : 1;

    return (dataConfidence * 0.6 + anomalyConsistency * 0.4);
  }

  private computePriority(context: DecisionContext): number {
    let priority = 0;

    const anomalyScore = computeAggregateAnomalyScore(context.anomalies);
    priority += anomalyScore * 40;

    const criticalRegions = context.regionHealth.filter(r => r.status === 'critical' || r.status === 'offline');
    priority += criticalRegions.length * 20;

    const systemStress = computeSystemStress(context.systemLoad);
    priority += systemStress * 25;

    const strongCorrelations = context.eventCorrelations.filter(c => c.correlationStrength > 0.7);
    priority += strongCorrelations.length * 5;

    return Math.min(Math.round(priority), 100);
  }

  private generateActions(type: DecisionType, context: DecisionContext): RecommendedAction[] {
    const actions: RecommendedAction[] = [];

    switch (type) {
      case 'LOCKDOWN':
        actions.push({
          action: 'LOCK_ALL_REGIONS',
          target: 'system',
          priority: 100,
          estimatedImpact: 'critical',
          reversible: true,
          parameters: { regions: context.regionHealth.map(r => r.region) },
        });
        actions.push({
          action: 'FREEZE_EVENT_QUEUE',
          target: 'event-bus',
          priority: 99,
          estimatedImpact: 'high',
          reversible: true,
          parameters: {},
        });
        break;

      case 'ESCALATE_SECURITY':
        actions.push({
          action: 'INCREASE_PATROL',
          target: 'operations',
          priority: 80,
          estimatedImpact: 'medium',
          reversible: true,
          parameters: { regions: context.regionHealth.filter(r => r.status !== 'healthy').map(r => r.region) },
        });
        actions.push({
          action: 'ALERT_ALL_STATIONS',
          target: 'communications',
          priority: 85,
          estimatedImpact: 'medium',
          reversible: false,
          parameters: { message: 'Security escalation triggered' },
        });
        break;

      case 'FAILOVER_REGION':
        for (const region of context.regionHealth.filter(r => r.status === 'critical' || r.status === 'offline')) {
          actions.push({
            action: 'FAILOVER',
            target: region.region,
            priority: 90,
            estimatedImpact: 'high',
            reversible: true,
            parameters: { activeNodes: region.activeNodes, totalNodes: region.totalNodes },
          });
        }
        break;

      case 'ISOLATE_REGION':
        for (const region of context.regionHealth.filter(r => r.status === 'degraded')) {
          actions.push({
            action: 'ISOLATE',
            target: region.region,
            priority: 70,
            estimatedImpact: 'medium',
            reversible: true,
            parameters: { errorRate: region.errorRate },
          });
        }
        break;

      case 'REDUCE_LOAD':
        actions.push({
          action: 'THROTTLE_INGESTION',
          target: 'ingress-pipeline',
          priority: 60,
          estimatedImpact: 'medium',
          reversible: true,
          parameters: { reducePercent: 50 },
        });
        actions.push({
          action: 'DEFER_NON_CRITICAL',
          target: 'event-bus',
          priority: 55,
          estimatedImpact: 'low',
          reversible: true,
          parameters: {},
        });
        break;

      case 'THROTTLE_EVENTS':
        actions.push({
          action: 'THROTTLE_INGESTION',
          target: 'ingress-pipeline',
          priority: 50,
          estimatedImpact: 'low',
          reversible: true,
          parameters: { reducePercent: 25 },
        });
        break;

      case 'TRIGGER_REPAIR':
        actions.push({
          action: 'RUN_AUTO_REPAIR',
          target: 'self-healing',
          priority: 40,
          estimatedImpact: 'low',
          reversible: true,
          parameters: { regions: context.regionHealth.map(r => r.region) },
        });
        break;

      case 'INCREASE_MONITORING':
        actions.push({
          action: 'INCREASE_HEALTH_CHECK_FREQUENCY',
          target: 'health-monitor',
          priority: 20,
          estimatedImpact: 'low',
          reversible: true,
          parameters: { intervalMs: 2000 },
        });
        break;

      case 'NO_ACTION':
        break;
    }

    return actions;
  }

  private evaluateRollbackSafety(type: DecisionType, context: DecisionContext): boolean {
    switch (type) {
      case 'LOCKDOWN':
      case 'ISOLATE_REGION':
        return true;
      case 'ESCALATE_SECURITY':
        return false;
      default:
        return true;
    }
  }

  private generateReasoning(context: DecisionContext, type: DecisionType): string[] {
    const reasoning: string[] = [];

    reasoning.push('Decision type: ' + type);

    const anomalyScore = computeAggregateAnomalyScore(context.anomalies);
    reasoning.push('Aggregate anomaly score: ' + anomalyScore.toFixed(3));

    const criticalRegions = context.regionHealth.filter(r => r.status === 'critical' || r.status === 'offline');
    if (criticalRegions.length > 0) {
      reasoning.push('Critical/offline regions: ' + criticalRegions.map(r => r.region).join(', '));
    }

    const systemStress = computeSystemStress(context.systemLoad);
    reasoning.push('System stress level: ' + (systemStress * 100).toFixed(1) + '%');

    const strongCorrelations = context.eventCorrelations.filter(c => c.correlationStrength > 0.7);
    if (strongCorrelations.length > 0) {
      reasoning.push('Strong event correlations detected: ' + strongCorrelations.length);
    }

    return reasoning;
  }

  private notify(decision: Decision): void {
    for (const listener of this.listeners) {
      try {
        listener(decision);
      } catch {
        // listener errors do not block decisions
      }
    }
  }
}