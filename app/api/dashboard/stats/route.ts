/**
 * Dashboard Stats API — Hierarchy-Scoped Statistics Endpoint
 *
 * GET /api/dashboard/stats?nodeId=xxx
 *
 * - `nodeId=GLOBAL` (default): Returns republic-wide statistics.
 * - `nodeId=<governorateHierarchyEntityId>`: Returns stats scoped to that governorate.
 *
 * Security:
 * - Uses `apiGuard` for JWT verification + role check.
 * - Uses `HierarchyEngine.canAccessHierarchy()` to verify the requesting user
 *   has permission to view the requested governorate before returning data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiGuard } from '@/lib/hierarchy/guard';
import { auditSensitiveAction, auditAccessDenied, rbacGuard } from '@/lib/logging/audit';

// ─── Types ──────────────────────────────────────────────────────────

interface DashboardStats {
  nodeId: string;
  nodeName: string;
  scope: 'republic' | 'governorate';
  stats: {
    totalCases: number;
    activeCases: number;
    closedCases: number;
    highDangerCases: number;
    wantedPersons: number;
    activeWanted: number;
    officers: number;
    departments: number;
    sections: number;
    units: number;
    recentIncidents: number;
  };
}

// ─── GET Handler ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate & get scope
    const guard = await apiGuard(request);
    if ('error' in guard) return guard.error;
    const { user, engine, scope } = guard;

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId') || 'GLOBAL';

    // 3. RBAC Permission Check — deny + audit if unauthorised
    const denied = await rbacGuard(request, user, 'READ', 'STATS', nodeId === 'GLOBAL' ? null : nodeId);
    if (denied) return denied;

    // 4. Resolve the effective scope for the requested node
    if (nodeId === 'GLOBAL') {
      const stats = await fetchScopedStats(scope);

      // Log successful access to republic-wide stats
      await auditSensitiveAction(request, user, 'READ', 'STATS', 'GLOBAL', {
        details: { scope: 'republic', stats },
        hierarchyEntityId: null,
      });

      return NextResponse.json({
        success: true,
        data: {
          nodeId: 'GLOBAL',
          nodeName: 'الجمهورية كاملة',
          scope: 'republic',
          stats,
        } as DashboardStats,
      });
    }

    // 5. Governorate-specific — verify hierarchy permission (double check)
    const canAccess = await engine.canAccessHierarchy(nodeId);
    if (!canAccess) {
      // Log the unauthorised attempt before returning 403
      return auditAccessDenied(
        request, user, 'READ', 'STATS', nodeId,
        'ليس لديك صلاحية للوصول إلى بيانات هذه المحافظة',
      );
    }

    // 6. Fetch the department name
    const department = await prisma.department.findUnique({
      where: { id: nodeId },
      select: { id: true, nameAr: true },
    });

    if (!department) {
      return NextResponse.json(
        { error: 'الإدارة غير موجودة' },
        { status: 404 },
      );
    }

    // 7. Expand scope to include all descendants under this department
    const descendantIds = await engine.getDescendantIds();
    const fullScope = { departmentId: { in: descendantIds } };
    const stats = await fetchScopedStats(fullScope);

    // Log successful access to department-scoped stats
    await auditSensitiveAction(request, user, 'READ', 'STATS', nodeId, {
      details: { scope: 'governorate', governorateName: department.nameAr, stats },
      hierarchyEntityId: nodeId,
      hierarchyEntityType: 'DEPARTMENT',
    });

    return NextResponse.json({
      success: true,
      data: {
        nodeId: department.id,
        nodeName: department.nameAr,
        scope: 'governorate',
        stats,
      } as DashboardStats,
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);

    // Try to log the error with audit
    try {
      const { extractRequestMeta } = await import('@/lib/core/audit-engine');
      const meta = extractRequestMeta(request);
      await prisma.auditLog.create({
        data: {
          action: 'ERROR',
          resourceType: 'STATS',
          resourceId: 'N/A',
          newValue: `Dashboard stats internal error: ${(error as Error).message}` as any,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
    } catch { /* audit log failure should not block response */ }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإحصائيات' },
      { status: 500 },
    );
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

async function fetchScopedStats(scope: { departmentId?: string | { in: string[] }; createdById?: string }) {
  const hierarchyWhere = scope.departmentId
    ? { departmentId: scope.departmentId }
    : {};

  const [
    totalCases,
    activeCases,
    closedCases,
    highDangerCases,
    wantedPersons,
    activeWanted,
    officers,
    departments,
    recentIncidents,
  ] = await Promise.all([
    prisma.case.count({ where: hierarchyWhere as any }),
    prisma.case.count({ where: { ...hierarchyWhere, status: 'ACTIVE' } as any }),
    prisma.case.count({ where: { ...hierarchyWhere, status: 'CLOSED' } as any }),
    prisma.case.count({
      where: {
        ...hierarchyWhere,
        severity: 'HIGH'
      } as any,
    }).catch(() => 0),
    prisma.wantedPerson.count({ where: hierarchyWhere as any }).catch(() => 0),
    prisma.wantedPerson.count({ where: { ...hierarchyWhere, status: 'ACTIVE' } as any }).catch(() => 0),
    prisma.user.count({ where: hierarchyWhere as any }).catch(() => 0),
    prisma.department.count({ where: hierarchyWhere as any }),
    prisma.incident.count({
      where: { ...hierarchyWhere, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } as any,
    }).catch(() => 0),
  ]);

  return {
    totalCases, activeCases, closedCases, highDangerCases,
    wantedPersons, activeWanted, officers,
    departments, sections: 0, units: 0, recentIncidents,
  };
}
