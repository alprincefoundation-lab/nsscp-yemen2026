export type ServiceResult<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
  errorCode: string | null;
  metadata: Record<string, unknown>;
};

export type ServiceContext = {
  userId: string | null;
  roles: string[];
  permissions: string[];
  requestId: string;
  timestamp: number;
  source: string;
};

export abstract class BaseService {
  protected createContext(overrides?: Partial<ServiceContext>): ServiceContext {
    return {
      userId: overrides?.userId ?? null,
      roles: overrides?.roles ?? [],
      permissions: overrides?.permissions ?? [],
      requestId: overrides?.requestId ?? this.generateRequestId(),
      timestamp: overrides?.timestamp ?? Date.now(),
      source: overrides?.source ?? 'unknown',
    };
  }

  protected success<T>(data: T, metadata: Record<string, unknown> = {}): ServiceResult<T> {
    return {
      success: true,
      data,
      error: null,
      errorCode: null,
      metadata,
    };
  }

  protected failure<T>(error: string, errorCode: string = 'UNKNOWN_ERROR', metadata: Record<string, unknown> = {}): ServiceResult<T> {
    return {
      success: false,
      data: null,
      error,
      errorCode,
      metadata,
    };
  }

  protected notFound<T>(entity: string, id: string): ServiceResult<T> {
    return this.failure(entity + ' not found: ' + id, 'NOT_FOUND', { entity, id });
  }

  protected unauthorized<T>(reason: string = 'Unauthorized'): ServiceResult<T> {
    return this.failure(reason, 'UNAUTHORIZED');
  }

  protected forbidden<T>(reason: string = 'Forbidden'): ServiceResult<T> {
    return this.failure(reason, 'FORBIDDEN');
  }

  protected validationError<T>(errors: string[]): ServiceResult<T> {
    return this.failure('Validation failed: ' + errors.join(', '), 'VALIDATION_ERROR', { errors });
  }

  protected conflict<T>(message: string): ServiceResult<T> {
    return this.failure(message, 'CONFLICT');
  }

  protected requirePermission(ctx: ServiceContext, permission: string): boolean {
    return ctx.permissions.includes(permission) || ctx.permissions.includes('*');
  }

  protected requireRole(ctx: ServiceContext, role: string): boolean {
    return ctx.roles.includes(role) || ctx.roles.includes('superadmin');
  }

  protected requireAuth(ctx: ServiceContext): boolean {
    return ctx.userId !== null;
  }

  private generateRequestId(): string {
    return Date.now().toString(36) + '-' + Math.floor(Math.random() * 0xFFFFFF).toString(36);
  }
}