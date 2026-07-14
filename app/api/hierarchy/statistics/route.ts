/**
 * API endpoints for Hierarchy Statistics (إحصائيات الهيكل)
 * Provides aggregated statistics for the hierarchical structure using HierarchyEntity
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getAuthenticatedUser } from '@/lib/auth'
import { getApiScope } from '@/lib/hierarchy/data-scope'

type HierarchyEntityRow = {
  id: string
  name: string
  type: string
}

async function countHierarchyChildren(parentId: string, type: string, allowedIds: string[] | null): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM "HierarchyEntity"
    WHERE "parentId" = ${parentId}
      AND "type" = ${type}
      ${
        allowedIds && allowedIds.length > 0
          ? Prisma.sql`AND "id" IN (${Prisma.join(allowedIds)})`
          : Prisma.empty
      }
  `)

  return Number(rows[0]?.count ?? 0)
}

async function countGrandchildren(parentId: string, childType: string, grandchildType: string, allowedIds: string[] | null): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM "HierarchyEntity"
    WHERE "parentId" IN (
      SELECT "id"
      FROM "HierarchyEntity"
      WHERE "parentId" = ${parentId}
        AND "type" = ${childType}
        ${
          allowedIds && allowedIds.length > 0
            ? Prisma.sql`AND "id" IN (${Prisma.join(allowedIds)})`
            : Prisma.empty
        }
    )
      AND "type" = ${grandchildType}
      ${
        allowedIds && allowedIds.length > 0
          ? Prisma.sql`AND "id" IN (${Prisma.join(allowedIds)})`
          : Prisma.empty
      }
  `)

  return Number(rows[0]?.count ?? 0)
}

// GET /api/hierarchy/statistics?parentId=xxx
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')

    if (!parentId) {
      return NextResponse.json(
        { error: 'parentId parameter is required' },
        { status: 400 }
      )
    }

    const scope = await getApiScope(authUser.id, authUser.role, authUser.hierarchyEntityId)
    const allowedIds = scope.allowedEntityIds

    if (allowedIds.length > 0 && !allowedIds.includes(parentId)) {
      return NextResponse.json({ error: 'غير مصرح بالوصول لهذا الكيان' }, { status: 403 })
    }

    const parentRows = await prisma.$queryRaw<HierarchyEntityRow[]>(Prisma.sql`
      SELECT
        "id",
        "name",
        "type"
      FROM "HierarchyEntity"
      WHERE "id" = ${parentId}
      LIMIT 1
    `)

    const parent = parentRows[0] ?? null
    if (!parent) {
      return NextResponse.json({ error: 'Parent entity not found' }, { status: 404 })
    }

    const stats = {
      id: parent.id,
      name: parent.name,
      type: parent.type,
      departmentsCount: await countHierarchyChildren(parentId, 'DEPARTMENT', allowedIds),
      sectionsCount: await countHierarchyChildren(parentId, 'SECTION', allowedIds),
      unitsCount: await countHierarchyChildren(parentId, 'UNIT', allowedIds),
      deepDepartmentsCount:
        parent.type === 'GOVERNORATE'
          ? await countGrandchildren(parentId, 'DEPARTMENT', 'SECTION', allowedIds)
          : 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching hierarchy statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hierarchy statistics' },
      { status: 500 }
    )
  }
}
