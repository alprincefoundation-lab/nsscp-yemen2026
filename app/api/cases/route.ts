export const dynamic = 'force-dynamic'

import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateCaseSchema } from '@/lib/schemas'
import { apiGuard } from '@/lib/hierarchy/guard'
import { Prisma } from '@prisma/client'
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

function buildCaseWhereClause(filters: {
  status?: string | null
  type?: string | null
  departmentId?: string | null
  search?: string | null
}, allowedEntityIds: string[] | null, userId: string) {
  const conditions: Prisma.Sql[] = [Prisma.sql`1 = 1`]

  if (filters.status) {
    conditions.push(Prisma.sql`"status" = ${filters.status}`)
  }

  if (filters.type) {
    conditions.push(Prisma.sql`"caseType" = ${filters.type}`)
  }

  if (filters.departmentId) {
    conditions.push(Prisma.sql`"hierarchyEntityId" = ${filters.departmentId}`)
  }

  if (filters.search) {
    const search = `%${filters.search}%`
    conditions.push(Prisma.sql`("caseNumber" ILIKE ${search} OR "title" ILIKE ${search} OR COALESCE("description", '') ILIKE ${search})`)
  }

  if (allowedEntityIds && allowedEntityIds.length > 0) {
    conditions.push(
      Prisma.sql`("hierarchyEntityId" IN (${Prisma.join(allowedEntityIds)}) OR "assignedOfficerId" = ${userId})`
    )
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
}

async function loadCases(whereClause: Prisma.Sql, limit: number, skip: number) {
  return prisma.$queryRaw<LegacyCaseRow[]>(Prisma.sql`
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

async function countCases(whereClause: Prisma.Sql) {
  const rows = await prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM "Case"
    ${whereClause}
  `)

  return Number(rows[0]?.count ?? 0)
}

// GET /api/cases - List all cases with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuard(request, { permission: 'READ_CASE' })
    if ('error' in guard) return guard.error

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const departmentId = searchParams.get('departmentId')
    const search = searchParams.get('search')

    const skip = Math.max(page - 1, 0) * limit
    const whereClause = buildCaseWhereClause(
      { status, type, departmentId, search },
      guard.dataScope.allowedEntityIds,
      guard.user.id
    )

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
    const guard = await apiGuard(request, { permission: 'CREATE_CASE' })
    if ('error' in guard) return guard.error

    const { user } = guard
    const body = await request.json()
    const validatedData = CreateCaseSchema.parse(body)

    const caseCount = await prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Case"
    `)
    const caseNumber = `CASE-${new Date().getFullYear()}-${String((caseCount[0]?.count ?? 0) + 1).padStart(6, '0')}`
    const caseId = randomUUID()
    const assignmentId = randomUUID()
    const priority = (validatedData.severity ?? 'MEDIUM').toLowerCase()
    const hierarchyEntityId = validatedData.departmentId ?? guard.user.hierarchyEntityId ?? null

    await prisma.$executeRaw(Prisma.sql`
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
        ${caseId},
        ${caseNumber},
        ${validatedData.title},
        ${validatedData.description ?? null},
        ${validatedData.type},
        'open',
        ${priority},
        ${validatedData.province ?? null},
        ${validatedData.district ?? null},
        ${user.id},
        ${hierarchyEntityId},
        NOW(),
        NOW()
      )
    `)

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "CaseAssignment" (
        "id",
        "caseId",
        "officerId",
        "role",
        "assignedAt"
      ) VALUES (
        ${assignmentId},
        ${caseId},
        ${user.id},
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

    const [created] = await loadCases(Prisma.sql`WHERE "id" = ${caseId}`, 1, 0)

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
