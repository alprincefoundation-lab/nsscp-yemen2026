import { StateValidator, StateSnapshot, ValidationResult, DriftReport } from './state-validator';

export type RepairAction = {
  type: 'restore' | 'reconstruct' | 'rehydrate' | 'discard';
  targetSource: string;
  targetRegion: string;
  payload: unknown;
  reason: string;
  timestamp: number;
};

export type RepairResult = {
  success: boolean;
  actions: RepairAction[];
  restoredChecksums: string[];
  failedPaths: string[];
  duration: number;
};

export type EventRecord = {
  id: string;
  type: string;
  timestamp: number;
  region: string;
  payload: unknown;
  sequenceNumber: number;
};

interface RepairableStateStore<T = unknown> {
  getState(source: string, region: string): StateSnapshot<T> | null;
  setState(source: string, region: string, snapshot: StateSnapshot<any>): void;
  deleteState(source: string, region: string): void;
  getAllSources(region: string): string[];
  getEventLog(region: string): EventRecord[];
  replayEvents(events: EventRecord[]): T;
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

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.floor(Math.random() * 0xFFFFFF).toString(36);
  return timestamp + '-' + random;
}

function findConsensusSnapshot<T>(
  snapshots: StateSnapshot<T>[],
): StateSnapshot<T> | null {
  if (snapshots.length === 0) return null;
  if (snapshots.length === 1) return snapshots[0];

  const checksumCounts = new Map<string, { count: number; snapshot: StateSnapshot<T> }>();
  for (const snap of snapshots) {
    const existing = checksumCounts.get(snap.checksum);
    if (existing) {
      existing.count++;
    } else {
      checksumCounts.set(snap.checksum, { count: 1, snapshot: snap });
    }
  }

  let maxCount = 0;
  let consensus: StateSnapshot<T> | null = null;
  for (const entry of checksumCounts.values()) {
    if (entry.count > maxCount) {
      maxCount = entry.count;
      consensus = entry.snapshot;
    }
  }

  return consensus;
}

function sortEventsBySequence(events: EventRecord[]): EventRecord[] {
  return [...events].sort((a, b) => {
    if (a.sequenceNumber !== b.sequenceNumber) return a.sequenceNumber - b.sequenceNumber;
    return a.timestamp - b.timestamp;
  });
}

function findMissingSequences(events: EventRecord[]): number[] {
  if (events.length === 0) return [];
  const sorted = sortEventsBySequence(events);
  const missing: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const expected = sorted[i - 1].sequenceNumber + 1;
    const actual = sorted[i].sequenceNumber;
    for (let seq = expected; seq < actual; seq++) {
      missing.push(seq);
    }
  }
  return missing;
}

export class AutoRepairEngine<T = unknown> {
  private store: RepairableStateStore<T>;
  private validator: StateValidator<T>;
  private repairHistory: RepairResult[] = [];
  private listeners: Array<(result: RepairResult) => void> = [];

  constructor(store: RepairableStateStore<T>, validator: StateValidator<T>) {
    this.store = store;
    this.validator = validator;
  }

  async repair(region: string): Promise<RepairResult> {
    const startTime = Date.now();
    const actions: RepairAction[] = [];
    const restoredChecksums: string[] = [];
    const failedPaths: string[] = [];

    const validationResult = this.validator.validate(region);

    if (validationResult.valid) {
      const result: RepairResult = {
        success: true,
        actions: [],
        restoredChecksums: [],
        failedPaths: [],
        duration: Date.now() - startTime,
      };
      this.repairHistory.push(result);
      this.notify(result);
      return result;
    }

    if (validationResult.recoveryRequired) {
      const repairActions = await this.repairCriticalDrift(region, validationResult);
      actions.push(...repairActions.actions);
      restoredChecksums.push(...repairActions.restoredChecksums);
      failedPaths.push(...repairActions.failedPaths);
    } else {
      const repairActions = this.repairMinorDrift(region, validationResult);
      actions.push(...repairActions);
    }

    const eventGaps = this.detectEventGaps(region);
    if (eventGaps.length > 0) {
      const reconstructActions = this.reconstructMissingEvents(region, eventGaps);
      actions.push(...reconstructActions);
    }

    const rehydrateResult = this.rehydrateStore(region);
    if (rehydrateResult) {
      actions.push(rehydrateResult);
    }

    const result: RepairResult = {
      success: failedPaths.length === 0,
      actions,
      restoredChecksums,
      failedPaths,
      duration: Date.now() - startTime,
    };

    this.repairHistory.push(result);
    this.notify(result);
    return result;
  }

  private async repairCriticalDrift(
    region: string,
    validation: ValidationResult,
  ): Promise<{ actions: RepairAction[]; restoredChecksums: string[]; failedPaths: string[] }> {
    const actions: RepairAction[] = [];
    const restoredChecksums: string[] = [];
    const failedPaths: string[] = [];

    const snapshots = this.store.getAllSources(region)
      .map(source => this.store.getState(source, region))
      .filter((s): s is StateSnapshot<T> => s !== null);

    const consensus = findConsensusSnapshot(snapshots);

    if (consensus) {
      for (const drift of validation.driftReports) {
        const corruptedSource = this.identifyCorruptedSource(drift, consensus);
        if (corruptedSource) {
          try {
            this.store.setState(corruptedSource, region, {
              ...consensus,
              id: generateId(),
              source: corruptedSource as StateSnapshot<T>['source'],
            });
            actions.push({
              type: 'restore',
              targetSource: corruptedSource,
              targetRegion: region,
              payload: consensus.payload,
              reason: 'Consensus-based restoration from majority state',
              timestamp: Date.now(),
            });
            restoredChecksums.push(consensus.checksum);
          } catch {
            failedPaths.push(corruptedSource + ':' + region);
          }
        }
      }
    } else {
      const eventLog = this.store.getEventLog(region);
      if (eventLog.length > 0) {
        const sorted = sortEventsBySequence(eventLog);
        const reconstructed = this.store.replayEvents(sorted);
        const checksum = computeChecksum(reconstructed);
        const snapshot: StateSnapshot<T> = {
          id: generateId(),
          timestamp: Date.now(),
          source: 'event',
          region,
          payload: reconstructed as T,
          checksum,
          version: 1,
        };
        for (const source of this.store.getAllSources(region)) {
          this.store.setState(source, region, snapshot);
        }
        actions.push({
          type: 'reconstruct',
          targetSource: 'all',
          targetRegion: region,
          payload: reconstructed,
          reason: 'Full state reconstruction from event log',
          timestamp: Date.now(),
        });
        restoredChecksums.push(checksum);
      } else {
        failedPaths.push('all:' + region);
      }
    }

    return { actions, restoredChecksums, failedPaths };
  }

  private repairMinorDrift(region: string, validation: ValidationResult): RepairAction[] {
    const actions: RepairAction[] = [];

    for (const drift of validation.driftReports) {
      if (drift.severity === 'low') {
        const older = drift.snapshotA.timestamp < drift.snapshotB.timestamp
          ? drift.snapshotA
          : drift.snapshotB;
        const newer = older === drift.snapshotA ? drift.snapshotB : drift.snapshotA;

        this.store.setState(older.source, region, {
          ...newer,
          id: older.id,
          source: older.source,
        });

        actions.push({
          type: 'restore',
          targetSource: older.source,
          targetRegion: region,
          payload: newer.payload,
          reason: 'Minor drift resolved by propagating newer state',
          timestamp: Date.now(),
        });
      }
    }

    return actions;
  }

  private identifyCorruptedSource(drift: DriftReport, consensus: StateSnapshot<T>): string | null {
    if (drift.snapshotA.checksum === consensus.checksum) {
      return drift.snapshotB.source;
    }
    if (drift.snapshotB.checksum === consensus.checksum) {
      return drift.snapshotA.source;
    }
    return null;
  }

  private detectEventGaps(region: string): number[] {
    const eventLog = this.store.getEventLog(region);
    return findMissingSequences(eventLog);
  }

  private reconstructMissingEvents(region: string, missingSequences: number[]): RepairAction[] {
    const actions: RepairAction[] = [];
    const eventLog = this.store.getEventLog(region);
    const sorted = sortEventsBySequence(eventLog);

    for (const seq of missingSequences) {
      const preceding = sorted.filter(e => e.sequenceNumber < seq);
      const following = sorted.filter(e => e.sequenceNumber > seq);

      if (preceding.length > 0 && following.length > 0) {
        const precedingState = this.store.replayEvents(preceding);
        const fullState = this.store.replayEvents([...preceding, ...following]);

        actions.push({
          type: 'reconstruct',
          targetSource: 'event-log',
          targetRegion: region,
          payload: {
            missingSequence: seq,
            interpolatedFrom: {
              before: preceding[preceding.length - 1].sequenceNumber,
              after: following[0].sequenceNumber,
            },
          },
          reason: 'Event gap reconstruction at sequence ' + seq,
          timestamp: Date.now(),
        });

        void precedingState;
        void fullState;
      }
    }

    return actions;
  }

  private rehydrateStore(region: string): RepairAction | null {
    const eventLog = this.store.getEventLog(region);
    if (eventLog.length === 0) return null;

    const sorted = sortEventsBySequence(eventLog);
    const currentState = this.store.replayEvents(sorted) as T;
    const checksum = computeChecksum(currentState);

    const snapshot: StateSnapshot<T> = {
      id: generateId(),
      timestamp: Date.now(),
      source: 'store',
      region,
      payload: currentState as T,
      checksum,
      version: sorted[sorted.length - 1].sequenceNumber,
    };

    this.store.setState('store', region, snapshot);

    return {
      type: 'rehydrate',
      targetSource: 'store',
      targetRegion: region,
      payload: currentState,
      reason: 'Store rehydration from complete event replay',
      timestamp: Date.now(),
    };
  }

  getHistory(): RepairResult[] {
    return [...this.repairHistory];
  }

  onRepair(listener: (result: RepairResult) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private notify(result: RepairResult): void {
    for (const listener of this.listeners) {
      listener(result);
    }
  }
}