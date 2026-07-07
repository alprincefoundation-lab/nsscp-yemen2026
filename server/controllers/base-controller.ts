import { NextRequest, NextResponse } from 'next/server';
import { ServiceContext } from '../services/base-service';

export type ControllerResponse<T = unknown> = {
  status: number;
  data: T | null;
  error: string | null;
  meta: Record<string, unknown>;
};

export type ParsedRequest = {
  body: Record<string, unknown> | null;
  query: Record<string, string>;
  params: Record<string, string>;
  headers: Record<string, string>;
  context: ServiceContext;
};

export abstract class BaseController {
  protected parseQuery(url: string): Record<string, string> {
    const query: Record<string, string> = {};
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.forEach((value, key) => {
        query[key] = value;
      });
    } catch {
      // invalid URL, return empty query
    }
    return query;
  }

  protected async parseBody(request: NextRequest): Promise<Record<string, unknown> | null> {
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await request.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  protected extractContext(request: NextRequest): ServiceContext {
    const userId = request.headers.get('x-user-id') || null;
    const roles = (request.headers.get('x-user-roles') || '').split(',').filter(Boolean);
    const permissions = (request.headers.get('x-user-permissions') || '').split(',').filter(Boolean);
    const requestId = request.headers.get('x-request-id') || this.generateRequestId();

    return {
      userId,
      roles,
      permissions,
      requestId,
      timestamp: Date.now(),
      source: 'http',
    };
  }

  protected async parseRequest(request: NextRequest, params?: Record<string, string>): Promise<ParsedRequest> {
    const [body, query, context] = await Promise.all([
      this.parseBody(request),
      Promise.resolve(this.parseQuery(request.url)),
      Promise.resolve(this.extractContext(request)),
    ]);

    return {
      body,
      query,
      params: params || {},
      headers: Object.fromEntries(request.headers.entries()),
      context,
    };
  }

  protected ok<T>(data: T, meta: Record<string, unknown> = {}): NextResponse {
    return NextResponse.json({
      status: 200,
      data,
      error: null,
      meta,
    }, { status: 200 });
  }

  protected created<T>(data: T, meta: Record<string, unknown> = {}): NextResponse {
    return NextResponse.json({
      status: 201,
      data,
      error: null,
      meta,
    }, { status: 201 });
  }

  protected noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
  }

  protected badRequest(error: string, meta: Record<string, unknown> = {}): NextResponse {
    return NextResponse.json({
      status: 400,
      data: null,
      error,
      meta,
    }, { status: 400 });
  }

  protected unauthorized(error: string = 'Unauthorized'): NextResponse {
    return NextResponse.json({
      status: 401,
      data: null,
      error,
      meta: {},
    }, { status: 401 });
  }

  protected forbidden(error: string = 'Forbidden'): NextResponse {
    return NextResponse.json({
      status: 403,
      data: null,
      error,
      meta: {},
    }, { status: 403 });
  }

  protected notFound(error: string = 'Not found'): NextResponse {
    return NextResponse.json({
      status: 404,
      data: null,
      error,
      meta: {},
    }, { status: 404 });
  }

  protected conflict(error: string): NextResponse {
    return NextResponse.json({
      status: 409,
      data: null,
      error,
      meta: {},
    }, { status: 409 });
  }

  protected internalError(error: string = 'Internal server error'): NextResponse {
    return NextResponse.json({
      status: 500,
      data: null,
      error,
      meta: {},
    }, { status: 500 });
  }

  protected handleServiceResult<T>(result: { success: boolean; data: T | null; error: string | null; errorCode: string | null; metadata: Record<string, unknown> }): NextResponse {
    if (result.success) {
      return this.ok(result.data, result.metadata);
    }

    switch (result.errorCode) {
      case 'NOT_FOUND':
        return this.notFound(result.error || 'Not found');
      case 'UNAUTHORIZED':
        return this.unauthorized(result.error || 'Unauthorized');
      case 'FORBIDDEN':
        return this.forbidden(result.error || 'Forbidden');
      case 'VALIDATION_ERROR':
        return this.badRequest(result.error || 'Validation error', result.metadata);
      case 'CONFLICT':
        return this.conflict(result.error || 'Conflict');
      default:
        return this.internalError(result.error || 'Internal server error');
    }
  }

  protected async executeWithErrorHandling<T>(
    handler: () => Promise<T>,
    errorHandler?: (error: unknown) => NextResponse,
  ): Promise<NextResponse> {
    try {
      const result = await handler();
      if (result && typeof result === 'object' && 'headers' in result && typeof (result as any).headers === 'object') {
        return result as unknown as NextResponse;
      }
      return this.ok(result);
    } catch (error) {
      if (errorHandler) {
        return errorHandler(error);
      }
      const message = error instanceof Error ? error.message : 'Internal server error';
      return this.internalError(message);
    }
  }

  private generateRequestId(): string {
    return Date.now().toString(36) + '-' + Math.floor(Math.random() * 0xFFFFFF).toString(36);
  }
}