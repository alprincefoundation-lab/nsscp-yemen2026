export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createCell, listCells } from '@/lib/services/prison.service'
import { requireAuth } from '@/lib/auth'
import { getHierarchyScope } from '@/lib/hierarchy/data-scope'
import { z } from 'zod'

const CreateCellSchema = z.object({
  cellNumber: z.string().min(1),
  block: z.string().min(1),
  capacity: z.number().int().positive(),
  cellType: z.string().min(1),
  departmentId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const scope = await getHierarchyScope(auth)

    const body = await request.json()
    const validatedData = CreateCellSchema.parse(body)

    const departmentId = validatedData.departmentId || auth.hierarchyEntityId
    if (departmentId && scope.allowedEntityIds.length > 0 && !scope.allowedEntityIds.includes(departmentId)) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذا النطاق' },
        { status: 403 }
      )
    }

    const cell = await createCell({
      ...validatedData,
      departmentId,
    })

    return NextResponse.json(
      {
        success: true,
        data: cell,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[v0] Create cell error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const scope = await getHierarchyScope(auth)
    const searchParams = request.nextUrl.searchParams
    const block = searchParams.get('block')
    const status = searchParams.get('status')
    const departmentId = searchParams.get('departmentId')

    const cells = await listCells({
      ...(scope.allowedEntityIds.length > 0 ? { departmentIds: scope.allowedEntityIds } : {}),
      ...(block && { block }),
      ...(status && { status }),
      ...(departmentId && { departmentId }),
    })

    return NextResponse.json({
      success: true,
      data: cells,
    })
  } catch (error) {
    console.error('[v0] List cells error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
