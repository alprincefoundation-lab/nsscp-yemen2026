/**
 * API endpoints for Hierarchy Statistics (إحصائيات الهيكل)
 * Provides aggregated statistics for the hierarchical structure using HierarchyEntity
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type HierarchyEntityRow = {
  id: string
  name: string
  type: string
}

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''")
}

function sqlValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'NULL'
  }

  return `'${escapeSqlLiteral(value)}'`
}

async function countHierarchyChildren(parentId: string, type: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<{ count: number }[]>(`
    SELECT COUNT(*)::int AS count
    FROM "HierarchyEntity"
    WHERE "parentId" = ${sqlValue(parentId)}
      AND "type" = ${sqlValue(type)}
  `)

  return Number(rows[0]?.count ?? 0)
}

async function countGrandchildren(parentId: string, childType: string, grandchildType: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<{ count: number }[]>(`
    SELECT COUNT(*)::int AS count
    FROM "HierarchyEntity"
    WHERE "parentId" IN (
      SELECT "id"
      FROM "HierarchyEntity"
      WHERE "parentId" = ${sqlValue(parentId)}
        AND "type" = ${sqlValue(childType)}
    )
      AND "type" = ${sqlValue(grandchildType)}
  `)

  return Number(rows[0]?.count ?? 0)
}

// GET /api/hierarchy/statistics?parentId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')

    if (!parentId) {
      return NextResponse.json(
        { error: 'parentId parameter is required' },
        { status: 400 }
      )
    }

    const parentRows = await prisma.$queryRawUnsafe<HierarchyEntityRow[]>(`
      SELECT
        "id",
        "name",
        "type"
      FROM "HierarchyEntity"
      WHERE "id" = ${sqlValue(parentId)}
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
      departmentsCount: await countHierarchyChildren(parentId, 'DEPARTMENT'),
      sectionsCount: await countHierarchyChildren(parentId, 'SECTION'),
      unitsCount: await countHierarchyChildren(parentId, 'UNIT'),
      deepDepartmentsCount:
        parent.type === 'GOVERNORATE'
          ? await countGrandchildren(parentId, 'DEPARTMENT', 'SECTION')
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
