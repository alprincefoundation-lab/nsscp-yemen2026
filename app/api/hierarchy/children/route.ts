import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getApiScope } from '@/lib/hierarchy/data-scope'

type HierarchyEntityRow = {
  id: string
  name: string
  code: string
  type: string
  parentId: string | null
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

    const scope = await getApiScope(authUser.id, authUser.role, authUser.hierarchyEntityId)
    const allowedIds = scope.allowedEntityIds

    if (allowedIds.length > 0 && !allowedIds.includes(entityId)) {
      return NextResponse.json({ error: 'غير مصرح بالوصول لهذا الكيان' }, { status: 403 })
    }

    const children = await prisma.$queryRaw<HierarchyEntityRow[]>(Prisma.sql`
      SELECT
        "id",
        "name",
        "code",
        "type",
        "parentId"
      FROM "HierarchyEntity"
      WHERE "parentId" = ${entityId}
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
