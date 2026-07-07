export type FallbackState<T = unknown> = {
  key: string;
  value: T;
  source: 'primary' | 'fallback' | 'cache' | 'default';
  lastUpdated: number;
  ttl: number;
  stale: boolean;
  checksum: string;
};

export type FallbackConfig = {
  defaultTtl: number;
  staleWhileRevalidate: boolean;
  maxCacheSize: number;
  enablePersistence: boolean;
  fallbackChain: string[];
};

export type StateRecoveryResult<T = unknown> = {
  recovered: boolean;
  state: FallbackState<T> | null;
  source: string;
  attempts: number;
  duration: number;
};

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

function computeChecksum(value: unknown): string {
  const str = stableStringify(value);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString(16);
}

const DEFAULT_CONFIG: FallbackConfig = {
  defaultTtl: 300000,
  staleWhileRevalidate: true,
  maxCacheSize: 5000,
  enablePersistence: false,
  fallbackChain: ['primary', 'cache', 'fallback', 'default'],
};

export class FallbackStateManager<T = unknown> {
  private primaryStore: Map<string, FallbackState<T>> = new Map();
  private cacheStore: Map<string, FallbackState<T>> = new Map();
  private fallbackStore: Map<string, FallbackState<T>> = new Map();
  private defaultStore: Map<string, FallbackState<T>> = new Map();
  private config: FallbackConfig;
  private listeners: Array<(state: FallbackState<T>) => void> = [];

  constructor(config?: Partial<FallbackConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  set(key: string, value: T, source: FallbackState<T>['source'] = 'primary', ttl?: number): void {
    const now = Date.now();
    const state: FallbackState<T> = {
      key,
      value,
      source,
      lastUpdated: now,
      ttl: ttl ?? this.config.defaultTtl,
      stale: false,
      checksum: computeChecksum(value),
    };

    const store = this.getStore(source);
    store.set(key, state);

    if (this.config.staleWhileRevalidate && source === 'primary') {
      const cacheStore = this.getStore('cache');
      cacheStore.set(key, { ...state, source: 'cache' });
    }

    this.enforceMaxSize(source);
    this.notify(state);
  }

  get(key: string): FallbackState<T> | null {
    for (const source of this.config.fallbackChain) {
      const store = this.getStore(source as FallbackState<T>['source']);
      const state = store.get(key);
      if (state) {
        const now = Date.now();
        const age = now - state.lastUpdated;
        if (age > state.ttl) {
          state.stale = true;
          if (!this.config.staleWhileRevalidate) {
            continue;
          }
        }
        return { ...state };
      }
    }
    return null;
  }

  recover(key: string, defaultFactory?: () => T): StateRecoveryResult<T> {
    const startTime = Date.now();
    let attempts = 0;

    for (const source of this.config.fallbackChain) {
      attempts++;
      const store = this.getStore(source as FallbackState<T>['source']);
      const state = store.get(key);
      if (state) {
        return {
          recovered: true,
          state: { ...state, source: source as FallbackState<T>['source'] },
          source,
          attempts,
          duration: Date.now() - startTime,
        };
      }
    }

    if (defaultFactory) {
      const defaultValue = defaultFactory();
      this.set(key, defaultValue, 'default');
      return {
        recovered: true,
        state: {
          key,
          value: defaultValue,
          source: 'default',
          lastUpdated: Date.now(),
          ttl: this.config.defaultTtl,
          stale: false,
          checksum: computeChecksum(defaultValue),
        },
        source: 'default',
        attempts: attempts + 1,
        duration: Date.now() - startTime,
      };
    }

    return {
      recovered: false,
      state: null,
      source: 'none',
      attempts,
      duration: Date.now() - startTime,
    };
  }

  invalidate(key: string): void {
    this.primaryStore.delete(key);
    this.cacheStore.delete(key);
    this.fallbackStore.delete(key);
    this.defaultStore.delete(key);
  }

  promoteToFallback(key: string): boolean {
    const primary = this.primaryStore.get(key);
    if (primary) {
      this.fallbackStore.set(key, { ...primary, source: 'fallback' });
      return true;
    }
    return false;
  }

  refresh(key: string, newValue: T): void {
    const existing = this.get(key);
    if (existing) {
      this.set(key, newValue, existing.source, existing.ttl);
    } else {
      this.set(key, newValue);
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  isStale(key: string): boolean {
    const state = this.get(key);
    return state ? state.stale : true;
  }

  getStats(): {
    primarySize: number;
    cacheSize: number;
    fallbackSize: number;
    defaultSize: number;
    totalSize: number;
  } {
    return {
      primarySize: this.primaryStore.size,
      cacheSize: this.cacheStore.size,
      fallbackSize: this.fallbackStore.size,
      defaultSize: this.defaultStore.size,
      totalSize: this.primaryStore.size + this.cacheStore.size + this.fallbackStore.size + this.defaultStore.size,
    };
  }

  onStateChange(listener: (state: FallbackState<T>) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private getStore(source: FallbackState<T>['source']): Map<string, FallbackState<T>> {
    switch (source) {
      case 'primary': return this.primaryStore;
      case 'cache': return this.cacheStore;
      case 'fallback': return this.fallbackStore;
      case 'default': return this.defaultStore;
    }
  }

  private enforceMaxSize(source: FallbackState<T>['source']): void {
    const store = this.getStore(source);
    if (store.size > this.config.maxCacheSize) {
      const entries = Array.from(store.entries())
        .sort(([, a], [, b]) => a.lastUpdated - b.lastUpdated);
      const toRemove = entries.slice(0, entries.length - this.config.maxCacheSize);
      for (const [key] of toRemove) {
        store.delete(key);
      }
    }
  }

  private notify(state: FallbackState<T>): void {
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch {
        // listener errors do not block state management
      }
    }
  }
}