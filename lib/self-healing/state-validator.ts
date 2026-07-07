export type StateSnapshot<T = unknown> = {
  id: string;
  timestamp: number;
  source: 'store' | 'ui' | 'event';
  region: string;
  payload: T;
  checksum: string;
  version: number;
};

export type DriftReport = {
  snapshotA: StateSnapshot;
  snapshotB: StateSnapshot;
  divergentPaths: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: number;
};

export type ValidationResult = {
  valid: boolean;
  driftReports: DriftReport[];
  corruptedPaths: string[];
  lastValidTimestamp: number;
  recoveryRequired: boolean;
};

type StateSource = 'store' | 'ui' | 'event';

interface StateRegistry<T = unknown> {
  getState(source: StateSource, region: string): StateSnapshot<T> | null;
  getAllSnapshots(region: string): StateSnapshot<T>[];
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

function deepEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

function findDivergentPaths(a: unknown, b: unknown, path: string = ''): string[] {
  const paths: string[] = [];
  if (a === null || a === undefined || b === null || b === undefined) {
    if (a !== b) paths.push(path || '<root>');
    return paths;
  }
  if (typeof a !== typeof b) {
    paths.push(path || '<root>');
    return paths;
  }
  if (typeof a !== 'object') {
    if (a !== b) paths.push(path || '<root>');
    return paths;
  }
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)]);
  for (const key of allKeys) {
    const childPath = path ? path + '.' + key : key;
    if (!(key in objA)) {
      paths.push(childPath + ' [missing in A]');
    } else if (!(key in objB)) {
      paths.push(childPath + ' [missing in B]');
    } else {
      paths.push(...findDivergentPaths(objA[key], objB[key], childPath));
    }
  }
  return paths;
}

function classifySeverity(divergentPaths: string[]): DriftReport['severity'] {
  const count = divergentPaths.length;
  if (count === 0) return 'low';
  if (count <= 2) return 'low';
  if (count <= 5) return 'medium';
  if (count <= 10) return 'high';
  return 'critical';
}

export class StateValidator<T = unknown> {
  private registry: StateRegistry<T>;
  private validationHistory: ValidationResult[] = [];
  private listeners: Array<(result: ValidationResult) => void> = [];

  constructor(registry: StateRegistry<T>) {
    this.registry = registry;
  }

  validate(region: string): ValidationResult {
    const snapshots = this.registry.getAllSnapshots(region);
    const driftReports: DriftReport[] = [];
    const corruptedPaths: string[] = [];

    for (let i = 0; i < snapshots.length; i++) {
      for (let j = i + 1; j < snapshots.length; j++) {
        const a = snapshots[i];
        const b = snapshots[j];
        if (a.checksum !== b.checksum) {
          const divergentPaths = findDivergentPaths(a.payload, b.payload);
          const report: DriftReport = {
            snapshotA: a,
            snapshotB: b,
            divergentPaths,
            severity: classifySeverity(divergentPaths),
            detectedAt: Date.now(),
          };
          driftReports.push(report);
          corruptedPaths.push(...divergentPaths);
        }
      }
    }

    const lastValidTimestamp = driftReports.length === 0
      ? (snapshots.length > 0 ? Math.max(...snapshots.map(s => s.timestamp)) : Date.now())
      : Math.max(...driftReports.map(r => Math.min(r.snapshotA.timestamp, r.snapshotB.timestamp)));

    const result: ValidationResult = {
      valid: driftReports.length === 0,
      driftReports,
      corruptedPaths: [...new Set(corruptedPaths)],
      lastValidTimestamp,
      recoveryRequired: driftReports.some(d => d.severity === 'high' || d.severity === 'critical'),
    };

    this.validationHistory.push(result);
    for (const listener of this.listeners) {
      listener(result);
    }

    return result;
  }

  validateSnapshot(snapshot: StateSnapshot<T>, expectedChecksum: string): boolean {
    const computed = computeChecksum(snapshot.payload);
    return computed === expectedChecksum && computed === snapshot.checksum;
  }

  verifyIntegrity(snapshot: StateSnapshot<T>): boolean {
    return computeChecksum(snapshot.payload) === snapshot.checksum;
  }

  getHistory(): ValidationResult[] {
    return [...this.validationHistory];
  }

  onValidation(listener: (result: ValidationResult) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  static computeChecksum = computeChecksum;
  static stableStringify = stableStringify;
}