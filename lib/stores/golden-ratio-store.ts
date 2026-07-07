/**
 * Golden Ratio Store — Lightweight reactive store (Zustand-like pattern without the dependency)
 * Manages threat state with golden-ratio-based region layout calculations
 */

import type { ProvinceThreat } from './types';

const PHI = (1 + Math.sqrt(5)) / 2; // ≈ 1.618

interface GoldenRatioState {
  activeThreats: ProvinceThreat[];
  archivedThreats: ProvinceThreat[];
  totalThreats: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  waveCount: number;
  regionCounts: Record<string, number>;
  severityCounts: Record<string, number>;
}

type StateListener = (state: GoldenRatioState) => void;

class GoldenRatioStore {
  private static instance: GoldenRatioStore | null = null;
  private state: GoldenRatioState = {
    activeThreats: [],
    archivedThreats: [],
    totalThreats: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    waveCount: 0,
    regionCounts: {},
    severityCounts: {},
  };
  private listeners: Set<StateListener> = new Set();
  private waveCounter = 0;

  private constructor() {}

  static getInstance(): GoldenRatioStore {
    if (!GoldenRatioStore.instance) {
      GoldenRatioStore.instance = new GoldenRatioStore();
    }
    return GoldenRatioStore.instance;
  }

  getState(): GoldenRatioState {
    return this.state;
  }

  setState(partial: Partial<GoldenRatioState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  addThreats(threats: ProvinceThreat[]): void {
    this.waveCounter++;

    // Keep max 200 active threats (golden ratio: 200/φ ≈ 124 minimum buffer)
    const maxActive = 200;
    const existing = this.state.activeThreats;
    const combined = [...existing, ...threats];
    const trimmed = combined.length > maxActive
      ? combined.slice(combined.length - maxActive)
      : combined;

    // Compute counts
    const regionCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = {};
    let critical = 0, high = 0, medium = 0, low = 0;

    for (const t of trimmed) {
      regionCounts[t.region] = (regionCounts[t.region] ?? 0) + 1;
      severityCounts[t.severity] = (severityCounts[t.severity] ?? 0) + 1;
      if (t.severity === 'critical') critical++;
      else if (t.severity === 'high') high++;
      else if (t.severity === 'medium') medium++;
      else low++;
    }

    this.state = {
      ...this.state,
      activeThreats: trimmed,
      totalThreats: this.state.totalThreats + threats.length,
      criticalCount: critical,
      highCount: high,
      mediumCount: medium,
      lowCount: low,
      waveCount: this.waveCounter,
      regionCounts,
      severityCounts,
    };

    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  destroy(): void {
    this.listeners.clear();
    this.state = {
      activeThreats: [],
      archivedThreats: [],
      totalThreats: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      waveCount: 0,
      regionCounts: {},
      severityCounts: {},
    };
    GoldenRatioStore.instance = null;
  }
}

export const goldenRatioStore = GoldenRatioStore.getInstance();