export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createOperation, listOperations } from '@/lib/services/operations.service'
import { requireAuth } from '@/lib/auth'
import { getHierarchyScope } from '@/lib/hierarchy/data-scope'
import { z } from 'zod'

const CreateOperationSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.string().min(1),
  commanderId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().optional(),
  objectives: z.string().min(1),
  departmentId: z.string().min(1),
  location: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const scope = await getHierarchyScope(auth)
    const body = await request.json()
    const validatedData = CreateOperationSchema.parse(body)

    const departmentId = validatedData.departmentId || auth.hierarchyEntityId
    if (!departmentId) {
      return NextResponse.json(
        { error: 'Hierarchy context is required' },
        { status: 400 }
      )
    }

    if (scope.allowedEntityIds.length > 0 && !scope.allowedEntityIds.includes(departmentId)) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذا النطاق' },
        { status: 403 }
      )
    }

    if (!['SUPER_ADMIN', 'MINISTRY_ADMIN', 'GOVERNORATE_ADMIN', 'DEPARTMENT_HEAD', 'DEPARTMENT_MANAGER', 'SECTION_HEAD', 'SECTION_MANAGER', 'UNIT_HEAD', 'OFFICER'].includes(auth.role)) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية إنشاء عملية' },
        { status: 403 }
      )
    }

    const operation = await createOperation({
      ...validatedData,
      commanderId: auth.id,
      departmentId,
      startDate: new Date(validatedData.startDate),
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        officerId: auth.id,
        action: 'CREATE_OPERATION',
        entityType: 'Operation',
        entityId: (operation as any).id,
        details: { name: validatedData.name, code: validatedData.code, type: validatedData.type, departmentId },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: operation,
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
    console.error('[v0] Create operation error:', error)
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
    const departmentId = searchParams.get('departmentId')
    const commanderId = searchParams.get('commanderId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const skip = searchParams.get('skip')
    const take = searchParams.get('take')

    // Validate client-supplied departmentId against scope
    if (departmentId && scope.allowedEntityIds.length > 0 && !scope.allowedEntityIds.includes(departmentId)) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذا النطاق' },
        { status: 403 }
      )
    }

    const operations = await listOperations({
      ...(departmentId ? { departmentId } : {}),
      ...(scope.allowedEntityIds.length > 0 ? { departmentIds: scope.allowedEntityIds } : {}),
      ...(commanderId ? { commanderId } : {}),
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    })

    return NextResponse.json({
      success: true,
      data: operations,
    })
  } catch (error) {
    console.error('[v0] List operations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
