export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { reportIncident, listIncidents } from '@/lib/services/operations.service'
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
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = ReportIncidentSchema.parse(body)

    const incident = await reportIncident(validatedData)

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
    const searchParams = request.nextUrl.searchParams
    const departmentId = searchParams.get('departmentId')
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const type = searchParams.get('type')
    const skip = searchParams.get('skip')
    const take = searchParams.get('take')

    const incidents = await listIncidents({
      ...(departmentId && { departmentId }),
      ...(status && { status }),
      ...(severity && { severity }),
      ...(type && { type }),
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
