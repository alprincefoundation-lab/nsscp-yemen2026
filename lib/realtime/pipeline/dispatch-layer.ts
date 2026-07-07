export type DispatchTarget = {
  id: string;
  name: string;
  type: 'bus' | 'store' | 'webhook' | 'queue' | 'handler';
  filter?: (event: DispatchEvent) => boolean;
  transform?: (event: DispatchEvent) => DispatchEvent;
  priority: number;
  enabled: boolean;
};

export type DispatchEvent<T = unknown> = {
  id: string;
  type: string;
  payload: T;
  source: string;
  region: string;
  timestamp: number;
  enrichments: Record<string, unknown>;
  tags: string[];
  priority: number;
  ttl: number;
  traceId: string;
};

export type DispatchResult = {
  targetId: string;
  targetName: string;
  success: boolean;
  dispatchedAt: number;
  durationMs: number;
  error: string | null;
};

export type DispatchConfig = {
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  maxConcurrentDispatches: number;
  deadLetterQueueSize: number;
};

export type DeadLetterEntry = {
  event: DispatchEvent;
  targetId: string;
  error: string;
  retryCount: number;
  lastAttemptAt: number;
};

type DispatchHandler = (event: DispatchEvent) => void | Promise<void>;

const DEFAULT_CONFIG: DispatchConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 5000,
  maxConcurrentDispatches: 50,
  deadLetterQueueSize: 1000,
};

export class DispatchLayer {
  private targets: Map<string, DispatchTarget> = new Map();
  private handlers: Map<string, DispatchHandler> = new Map();
  private config: DispatchConfig;
  private totalDispatched = 0;
  private totalFailed = 0;
  private deadLetterQueue: DeadLetterEntry[] = [];
  private activeDispatches = 0;
  private dispatchResults: DispatchResult[] = [];
  private listeners: Array<(result: DispatchResult) => void> = [];

  constructor(config?: Partial<DispatchConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  registerTarget(target: DispatchTarget, handler: DispatchHandler): void {
    this.targets.set(target.id, target);
    this.handlers.set(target.id, handler);
  }

  unregisterTarget(targetId: string): void {
    this.targets.delete(targetId);
    this.handlers.delete(targetId);
  }

  enableTarget(targetId: string): void {
    const target = this.targets.get(targetId);
    if (target) target.enabled = true;
  }

  disableTarget(targetId: string): void {
    const target = this.targets.get(targetId);
    if (target) target.enabled = false;
  }

  async dispatch(event: DispatchEvent): Promise<DispatchResult[]> {
    const eligibleTargets = Array.from(this.targets.values())
      .filter(t => t.enabled)
      .filter(t => !t.filter || t.filter(event))
      .sort((a, b) => b.priority - a.priority);

    const results: DispatchResult[] = [];

    for (const target of eligibleTargets) {
      if (this.activeDispatches >= this.config.maxConcurrentDispatches) {
        await this.waitForSlot();
      }

      const transformedEvent = target.transform ? target.transform(event) : event;
      const result = await this.dispatchToTarget(target, transformedEvent);
      results.push(result);
    }

    if (eligibleTargets.length === 0) {
      results.push({
        targetId: 'none',
        targetName: 'no-target',
        success: true,
        dispatchedAt: Date.now(),
        durationMs: 0,
        error: null,
      });
    }

    return results;
  }

  async dispatchBatch(events: DispatchEvent[]): Promise<DispatchResult[][]> {
    const sorted = [...events].sort((a, b) => b.priority - a.priority);
    const results: DispatchResult[][] = [];

    for (const event of sorted) {
      const eventResults = await this.dispatch(event);
      results.push(eventResults);
    }

    return results;
  }

  retryDeadLetter(): Promise<DispatchResult[]> {
    const entries = [...this.deadLetterQueue];
    this.deadLetterQueue = [];
    const results: DispatchResult[] = [];

    return (async () => {
      for (const entry of entries) {
        const target = this.targets.get(entry.targetId);
        if (!target || !target.enabled) {
          this.deadLetterQueue.push(entry);
          continue;
        }

        const result = await this.dispatchToTarget(target, entry.event);
        results.push(result);

        if (!result.success) {
          const newRetryCount = entry.retryCount + 1;
          if (newRetryCount < this.config.maxRetries) {
            this.deadLetterQueue.push({
              ...entry,
              retryCount: newRetryCount,
              lastAttemptAt: Date.now(),
            });
          } else {
            this.totalFailed++;
          }
        }
      }

      return results;
    })();
  }

  getDeadLetterQueue(): DeadLetterEntry[] {
    return [...this.deadLetterQueue];
  }

  getTargets(): DispatchTarget[] {
    return Array.from(this.targets.values());
  }

  getStats(): {
    dispatched: number;
    failed: number;
    deadLetterSize: number;
    activeTargets: number;
    activeDispatches: number;
  } {
    return {
      dispatched: this.totalDispatched,
      failed: this.totalFailed,
      deadLetterSize: this.deadLetterQueue.length,
      activeTargets: Array.from(this.targets.values()).filter(t => t.enabled).length,
      activeDispatches: this.activeDispatches,
    };
  }

  getRecentResults(count: number = 100): DispatchResult[] {
    return this.dispatchResults.slice(-count);
  }

  onDispatch(listener: (result: DispatchResult) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private async dispatchToTarget(target: DispatchTarget, event: DispatchEvent): Promise<DispatchResult> {
    const startTime = Date.now();
    this.activeDispatches++;

    const handler = this.handlers.get(target.id);
    if (!handler) {
      this.activeDispatches--;
      return {
        targetId: target.id,
        targetName: target.name,
        success: false,
        dispatchedAt: startTime,
        durationMs: Date.now() - startTime,
        error: 'No handler registered for target',
      };
    }

    const now = Date.now();
    if (event.ttl > 0 && now - event.timestamp > event.ttl) {
      this.activeDispatches--;
      this.addToDeadLetter(event, target.id, 'Event expired (TTL exceeded)');
      return {
        targetId: target.id,
        targetName: target.name,
        success: false,
        dispatchedAt: startTime,
        durationMs: Date.now() - startTime,
        error: 'Event expired',
      };
    }

    let lastError: string | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Dispatch timeout')), this.config.timeoutMs);
        });

        const dispatchPromise = Promise.resolve(handler(event));

        await Promise.race([dispatchPromise, timeoutPromise]);

        this.activeDispatches--;
        this.totalDispatched++;

        const result: DispatchResult = {
          targetId: target.id,
          targetName: target.name,
          success: true,
          dispatchedAt: startTime,
          durationMs: Date.now() - startTime,
          error: null,
        };

        this.dispatchResults.push(result);
        if (this.dispatchResults.length > 1000) {
          this.dispatchResults = this.dispatchResults.slice(-500);
        }

        this.notify(result);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelayMs * (attempt + 1));
        }
      }
    }

    this.activeDispatches--;
    this.totalFailed++;
    this.addToDeadLetter(event, target.id, lastError || 'Unknown error');

    const result: DispatchResult = {
      targetId: target.id,
      targetName: target.name,
      success: false,
      dispatchedAt: startTime,
      durationMs: Date.now() - startTime,
      error: lastError,
    };

    this.dispatchResults.push(result);
    this.notify(result);
    return result;
  }

  private addToDeadLetter(event: DispatchEvent, targetId: string, error: string): void {
    this.deadLetterQueue.push({
      event,
      targetId,
      error,
      retryCount: 0,
      lastAttemptAt: Date.now(),
    });

    if (this.deadLetterQueue.length > this.config.deadLetterQueueSize) {
      this.deadLetterQueue = this.deadLetterQueue.slice(-this.config.deadLetterQueueSize);
    }
  }

  private waitForSlot(): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        if (this.activeDispatches < this.config.maxConcurrentDispatches) {
          resolve();
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private notify(result: DispatchResult): void {
    for (const listener of this.listeners) {
      try {
        listener(result);
      } catch {
        // listener errors do not block dispatch
      }
    }
  }
}