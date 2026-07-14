export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerPrisoner, listPrisoners } from '@/lib/services/prison.service'
import { requireAuth } from '@/lib/auth'
import { getHierarchyScope } from '@/lib/hierarchy/data-scope'
import { z } from 'zod'

const RegisterPrisonerSchema = z.object({
  prisonerId: z.string().min(1),
  fullName: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  nationality: z.string().min(1),
  idNumber: z.string().min(1),
  crimeType: z.string().min(1),
  sentenceLength: z.number().optional(),
  sentenceStartDate: z.string(),
  estimatedReleaseDate: z.string().optional(),
  currentCellId: z.string().optional(),
  bookingDate: z.string(),
  arrestReason: z.string().min(1),
  departmentId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const scope = await getHierarchyScope(auth)

    const body = await request.json()
    const validatedData = RegisterPrisonerSchema.parse(body)

    const departmentId = validatedData.departmentId || auth.hierarchyEntityId
    if (departmentId && scope.allowedEntityIds.length > 0 && !scope.allowedEntityIds.includes(departmentId)) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذا النطاق' },
        { status: 403 }
      )
    }

    const prisoner = await registerPrisoner({
      ...validatedData,
      departmentId,
      dateOfBirth: new Date(validatedData.dateOfBirth),
      sentenceStartDate: new Date(validatedData.sentenceStartDate),
      estimatedReleaseDate: validatedData.estimatedReleaseDate
        ? new Date(validatedData.estimatedReleaseDate)
        : undefined,
      bookingDate: new Date(validatedData.bookingDate),
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        officerId: auth.id,
        action: 'REGISTER_PRISONER',
        entityType: 'Prisoner',
        entityId: (prisoner as any).id,
        details: { prisonerId: validatedData.prisonerId, fullName: validatedData.fullName, crimeType: validatedData.crimeType, departmentId },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: prisoner,
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
    console.error('[v0] Register prisoner error:', error)
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
    const status = searchParams.get('status')
    const crimeType = searchParams.get('crimeType')
    const departmentId = searchParams.get('departmentId')
    const currentCellId = searchParams.get('currentCellId')
    const skip = searchParams.get('skip')
    const take = searchParams.get('take')

    // Validate client-supplied departmentId against scope
    if (departmentId && scope.allowedEntityIds.length > 0 && !scope.allowedEntityIds.includes(departmentId)) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذا النطاق' },
        { status: 403 }
      )
    }

    const prisoners = await listPrisoners({
      ...(scope.allowedEntityIds.length > 0 ? { departmentIds: scope.allowedEntityIds } : {}),
      ...(status ? { status } : {}),
      ...(crimeType ? { crimeType } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(currentCellId ? { currentCellId } : {}),
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    })

    return NextResponse.json({
      success: true,
      data: prisoners,
    })
  } catch (error) {
    console.error('[v0] List prisoners error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
