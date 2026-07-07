export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createOperation, listOperations } from '@/lib/services/operations.service'
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
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = CreateOperationSchema.parse(body)

    const operation = await createOperation({
      ...validatedData,
      startDate: new Date(validatedData.startDate),
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
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
    const searchParams = request.nextUrl.searchParams
    const departmentId = searchParams.get('departmentId')
    const commanderId = searchParams.get('commanderId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const skip = searchParams.get('skip')
    const take = searchParams.get('take')

    const operations = await listOperations({
      ...(departmentId && { departmentId }),
      ...(commanderId && { commanderId }),
      ...(status && { status }),
      ...(type && { type }),
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
