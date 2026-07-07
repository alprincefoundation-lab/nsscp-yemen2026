export type NormalizedEvent<T = unknown> = {
  id: string;
  type: string;
  payload: T;
  source: string;
  region: string;
  timestamp: number;
  normalizedAt: number;
  normalizedType: string;
  normalizedSource: string;
  normalizedRegion: string;
  canonicalTimestamp: number;
  metadata: Record<string, unknown>;
};

export type NormalizationRule<T = unknown> = {
  name: string;
  appliesTo: string | '*';
  transform: (event: T) => T;
};

export type NormalizationConfig = {
  typeAliases: Record<string, string>;
  sourceAliases: Record<string, string>;
  regionAliases: Record<string, string>;
  timestampField: string;
  timezoneOffset: number;
};

const DEFAULT_CONFIG: NormalizationConfig = {
  typeAliases: {},
  sourceAliases: {},
  regionAliases: {},
  timestampField: 'timestamp',
  timezoneOffset: 0,
};

function normalizeType(type: string, aliases: Record<string, string>): string {
  const lower = type.toLowerCase().trim().replace(/[\s_]+/g, '.');
  return aliases[lower] ?? aliases[type] ?? lower;
}

function normalizeSource(source: string, aliases: Record<string, string>): string {
  const lower = source.toLowerCase().trim();
  return aliases[lower] ?? aliases[source] ?? lower;
}

function normalizeRegion(region: string, aliases: Record<string, string>): string {
  const lower = region.toLowerCase().trim();
  return aliases[lower] ?? aliases[region] ?? lower;
}

function normalizeTimestamp(timestamp: number, timezoneOffset: number): number {
  return timestamp + timezoneOffset;
}

function deepNormalize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return obj.trim();
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.map(deepNormalize);
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    for (const key of keys) {
      const normalizedKey = key.trim().toLowerCase().replace(/[\s_]+([a-z])/g, (_, c) => c.toUpperCase());
      result[normalizedKey] = deepNormalize((obj as Record<string, unknown>)[key]);
    }
    return result;
  }
  return obj;
}

export class NormalizationLayer<T = unknown> {
  private config: NormalizationConfig;
  private rules: NormalizationRule<unknown>[] = [];
  private totalNormalized = 0;
  private typeMapping: Map<string, number> = new Map();
  private listeners: Array<(event: NormalizedEvent<T>) => void> = [];

  constructor(config?: Partial<NormalizationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  addRule(rule: NormalizationRule<unknown>): void {
    this.rules.push(rule);
  }

  removeRule(name: string): void {
    this.rules = this.rules.filter(r => r.name !== name);
  }

  normalize(event: {
    id: string;
    type: string;
    payload: T;
    source: string;
    region: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
  }): NormalizedEvent<T> {
    const normalizedType = normalizeType(event.type, this.config.typeAliases);
    const normalizedSource = normalizeSource(event.source, this.config.sourceAliases);
    const normalizedRegion = normalizeRegion(event.region, this.config.regionAliases);
    const canonicalTimestamp = normalizeTimestamp(event.timestamp, this.config.timezoneOffset);

    let payload = event.payload;

    const applicableRules = this.rules.filter(r =>
      r.appliesTo === '*' || r.appliesTo === normalizedType
    );

    for (const rule of applicableRules) {
      try {
        payload = rule.transform(payload as unknown) as T;
      } catch {
        // transform errors do not block normalization
      }
    }

    this.totalNormalized++;
    this.typeMapping.set(normalizedType, (this.typeMapping.get(normalizedType) || 0) + 1);

    const normalized: NormalizedEvent<T> = {
      id: event.id.trim(),
      type: normalizedType,
      payload,
      source: normalizedSource,
      region: normalizedRegion,
      timestamp: event.timestamp,
      normalizedAt: Date.now(),
      normalizedType,
      normalizedSource,
      normalizedRegion,
      canonicalTimestamp,
      metadata: deepNormalize(event.metadata ?? {}) as Record<string, unknown>,
    };

    this.notify(normalized);
    return normalized;
  }

  normalizeBatch(events: Array<{
    id: string;
    type: string;
    payload: T;
    source: string;
    region: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
  }>): NormalizedEvent<T>[] {
    return events.map(e => this.normalize(e));
  }

  getTypeDistribution(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [type, count] of this.typeMapping.entries()) {
      result[type] = count;
    }
    return result;
  }

  getStats(): { normalized: number; uniqueTypes: number; rulesRegistered: number } {
    return {
      normalized: this.totalNormalized,
      uniqueTypes: this.typeMapping.size,
      rulesRegistered: this.rules.length,
    };
  }

  onNormalized(listener: (event: NormalizedEvent<T>) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private notify(event: NormalizedEvent<T>): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // listener errors do not block normalization
      }
    }
  }
}