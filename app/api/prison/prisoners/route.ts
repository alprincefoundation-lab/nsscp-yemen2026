export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { registerPrisoner, listPrisoners } from '@/lib/services/prison.service'
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
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = RegisterPrisonerSchema.parse(body)

    const prisoner = await registerPrisoner({
      ...validatedData,
      dateOfBirth: new Date(validatedData.dateOfBirth),
      sentenceStartDate: new Date(validatedData.sentenceStartDate),
      estimatedReleaseDate: validatedData.estimatedReleaseDate
        ? new Date(validatedData.estimatedReleaseDate)
        : undefined,
      bookingDate: new Date(validatedData.bookingDate),
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
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const crimeType = searchParams.get('crimeType')
    const departmentId = searchParams.get('departmentId')
    const currentCellId = searchParams.get('currentCellId')
    const skip = searchParams.get('skip')
    const take = searchParams.get('take')

    const prisoners = await listPrisoners({
      ...(status && { status }),
      ...(crimeType && { crimeType }),
      ...(departmentId && { departmentId }),
      ...(currentCellId && { currentCellId }),
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
