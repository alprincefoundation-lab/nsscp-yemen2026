export type EnrichedEvent<T = unknown> = {
  id: string;
  type: string;
  payload: T;
  source: string;
  region: string;
  timestamp: number;
  enrichedAt: number;
  enrichments: Record<string, unknown>;
  tags: string[];
  priority: number;
  ttl: number;
  traceId: string;
};

export type EnrichmentProvider<T = unknown> = {
  name: string;
  enrich: (event: T, context: EnrichmentContext) => Record<string, unknown> | Promise<Record<string, unknown>>;
};

export type EnrichmentContext = {
  eventType: string;
  source: string;
  region: string;
  timestamp: number;
  existingEnrichments: Record<string, unknown>;
};

export type EnrichmentConfig = {
  defaultTtl: number;
  defaultPriority: number;
  autoTag: boolean;
  tagRules: TagRule[];
};

export type TagRule = {
  pattern: string;
  tag: string;
  field?: string;
};

const DEFAULT_CONFIG: EnrichmentConfig = {
  defaultTtl: 300000,
  defaultPriority: 0,
  autoTag: true,
  tagRules: [],
};

function generateTraceId(): string {
  return Date.now().toString(36) + '-' + Math.floor(Math.random() * 0xFFFFFF).toString(36);
}

function applyTagRules(payload: unknown, rules: TagRule[], eventType: string): string[] {
  const tags: string[] = [];

  tags.push('type:' + eventType);

  if (typeof payload === 'object' && payload !== null) {
    const obj = payload as Record<string, unknown>;
    const str = JSON.stringify(obj);

    for (const rule of rules) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (rule.field) {
          const fieldValue = obj[rule.field];
          if (fieldValue !== undefined && regex.test(String(fieldValue))) {
            tags.push(rule.tag);
          }
        } else {
          if (regex.test(str) || regex.test(eventType)) {
            tags.push(rule.tag);
          }
        }
      } catch {
        // invalid regex patterns are skipped
      }
    }
  }

  return [...new Set(tags)];
}

function computePriority(eventType: string, enrichments: Record<string, unknown>): number {
  let priority = 0;

  const criticalTypes = ['alert', 'emergency', 'critical', 'lockdown', 'security'];
  const highTypes = ['warning', 'anomaly', 'escalation', 'incident'];
  const normalTypes = ['update', 'sync', 'heartbeat', 'status'];

  for (const ct of criticalTypes) {
    if (eventType.includes(ct)) { priority += 100; break; }
  }
  for (const ht of highTypes) {
    if (eventType.includes(ht)) { priority += 50; break; }
  }
  for (const nt of normalTypes) {
    if (eventType.includes(nt)) { priority += 10; break; }
  }

  if (enrichments['anomalyScore'] && typeof enrichments['anomalyScore'] === 'number') {
    priority += Math.floor(enrichments['anomalyScore'] as number * 10);
  }

  if (enrichments['riskLevel']) {
    const riskLevel = String(enrichments['riskLevel']);
    if (riskLevel === 'critical') priority += 80;
    else if (riskLevel === 'high') priority += 40;
    else if (riskLevel === 'medium') priority += 20;
  }

  return priority;
}

export class EnrichmentLayer<T = unknown> {
  private providers: EnrichmentProvider<unknown>[] = [];
  private config: EnrichmentConfig;
  private totalEnriched = 0;
  private enrichmentCounts: Map<string, number> = new Map();
  private listeners: Array<(event: EnrichedEvent<T>) => void> = [];

  constructor(config?: Partial<EnrichmentConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  addProvider(provider: EnrichmentProvider<unknown>): void {
    this.providers.push(provider);
  }

  removeProvider(name: string): void {
    this.providers = this.providers.filter(p => p.name !== name);
  }

  addTagRule(rule: TagRule): void {
    this.config.tagRules.push(rule);
  }

  async enrich(event: {
    id: string;
    type: string;
    payload: T;
    source: string;
    region: string;
    timestamp: number;
  }): Promise<EnrichedEvent<T>> {
    const context: EnrichmentContext = {
      eventType: event.type,
      source: event.source,
      region: event.region,
      timestamp: event.timestamp,
      existingEnrichments: {},
    };

    const enrichments: Record<string, unknown> = {};

    for (const provider of this.providers) {
      try {
        const result = await provider.enrich(event.payload, context);
        Object.assign(enrichments, result);
        context.existingEnrichments = enrichments;
        this.enrichmentCounts.set(provider.name, (this.enrichmentCounts.get(provider.name) || 0) + 1);
      } catch {
        // provider errors do not block enrichment
      }
    }

    enrichments['processedAt'] = Date.now();
    enrichments['pipelineStage'] = 'enrichment';
    enrichments['sourceRegion'] = event.region;
    enrichments['eventSource'] = event.source;

    const tags = this.config.autoTag
      ? applyTagRules(event.payload, this.config.tagRules, event.type)
      : [];

    const priority = computePriority(event.type, enrichments) + this.config.defaultPriority;

    this.totalEnriched++;

    const enriched: EnrichedEvent<T> = {
      id: event.id,
      type: event.type,
      payload: event.payload,
      source: event.source,
      region: event.region,
      timestamp: event.timestamp,
      enrichedAt: Date.now(),
      enrichments,
      tags,
      priority,
      ttl: this.config.defaultTtl,
      traceId: generateTraceId(),
    };

    this.notify(enriched);
    return enriched;
  }

  async enrichBatch(events: Array<{
    id: string;
    type: string;
    payload: T;
    source: string;
    region: string;
    timestamp: number;
  }>): Promise<EnrichedEvent<T>[]> {
    return Promise.all(events.map(e => this.enrich(e)));
  }

  getStats(): { enriched: number; providersRegistered: number; enrichmentCounts: Record<string, number> } {
    const counts: Record<string, number> = {};
    for (const [name, count] of this.enrichmentCounts.entries()) {
      counts[name] = count;
    }
    return {
      enriched: this.totalEnriched,
      providersRegistered: this.providers.length,
      enrichmentCounts: counts,
    };
  }

  onEnriched(listener: (event: EnrichedEvent<T>) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private notify(event: EnrichedEvent<T>): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // listener errors do not block enrichment
      }
    }
  }
}