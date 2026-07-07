'use client';

import { useRef, useCallback, useEffect, useState, useMemo } from 'react';

export type SelectorMetrics = {
  selectorId: string;
  computeCount: number;
  cacheHitCount: number;
  cacheMissCount: number;
  lastComputeDuration: number;
  averageComputeDuration: number;
  lastSelectedValue: unknown;
  stable: boolean;
};

export type SelectorConfig = {
  equalityFn: (a: unknown, b: unknown) => boolean;
  maxCacheSize: number;
  enableProfiling: boolean;
};

const DEFAULT_CONFIG: SelectorConfig = {
  equalityFn: (a, b) => a === b,
  maxCacheSize: 100,
  enableProfiling: true,
};

function referenceEqual<T>(a: T, b: T): boolean {
  return a === b;
}

function shallowEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }
  return true;
}

function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!deepEqual(objA[key], objB[key])) return false;
  }
  return true;
}

const selectorMetricsMap: Map<string, SelectorMetrics> = new Map();
let globalConfig: SelectorConfig = { ...DEFAULT_CONFIG };

export function configureSelectorOptimizer(config: Partial<SelectorConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

export function createSelectorId(): string {
  return 'sel_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 0xFFFF).toString(36);
}

export function createSelector<TState, TSelected>(
  selector: (state: TState) => TSelected,
  equalityFn?: (a: TSelected, b: TSelected) => boolean,
  selectorId?: string,
): {
  select: (state: TState) => TSelected;
  getLastValue: () => TSelected | undefined;
  getMetrics: () => SelectorMetrics | null;
} {
  const id = selectorId ?? createSelectorId();
  const eq = equalityFn ?? (globalConfig.equalityFn as (a: TSelected, b: TSelected) => boolean) ?? referenceEqual;
  let lastValue: TSelected | undefined;
  let lastState: TState | undefined;
  let computeCount = 0;
  let cacheHitCount = 0;
  let cacheMissCount = 0;
  let totalDuration = 0;

  const select = (state: TState): TSelected => {
    if (lastState !== undefined && state === lastState && lastValue !== undefined) {
      cacheHitCount++;
      computeCount++;
      const metrics = selectorMetricsMap.get(id);
      if (metrics) {
        metrics.computeCount = computeCount;
        metrics.cacheHitCount = cacheHitCount;
        metrics.stable = true;
      }
      return lastValue;
    }

    const startTime = globalConfig.enableProfiling ? performance.now() : 0;
    const selected = selector(state);
    const duration = globalConfig.enableProfiling ? performance.now() - startTime : 0;

    cacheMissCount++;
    computeCount++;
    totalDuration += duration;

    if (lastValue !== undefined && eq(lastValue, selected)) {
      lastState = state;
      cacheHitCount++;
      return lastValue;
    }

    lastValue = selected;
    lastState = state;

    const existing = selectorMetricsMap.get(id);
    const metrics: SelectorMetrics = existing ?? {
      selectorId: id,
      computeCount: 0,
      cacheHitCount: 0,
      cacheMissCount: 0,
      lastComputeDuration: 0,
      averageComputeDuration: 0,
      lastSelectedValue: undefined,
      stable: true,
    };

    metrics.computeCount = computeCount;
    metrics.cacheHitCount = cacheHitCount;
    metrics.cacheMissCount = cacheMissCount;
    metrics.lastComputeDuration = duration;
    metrics.averageComputeDuration = totalDuration / Math.max(cacheMissCount, 1);
    metrics.lastSelectedValue = selected;
    metrics.stable = cacheMissCount < cacheHitCount * 0.1;

    if (!existing) {
      selectorMetricsMap.set(id, metrics);
    }

    return selected;
  };

  return {
    select,
    getLastValue: () => lastValue,
    getMetrics: () => selectorMetricsMap.get(id) ?? null,
  };
}

export function useStateSelector<TState, TSelected>(
  getState: () => TState,
  selector: (state: TState) => TSelected,
  equalityFn?: (a: TSelected, b: TSelected) => boolean,
): TSelected {
  // Create a stable selector instance — useMemo is fine because createSelector is pure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectorInstance = useMemo(
    () => createSelector(selector, equalityFn),
    [],
  );

  const [selectedState, setSelectedState] = useState<TSelected>(() =>
    selectorInstance.select(getState()),
  );

  useEffect(() => {
    // Immediately sync in case state changed between render and effect
    const current = selectorInstance.select(getState());
    if (!referenceEqual(selectedState, current)) {
      setSelectedState(current);
    }

    const interval = setInterval(() => {
      const state = getState();
      const selected = selectorInstance.select(state);
      setSelectedState(prev => {
        if (referenceEqual(prev, selected)) return prev;
        return selected;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [getState, selectorInstance, selectedState]);

  return selectedState;
}

export function useShallowSelector<TState, TSelected>(
  getState: () => TState,
  selector: (state: TState) => TSelected,
): TSelected {
  return useStateSelector(getState, selector, shallowEqual as (a: TSelected, b: TSelected) => boolean);
}

export function getSelectorMetrics(selectorId: string): SelectorMetrics | null {
  return selectorMetricsMap.get(selectorId) ?? null;
}

export function getAllSelectorMetrics(): SelectorMetrics[] {
  return Array.from(selectorMetricsMap.values());
}

export function createSelectorOptimizer<TState, TSelected>(
  selector: (state: TState) => TSelected,
  opts?: {
    equalityFn?: (a: TSelected, b: TSelected) => boolean;
    id?: string;
  },
): (state: TState) => TSelected {
  const instance = createSelector(selector, opts?.equalityFn, opts?.id);
  return instance.select;
}

export function createSelectorBatch<TState, TSelectors extends Record<string, (state: TState) => unknown>>(
  selectors: TSelectors,
): {
  select: <K extends keyof TSelectors>(state: TState, key: K) => ReturnType<TSelectors[K]>;
  selectAll: (state: TState) => { [K in keyof TSelectors]: ReturnType<TSelectors[K]> };
} {
  const instances = new Map<string, ReturnType<typeof createSelector>>();

  for (const [key, selector] of Object.entries(selectors)) {
    instances.set(key, createSelector(selector));
  }

  return {
    select: <K extends keyof TSelectors>(state: TState, key: K): ReturnType<TSelectors[K]> => {
      const instance = instances.get(key as string);
      if (!instance) throw new Error('Selector not found: ' + String(key));
      return instance.select(state) as ReturnType<TSelectors[K]>;
    },
    selectAll: (state: TState): { [K in keyof TSelectors]: ReturnType<TSelectors[K]> } => {
      const result = {} as Record<string, unknown>;
      for (const [key, instance] of instances.entries()) {
        result[key] = instance.select(state);
      }
      return result as { [K in keyof TSelectors]: ReturnType<TSelectors[K]> };
    },
  };
}

export function clearAllSelectorMetrics(): void {
  selectorMetricsMap.clear();
}