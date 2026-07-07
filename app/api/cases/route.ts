export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateCaseSchema } from '@/lib/schemas'
import { z } from 'zod'

// GET /api/cases - List all cases with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const departmentId = searchParams.get('departmentId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build filter
    const where: any = { isDeleted: false }

    if (status) where.status = status
    if (type) where.type = type
    if (departmentId) where.departmentId = departmentId
    if (search) {
      where.OR = [
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          createdBy: { select: { id: true, fullName: true, rank: true } },
          assignedTo: { select: { id: true, fullName: true, rank: true } },
          department: { select: { id: true, nameAr: true, nameEn: true } },
          complaints: { select: { id: true } },
          investigations: { select: { id: true } },
          evidence: { select: { id: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.case.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[v0] Get cases error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/cases - Create new case
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateCaseSchema.parse(body)

    // Generate case number (format: CASE-YYYY-XXXX)
    const year = new Date().getFullYear()
    const count = await prisma.case.count({ where: { isDeleted: false } })
    const caseNumber = `CASE-${year}-${String(count + 1).padStart(6, '0')}`

    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        severity: validatedData.severity,
        province: validatedData.province,
        district: validatedData.district,
        location: validatedData.location,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        departmentId: validatedData.departmentId,
        createdById: userId,
        status: 'OPEN',
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        department: true,
      },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        resourceType: 'Case',
        resourceId: newCase.id,
        newValue: JSON.stringify(newCase),
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: newCase,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('[v0] Create case error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
