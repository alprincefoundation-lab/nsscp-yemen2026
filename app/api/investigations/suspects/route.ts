export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  addSuspect,
  listSuspects,
  updateSuspectStatus,
} from '@/lib/services/investigations.service'
import { z } from 'zod'

const AddSuspectSchema = z.object({
  investigationId: z.string().min(1),
  name: z.string().min(1),
  identityNumber: z.string().min(1),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
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
    const validatedData = AddSuspectSchema.parse(body)

    const suspect = await addSuspect({
      ...validatedData,
      birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : undefined,
    })

    return NextResponse.json(
      {
        success: true,
        data: suspect,
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
    console.error('[v0] Add suspect error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const investigationId = searchParams.get('investigationId')

    if (!investigationId) {
      return NextResponse.json(
        { error: 'investigationId is required' },
        { status: 400 }
      )
    }

    const suspects = await listSuspects(investigationId)

    return NextResponse.json({
      success: true,
      data: suspects,
    })
  } catch (error) {
    console.error('[v0] List suspects error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
