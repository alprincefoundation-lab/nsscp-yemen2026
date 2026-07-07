'use client';

export type RenderMetrics = {
  componentName: string;
  renderCount: number;
  lastRenderDuration: number;
  averageRenderDuration: number;
  unnecessaryRerenders: number;
  lastRenderTimestamp: number;
  propsChanged: boolean;
  stateChanged: boolean;
};

export type StabilityReport = {
  totalComponents: number;
  totalRenders: number;
  totalUnnecessaryRerenders: number;
  averageRenderTime: number;
  slowestComponents: RenderMetrics[];
  mostRerenderedComponents: RenderMetrics[];
  generatedAt: number;
};

export type StabilityConfig = {
  slowRenderThresholdMs: number;
  unnecessaryRerenderThreshold: number;
  maxTrackedComponents: number;
  enableProfiling: boolean;
};

const DEFAULT_CONFIG: StabilityConfig = {
  slowRenderThresholdMs: 16,
  unnecessaryRerenderThreshold: 5,
  maxTrackedComponents: 1000,
  enableProfiling: true,
};

let renderMetricsMap: Map<string, RenderMetrics> = new Map();
let config: StabilityConfig = { ...DEFAULT_CONFIG };

function hashProps(props: unknown): string {
  if (props === null || props === undefined) return 'null';
  if (typeof props !== 'object') return String(props);
  const str = JSON.stringify(props, Object.keys(props as Record<string, unknown>).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString(16);
}

export function configureStabilityGuard(newConfig: Partial<StabilityConfig>): void {
  config = { ...config, ...newConfig };
}

export function trackRender(componentName: string, props: unknown, renderDuration: number): void {
  if (!config.enableProfiling) return;

  let metrics = renderMetricsMap.get(componentName);
  const now = Date.now();

  if (!metrics) {
    if (renderMetricsMap.size >= config.maxTrackedComponents) {
      const oldest = Array.from(renderMetricsMap.entries())
        .sort(([, a], [, b]) => a.lastRenderTimestamp - b.lastRenderTimestamp)
        .slice(0, Math.floor(config.maxTrackedComponents * 0.1));
      for (const [key] of oldest) {
        renderMetricsMap.delete(key);
      }
    }

    metrics = {
      componentName,
      renderCount: 0,
      lastRenderDuration: 0,
      averageRenderDuration: 0,
      unnecessaryRerenders: 0,
      lastRenderTimestamp: 0,
      propsChanged: true,
      stateChanged: true,
    };
    renderMetricsMap.set(componentName, metrics);
  }

  metrics.renderCount++;
  metrics.lastRenderDuration = renderDuration;
  metrics.averageRenderDuration =
    (metrics.averageRenderDuration * (metrics.renderCount - 1) + renderDuration) / metrics.renderCount;
  metrics.lastRenderTimestamp = now;

  if (renderDuration < 0.5 && metrics.renderCount > 1) {
    metrics.unnecessaryRerenders++;
  }
}

export function getRenderMetrics(componentName: string): RenderMetrics | null {
  return renderMetricsMap.get(componentName) ?? null;
}

export function getAllRenderMetrics(): RenderMetrics[] {
  return Array.from(renderMetricsMap.values());
}

export function getStabilityReport(): StabilityReport {
  const allMetrics = Array.from(renderMetricsMap.values());

  const totalRenders = allMetrics.reduce((s, m) => s + m.renderCount, 0);
  const totalUnnecessary = allMetrics.reduce((s, m) => s + m.unnecessaryRerenders, 0);
  const totalTime = allMetrics.reduce((s, m) => s + m.averageRenderDuration * m.renderCount, 0);

  const slowest = [...allMetrics]
    .sort((a, b) => b.averageRenderDuration - a.averageRenderDuration)
    .slice(0, 10);

  const mostRerendered = [...allMetrics]
    .sort((a, b) => b.unnecessaryRerenders - a.unnecessaryRerenders)
    .slice(0, 10);

  return {
    totalComponents: allMetrics.length,
    totalRenders,
    totalUnnecessaryRerenders: totalUnnecessary,
    averageRenderTime: totalRenders > 0 ? totalTime / totalRenders : 0,
    slowestComponents: slowest,
    mostRerenderedComponents: mostRerendered,
    generatedAt: Date.now(),
  };
}

export function resetMetrics(): void {
  renderMetricsMap.clear();
}

export function isComponentStable(componentName: string): boolean {
  const metrics = renderMetricsMap.get(componentName);
  if (!metrics) return true;
  return metrics.unnecessaryRerenders < config.unnecessaryRerenderThreshold;
}

export function createStableKey(parts: unknown[]): string {
  const combined = parts.map(p => {
    if (p === null || p === undefined) return 'n';
    if (typeof p === 'object') return JSON.stringify(p, Object.keys(p as Record<string, unknown>).sort());
    return String(p);
  }).join('|');

  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const chr = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'sk-' + Math.abs(hash).toString(36);
}