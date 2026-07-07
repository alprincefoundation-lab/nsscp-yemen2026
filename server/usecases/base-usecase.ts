import { ServiceResult, ServiceContext } from '../services/base-service';

export type UsecaseStep = {
  name: string;
  execute: () => Promise<unknown>;
  compensate?: () => Promise<void>;
};

export type UsecaseResult<T> = ServiceResult<T> & {
  stepsExecuted: string[];
  compensated: boolean;
  duration: number;
};

export abstract class BaseUsecase<TInput, TOutput> {
  protected context: ServiceContext;

  constructor(context: ServiceContext) {
    this.context = context;
  }

  abstract execute(input: TInput): Promise<UsecaseResult<TOutput>>;

  protected async executeSteps(steps: UsecaseStep[]): Promise<{ result: unknown; executed: string[]; compensated: boolean }> {
    const executed: string[] = [];
    const compensatable: UsecaseStep[] = [];

    try {
      for (const step of steps) {
        const result = await step.execute();
        executed.push(step.name);
        if (step.compensate) {
          compensatable.push(step);
        }
      }

      return { result: null, executed, compensated: false };
    } catch (error) {
      for (const step of compensatable.reverse()) {
        try {
          if (step.compensate) {
            await step.compensate();
          }
        } catch {
          // compensation errors are logged but do not throw
        }
      }

      throw error;
    }
  }

  protected successResult(data: TOutput, stepsExecuted: string[], duration: number): UsecaseResult<TOutput> {
    return {
      success: true,
      data,
      error: null,
      errorCode: null,
      metadata: {},
      stepsExecuted,
      compensated: false,
      duration,
    };
  }

  protected failureResult(error: string, errorCode: string, stepsExecuted: string[], duration: number): UsecaseResult<TOutput> {
    return {
      success: false,
      data: null,
      error,
      errorCode,
      metadata: {},
      stepsExecuted,
      compensated: true,
      duration,
    };
  }

  protected requireAuth(): void {
    if (!this.context.userId) {
      throw new Error('Authentication required');
    }
  }

  protected requirePermission(permission: string): void {
    if (!this.context.permissions.includes(permission) && !this.context.permissions.includes('*')) {
      throw new Error('Permission required: ' + permission);
    }
  }

  protected requireRole(role: string): void {
    if (!this.context.roles.includes(role) && !this.context.roles.includes('superadmin')) {
      throw new Error('Role required: ' + role);
    }
  }
}