/**
 * HierarchyGuard — API Route Protection for NSSCP Platform
 * 
 * Wraps API routes with automatic hierarchy scope enforcement.
 * Every API route MUST use this guard instead of manual filtering.
 * 
 * Usage:
 *   import { apiGuard } from '@/lib/hierarchy/guard';
 *   
 *   export async function GET(req: NextRequest) {
 *     const guard = await apiGuard(req);
 *     if (guard.error) return guard.error;
 *     const { user, engine, scope } = guard;
 *     // ... use scope for Prisma queries
 *   }
 */

import { NextResponse } from 'next/server';
import { HierarchyEngine } from './index';
import type { ScopeFilter } from './types';
import { requireAuth } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/auth/auth.types';
import { createRBACContext, resolvePermission, type Action, type Resource } from '@/lib/auth/rbac';
import { createAuditLog, extractRequestMeta } from '@/lib/core/audit-engine';

export interface GuardResult {
  user: AuthenticatedUser;
  engine: HierarchyEngine;
  scope: ScopeFilter;
  error?: never;
}

export interface GuardError {
  error: NextResponse;
  user?: never;
  engine?: never;
  scope?: never;
}

export type GuardResponse = GuardResult | GuardError;

/**
 * Protect an API route with hierarchy enforcement.
 * Returns the authenticated user, hierarchy engine, and scope filter.
 * 
 * Options:
 *   - permission: Check specific permission
 *   - requireSuperAdmin: Require SUPER_ADMIN role
 *   - requireOneOf: Require one of the specified roles
 */
import { NextRequest } from 'next/server';

export async function apiGuard(
  request: Request,
  options?: {
    permission?: string;
    requireSuperAdmin?: boolean;
    requireOneOf?: string[];
  }
): Promise<GuardResponse> {
  try {
    const user = await requireAuth(request as NextRequest);
    // Role checks
    if (options?.requireSuperAdmin && user.role !== 'SUPER_ADMIN') {
      return {
        error: NextResponse.json(
          { error: 'هذه العملية تتطلب صلاحية مدير النظام العام' },
          { status: 403 }
        ),
      };
    }

    if (options?.requireOneOf && !options.requireOneOf.includes(user.role)) {
      return {
        error: NextResponse.json(
          { error: 'ليس لديك صلاحية للوصول إلى هذا المورد' },
          { status: 403 }
        ),
      };
    }

    // Create hierarchy engine with unified input
    const engine = new HierarchyEngine({
      id: user.id,
      role: user.roles[0]?.name || 'USER',
      departmentId: user.departmentId,
    });

    // Get scope filter
    const scope = await engine.getScope();

    // Permission check (if specified)
    if (options?.permission) {
      try {
        const { requirePermission } = await import('@/lib/core/rbac-engine');
        await requirePermission(user as any, options.permission);
      } catch {
        return {
          error: NextResponse.json(
            { error: `ليس لديك صلاحية: ${options.permission}` },
            { status: 403 }
          ),
        };
      }
    }

    return { user, engine, scope };
  } catch (err: any) {
    return {
      error: NextResponse.json(
        { error: err.message || 'غير مصرح بالوصول' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Helper to add hierarchy scope to any Prisma where clause
 */
export function withScope<T extends Record<string, any>>(
  where: T,
  scope: ScopeFilter
): T {
  const result = { ...where };
  // departmentId — the universal scope key for all data models
  if (scope.departmentId) (result as any).departmentId = scope.departmentId;
  // createdById — self-scoped users (OFFICER, DATA_ENTRY, VIEW_ONLY)
  if (scope.createdById) (result as any).createdById = scope.createdById;
  return result;
}

/**
 * Get a paginated response with hierarchy scope applied
 */
export async function paginatedResponse<T>(
  model: any,
  scope: ScopeFilter,
  options: {
    page?: number;
    pageSize?: number;
    orderBy?: Record<string, string>;
    select?: any;
    include?: any;
    additionalWhere?: Record<string, any>;
  }
) {
  const page = options.page || 1;
  const pageSize = options.pageSize || 50;
  const skip = (page - 1) * pageSize;
  const where = withScope(options.additionalWhere || {}, scope);

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: options.orderBy || { createdAt: 'desc' },
      ...(options.select ? { select: options.select } : {}),
      ...(options.include ? { include: options.include } : {}),
    }),
    model.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
