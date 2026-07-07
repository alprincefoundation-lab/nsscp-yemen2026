export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  createInvestigation,
  listInvestigations,
  getInvestigation,
} from '@/lib/services/investigations.service'
import { z } from 'zod'

const CreateInvestigationSchema = z.object({
  caseId: z.string().min(1),
  assignedTo: z.string().min(1),
  type: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  description: z.string().optional(),
  departmentId: z.string().optional(),
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
    const validatedData = CreateInvestigationSchema.parse(body)

    const investigation = await createInvestigation(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: investigation,
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
    console.error('[v0] Create investigation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const caseId = searchParams.get('caseId')
    const assignedTo = searchParams.get('assignedTo')
    const status = searchParams.get('status')
    const departmentId = searchParams.get('departmentId')
    const skip = searchParams.get('skip')
    const take = searchParams.get('take')

    const investigations = await listInvestigations({
      ...(caseId && { caseId }),
      ...(assignedTo && { assignedTo }),
      ...(status && { status }),
      ...(departmentId && { departmentId }),
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    })

    return NextResponse.json({
      success: true,
      data: investigations,
    })
  } catch (error) {
    console.error('[v0] List investigations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
