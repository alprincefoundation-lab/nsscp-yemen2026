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

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiGuard } from '@/lib/hierarchy/guard'
import { auditSensitiveAction, auditAccessDenied, rbacGuard } from '@/lib/logging/audit'
import { Prisma } from '@prisma/client'

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

async function countRows(query: Prisma.Sql): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: number }[]>(query)
  return Number(rows[0]?.count ?? 0)
}

// ─── GET Handler ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate & get scope
    const guard = await apiGuard(request);
    if ('error' in guard) return guard.error;
    const { user, dataScope } = guard;

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId') || 'GLOBAL';

    // 3. RBAC Permission Check — deny + audit if unauthorised
    const denied = await rbacGuard(request, user, 'READ', 'STATS', nodeId === 'GLOBAL' ? null : nodeId);
    if (denied) return denied;

    // 4. Resolve the effective scope for the requested node
    if (nodeId === 'GLOBAL') {
      const stats = await fetchScopedStats(null);

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
    const descendantIds = dataScope.allowedEntityIds;
    if (descendantIds.length > 0 && !descendantIds.includes(nodeId)) {
      // Log the unauthorised attempt before returning 403
      return auditAccessDenied(
        request, user, 'READ', 'STATS', nodeId,
        'ليس لديك صلاحية للوصول إلى بيانات هذه المحافظة',
      );
    }

    // 6. Fetch the department name from the legacy Department table
    const departments = await prisma.$queryRaw<{ id: string; name: string }[]>(Prisma.sql`
      SELECT "id", "name"
      FROM "Department"
      WHERE "id" = ${nodeId}
      LIMIT 1
    `)

    const department = departments[0] ?? null;

    if (!department) {
      return NextResponse.json(
        { error: 'الإدارة غير موجودة' },
        { status: 404 },
      );
    }

    // 7. Expand scope to include all descendants under this department
    const stats = await fetchScopedStats(nodeId === 'GLOBAL' ? null : descendantIds);

    // Log successful access to department-scoped stats
    await auditSensitiveAction(request, user, 'READ', 'STATS', nodeId, {
      details: { scope: 'governorate', governorateName: department.name, stats },
      hierarchyEntityId: nodeId,
      hierarchyEntityType: 'DEPARTMENT',
    });

    return NextResponse.json({
      success: true,
      data: {
        nodeId: department.id,
        nodeName: department.name,
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
          entityType: 'STATS',
          entityId: 'N/A',
          details: { error: (error as Error).message },
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

async function fetchScopedStats(descendantIds: string[] | null) {
  const caseScope = descendantIds && descendantIds.length > 0
    ? Prisma.sql`WHERE "hierarchyEntityId" IN (${Prisma.join(descendantIds)})`
    : Prisma.empty
  const officerScope = descendantIds && descendantIds.length > 0
    ? Prisma.sql`WHERE "department" IN (${Prisma.join(descendantIds)})`
    : Prisma.empty
  const departmentScope = descendantIds && descendantIds.length > 0
    ? Prisma.sql`WHERE "id" IN (${Prisma.join(descendantIds)})`
    : Prisma.empty
  const sectionScope = descendantIds && descendantIds.length > 0
    ? Prisma.sql`WHERE "departmentId" IN (${Prisma.join(descendantIds)})`
    : Prisma.empty
  const unitScope = descendantIds && descendantIds.length > 0
    ? Prisma.sql`
      WHERE "sectionId" IN (
        SELECT "id"
        FROM "Section"
        ${sectionScope}
      )
    `
    : Prisma.empty
  const recentFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const recentIncidentScope = descendantIds && descendantIds.length > 0
    ? Prisma.sql`WHERE "hierarchyEntityId" IN (${Prisma.join(descendantIds)}) AND`
    : Prisma.sql`WHERE`

  const [
    totalCases,
    activeCases,
    closedCases,
    highDangerCases,
    wantedPersons,
    activeWanted,
    officers,
    departments,
    sections,
    units,
    recentIncidents,
  ] = await Promise.all([
    countRows(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Case"
      ${caseScope}
    `),
    countRows(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Case"
      ${caseScope}
      ${descendantIds && descendantIds.length > 0 ? Prisma.sql`AND` : Prisma.sql`WHERE`}
      "status" IN ('OPEN', 'UNDER_INVESTIGATION', 'PENDING_REVIEW')
    `),
    countRows(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Case"
      ${caseScope}
      ${descendantIds && descendantIds.length > 0 ? Prisma.sql`AND` : Prisma.sql`WHERE`}
      "status" IN ('CLOSED', 'ARCHIVED')
    `),
    countRows(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Case"
      ${caseScope}
      ${descendantIds && descendantIds.length > 0 ? Prisma.sql`AND` : Prisma.sql`WHERE`}
      "priority" IN ('HIGH', 'CRITICAL')
    `),
    prisma.wantedPerson.count().catch(() => 0),
    prisma.wantedPerson.count({ where: { status: 'مطلوب حياً' } as any }).catch(() => 0),
    countRows(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Officer"
      ${officerScope}
    `),
    countRows(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Department"
      ${departmentScope}
    `),
    countRows(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Section"
      ${sectionScope}
    `),
    countRows(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Unit"
      ${unitScope}
    `),
    countRows(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Incident"
      ${recentIncidentScope} "createdAt" >= ${recentFrom}
    `),
  ]);

  return {
    totalCases,
    activeCases,
    closedCases,
    highDangerCases,
    wantedPersons,
    activeWanted,
    officers,
    departments,
    sections,
    units,
    recentIncidents,
  };
}
