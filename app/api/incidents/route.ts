export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reportIncident, listIncidents } from '@/lib/services/operations.service'
import { requireAuth } from '@/lib/auth'
import { getHierarchyScope } from '@/lib/hierarchy/data-scope'
import { z } from 'zod'

const ReportIncidentSchema = z.object({
  incidentNumber: z.string().min(1),
  type: z.string().min(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  reportedBy: z.string().min(1),
  departmentId: z.string().min(1),
  location: z.string().min(1),
  province: z.string().min(1),
  district: z.string().min(1),
  description: z.string().min(10),
  respondingTeam: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const scope = await getHierarchyScope(auth)

    const body = await request.json()
    const validatedData = ReportIncidentSchema.parse(body)

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

    const incident = await reportIncident({
      ...validatedData,
      reportedBy: auth.id,
      departmentId,
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        officerId: auth.id,
        action: 'CREATE_INCIDENT',
        entityType: 'Incident',
        entityId: (incident as any).id,
        details: { incidentNumber: validatedData.incidentNumber, type: validatedData.type, severity: validatedData.severity, departmentId },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: incident,
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
    console.error('[v0] Report incident error:', error)
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
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
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

    const incidents = await listIncidents({
      ...(departmentId ? { departmentId } : {}),
      ...(scope.allowedEntityIds.length > 0 ? { departmentIds: scope.allowedEntityIds } : {}),
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
      ...(type ? { type } : {}),
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    })

    return NextResponse.json({
      success: true,
      data: incidents,
    })
  } catch (error) {
    console.error('[v0] List incidents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
