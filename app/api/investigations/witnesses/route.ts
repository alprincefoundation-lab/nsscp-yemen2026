export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  addWitness,
  listWitnesses,
} from '@/lib/services/investigations.service'
import { z } from 'zod'

const AddWitnessSchema = z.object({
  investigationId: z.string().min(1),
  name: z.string().min(1),
  identityNumber: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  statement: z.string().optional(),
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
    const validatedData = AddWitnessSchema.parse(body)

    const witness = await addWitness({
      ...validatedData,
      birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : undefined,
    })

    return NextResponse.json(
      {
        success: true,
        data: witness,
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
    console.error('[v0] Add witness error:', error)
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

    const witnesses = await listWitnesses(investigationId)

    return NextResponse.json({
      success: true,
      data: witnesses,
    })
  } catch (error) {
    console.error('[v0] List witnesses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
