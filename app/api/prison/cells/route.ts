export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createCell, listCells } from '@/lib/services/prison.service'
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
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = CreateCellSchema.parse(body)

    const cell = await createCell(validatedData)

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
    const searchParams = request.nextUrl.searchParams
    const block = searchParams.get('block')
    const status = searchParams.get('status')
    const departmentId = searchParams.get('departmentId')

    const cells = await listCells({
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
