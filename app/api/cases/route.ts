export const dynamic = 'force-dynamic'

import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateCaseSchema } from '@/lib/schemas'
import { apiGuard } from '@/lib/hierarchy/guard'
import { z } from 'zod'

type LegacyCaseRow = {
  id: string
  caseNumber: string
  title: string
  description: string | null
  caseType: string
  status: string
  priority: string
  governorateId: string | null
  districtId: string | null
  createdAt: Date
  updatedAt: Date
  assignedOfficerId: string | null
  hierarchyEntityId: string | null
}

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''")
}

function sqlValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'NULL'
  }

  return `'${escapeSqlLiteral(value)}'`
}

function buildCaseWhereClause(filters: {
  status?: string | null
  type?: string | null
  departmentId?: string | null
  search?: string | null
}) {
  const conditions: string[] = ['1 = 1']

  if (filters.status) {
    conditions.push(`"status" = ${sqlValue(filters.status)}`)
  }

  if (filters.type) {
    conditions.push(`"caseType" = ${sqlValue(filters.type)}`)
  }

  if (filters.departmentId) {
    conditions.push(`"hierarchyEntityId" = ${sqlValue(filters.departmentId)}`)
  }

  if (filters.search) {
    const search = `%${escapeSqlLiteral(filters.search)}%`
    conditions.push(
      `("caseNumber" ILIKE '${search}' OR "title" ILIKE '${search}' OR COALESCE("description", '') ILIKE '${search}')`
    )
  }

  return `WHERE ${conditions.join(' AND ')}`
}

async function loadCases(whereClause: string, limit: number, skip: number) {
  return prisma.$queryRawUnsafe<LegacyCaseRow[]>(`
    SELECT
      "id",
      "caseNumber",
      "title",
      "description",
      "caseType",
      "status",
      "priority",
      "governorateId",
      "districtId",
      "createdAt",
      "updatedAt",
      "assignedOfficerId",
      "hierarchyEntityId"
    FROM "Case"
    ${whereClause}
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
    OFFSET ${skip}
  `)
}

async function countCases(whereClause: string) {
  const rows = await prisma.$queryRawUnsafe<{ count: number }[]>(`
    SELECT COUNT(*)::int AS count
    FROM "Case"
    ${whereClause}
  `)

  return Number(rows[0]?.count ?? 0)
}

// GET /api/cases - List all cases with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuard(request)
    if ('error' in guard) return guard.error

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const departmentId = searchParams.get('departmentId')
    const search = searchParams.get('search')

    const skip = Math.max(page - 1, 0) * limit
    const whereClause = buildCaseWhereClause({ status, type, departmentId, search })

    const [cases, total] = await Promise.all([
      loadCases(whereClause, limit, skip),
      countCases(whereClause),
    ])

    return NextResponse.json({
      success: true,
      data: cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    })
  } catch (error) {
    console.error('[v0] Get cases error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/cases - Create new case
export async function POST(request: NextRequest) {
  try {
    const guard = await apiGuard(request)
    if ('error' in guard) return guard.error

    const { user } = guard
    const body = await request.json()
    const validatedData = CreateCaseSchema.parse(body)

    const caseCount = await prisma.$queryRawUnsafe<{ count: number }[]>(`
      SELECT COUNT(*)::int AS count
      FROM "Case"
    `)
    const caseNumber = `CASE-${new Date().getFullYear()}-${String((caseCount[0]?.count ?? 0) + 1).padStart(6, '0')}`
    const caseId = randomUUID()
    const assignmentId = randomUUID()
    const priority = (validatedData.severity ?? 'MEDIUM').toLowerCase()
    const hierarchyEntityId = validatedData.departmentId ?? null

    await prisma.$executeRawUnsafe(`
      INSERT INTO "Case" (
        "id",
        "caseNumber",
        "title",
        "description",
        "caseType",
        "status",
        "priority",
        "governorateId",
        "districtId",
        "assignedOfficerId",
        "hierarchyEntityId",
        "createdAt",
        "updatedAt"
      ) VALUES (
        '${caseId}',
        '${escapeSqlLiteral(caseNumber)}',
        '${escapeSqlLiteral(validatedData.title)}',
        ${sqlValue(validatedData.description ?? null)},
        '${escapeSqlLiteral(validatedData.type)}',
        'open',
        '${escapeSqlLiteral(priority)}',
        ${sqlValue(validatedData.province ?? null)},
        ${sqlValue(validatedData.district ?? null)},
        '${escapeSqlLiteral(user.id)}',
        ${sqlValue(hierarchyEntityId)},
        NOW(),
        NOW()
      )
    `)

    await prisma.$executeRawUnsafe(`
      INSERT INTO "CaseAssignment" (
        "id",
        "caseId",
        "officerId",
        "role",
        "assignedAt"
      ) VALUES (
        '${assignmentId}',
        '${caseId}',
        '${escapeSqlLiteral(user.id)}',
        'creator',
        NOW()
      )
    `)

    await prisma.auditLog.create({
      data: {
        officerId: user.id,
        action: 'CREATE',
        entityType: 'Case',
        entityId: caseId,
        details: {
          caseNumber,
          title: validatedData.title,
          caseType: validatedData.type,
        },
      },
    })

    const [created] = await loadCases(`WHERE "id" = '${escapeSqlLiteral(caseId)}'`, 1, 0)

    return NextResponse.json(
      {
        success: true,
        data: created ?? {
          id: caseId,
          caseNumber,
          title: validatedData.title,
          description: validatedData.description ?? null,
          caseType: validatedData.type,
          status: 'open',
          priority,
          governorateId: validatedData.province ?? null,
          districtId: validatedData.district ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          assignedOfficerId: user.id,
          hierarchyEntityId,
        },
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
