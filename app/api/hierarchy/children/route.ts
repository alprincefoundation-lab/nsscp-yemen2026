import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { HierarchyEngine } from '@/lib/hierarchy'
import { prisma } from '@/lib/prisma'

type HierarchyEntityRow = {
  id: string
  name: string
  code: string
  type: string
  parentId: string | null
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

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entityId')
    if (!entityId) {
      return NextResponse.json({ error: 'entityId parameter is required' }, { status: 400 })
    }

    const engine = new HierarchyEngine({
      id: authUser.id,
      role: authUser.role,
      hierarchyNodeId: authUser.hierarchyEntityId,
    })

    const canAccess = await engine.canAccessHierarchy(entityId)
    if (!canAccess) {
      return NextResponse.json({ error: 'غير مصرح بالوصول لهذا الكيان' }, { status: 403 })
    }

    const children = await prisma.$queryRawUnsafe<HierarchyEntityRow[]>(`
      SELECT
        "id",
        "name",
        "code",
        "type",
        "parentId"
      FROM "HierarchyEntity"
      WHERE "parentId" = ${sqlValue(entityId)}
      ORDER BY "name" ASC
    `)

    return NextResponse.json({
      success: true,
      data: children.map((child) => ({
        id: child.id,
        nameAr: child.name,
        code: child.code,
        parentDepartmentId: child.parentId,
        type: child.type,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
