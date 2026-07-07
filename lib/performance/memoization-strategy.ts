'use client';

import { useRef, useCallback, useMemo, useEffect } from 'react';

export type MemoizedResult<T> = {
  value: T;
  cacheKey: string;
  hitCount: number;
  lastAccessed: number;
  created: number;
};

export type MemoizationCache<T = unknown> = {
  get(key: string): MemoizedResult<T> | undefined;
  set(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  size(): number;
  stats(): { hits: number; misses: number; evictions: number; hitRate: number };
};

function createMemoizationCache<T>(maxSize: number = 1000): MemoizationCache<T> {
  const store = new Map<string, MemoizedResult<T>>();
  let hits = 0;
  let misses = 0;
  let evictions = 0;

  function evict(): void {
    if (store.size === 0) return;
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, result] of store.entries()) {
      if (result.lastAccessed < oldestTime) {
        oldestTime = result.lastAccessed;
        oldestKey = key;
      }
    }
    if (oldestKey !== null) {
      store.delete(oldestKey);
      evictions++;
    }
  }

  return {
    get(key: string): MemoizedResult<T> | undefined {
      const result = store.get(key);
      if (result) {
        hits++;
        result.hitCount++;
        result.lastAccessed = Date.now();
        return result;
      }
      misses++;
      return undefined;
    },
    set(key: string, value: T): void {
      if (store.size >= maxSize) {
        evict();
      }
      store.set(key, {
        value,
        cacheKey: key,
        hitCount: 0,
        lastAccessed: Date.now(),
        created: Date.now(),
      });
    },
    has(key: string): boolean {
      return store.has(key);
    },
    delete(key: string): void {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
    size(): number {
      return store.size;
    },
    stats(): { hits: number; misses: number; evictions: number; hitRate: number } {
      const total = hits + misses;
      return { hits, misses, evictions, hitRate: total > 0 ? hits / total : 0 };
    },
  };
}

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

export function createDependencyKey(deps: unknown[]): string {
  return stableStringify(deps);
}

const globalCaches: Map<string, MemoizationCache> = new Map();

export function getOrCreateCache<T>(namespace: string, maxSize?: number): MemoizationCache<T> {
  let cache = globalCaches.get(namespace) as MemoizationCache<T> | undefined;
  if (!cache) {
    cache = createMemoizationCache<T>(maxSize);
    globalCaches.set(namespace, cache as MemoizationCache);
  }
  return cache;
}

export function useStableMemo<T>(factory: () => T, deps: unknown[], namespace: string = 'default'): T {
  const cache = getOrCreateCache<T>(namespace);
  const depKey = createDependencyKey(deps);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => {
    const cached = cache.get(depKey);
    if (cached) {
      return cached.value;
    }
    const result = factory();
    cache.set(depKey, result);
    return result;
  }, [depKey]); // intentionally only re-run when depKey changes

  return value;
}

export function useStableCallback<TArgs extends unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn,
  deps: unknown[],
): (...args: TArgs) => TReturn {
  const callbackRef = useRef(callback);

  // Sync the ref after render, not during render
  useEffect(() => {
    callbackRef.current = callback;
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((...args: TArgs) => {
    return callbackRef.current(...args);
  }, []);
}

export function useDerivedData<TInput, TOutput>(
  input: TInput,
  derive: (input: TInput) => TOutput,
  namespace: string = 'derived',
): TOutput {
  const cache = getOrCreateCache<TOutput>(namespace);
  const inputKey = stableStringify(input);

  const cached = cache.get(inputKey);
  if (cached) return cached.value;

  const output = derive(input);
  cache.set(inputKey, output);
  return output;
}

export function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  namespace: string = 'memoize',
  maxSize: number = 500,
): (...args: TArgs) => TReturn {
  const cache = getOrCreateCache<TReturn>(namespace, maxSize);

  return (...args: TArgs): TReturn => {
    const key = createDependencyKey(args);
    const cached = cache.get(key);
    if (cached) return cached.value;

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

export function clearAllCaches(): void {
  for (const cache of globalCaches.values()) {
    cache.clear();
  }
}

export function getAllCacheStats(): Record<string, { hits: number; misses: number; evictions: number; hitRate: number; size: number }> {
  const stats: Record<string, { hits: number; misses: number; evictions: number; hitRate: number; size: number }> = {};
  for (const [namespace, cache] of globalCaches.entries()) {
    stats[namespace] = { ...cache.stats(), size: cache.size() };
  }
  return stats;
}