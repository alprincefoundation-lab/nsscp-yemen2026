/**
 * Cases [id] API Route - legacy Case table compatibility layer.
 */
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiGuard } from '@/lib/hierarchy/guard'
import { extractRequestMeta } from '@/lib/core/audit-engine'

export const dynamic = 'force-dynamic'

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

async function findCaseById(id: string): Promise<LegacyCaseRow | null> {
  const rows = await prisma.$queryRawUnsafe<LegacyCaseRow[]>(`
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
    WHERE "id" = ${sqlValue(id)}
    LIMIT 1
  `)

  return rows[0] ?? null
}

async function replaceAssignment(caseId: string, officerId: string | null) {
  if (!officerId) {
    return
  }

  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(`
    SELECT "id"
    FROM "CaseAssignment"
    WHERE "caseId" = ${sqlValue(caseId)}
    ORDER BY "assignedAt" DESC
    LIMIT 1
  `)

  if (existing[0]?.id) {
    await prisma.$executeRawUnsafe(`
      UPDATE "CaseAssignment"
      SET "officerId" = ${sqlValue(officerId)},
          "role" = 'investigator',
          "assignedAt" = NOW()
      WHERE "id" = ${sqlValue(existing[0].id)}
    `)
    return
  }

  await prisma.$executeRawUnsafe(`
    INSERT INTO "CaseAssignment" (
      "id",
      "caseId",
      "officerId",
      "role",
      "assignedAt"
    ) VALUES (
      ${sqlValue(randomUUID())},
      ${sqlValue(caseId)},
      ${sqlValue(officerId)},
      'investigator',
      NOW()
    )
  `)
}

// GET: Fetch single case
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await apiGuard(request)
    if ('error' in guard) return guard.error

    const { id } = await params
    const caseItem = await findCaseById(id)

    if (!caseItem) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: caseItem })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch case' },
      { status: 500 }
    )
  }
}

// PATCH: Update case
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await apiGuard(request)
    if ('error' in guard) return guard.error

    const { user } = guard
    const meta = extractRequestMeta(request)
    const { id } = await params
    const body = await request.json()

    const existing = await findCaseById(id)
    if (!existing) {
      return NextResponse.json({ error: 'القضية غير موجودة' }, { status: 404 })
    }

    const updateParts: string[] = ['"updatedAt" = NOW()']
    const updatedFields: string[] = []

    if (body.title !== undefined) {
      updateParts.push(`"title" = ${sqlValue(body.title)}`)
      updatedFields.push('title')
    }

    if (body.description !== undefined) {
      updateParts.push(`"description" = ${sqlValue(body.description)}`)
      updatedFields.push('description')
    }

    if (body.type !== undefined) {
      updateParts.push(`"caseType" = ${sqlValue(body.type)}`)
      updatedFields.push('caseType')
    }

    if (body.severity !== undefined) {
      updateParts.push(`"priority" = ${sqlValue(String(body.severity).toLowerCase())}`)
      updatedFields.push('priority')
    }

    if (body.departmentId !== undefined) {
      updateParts.push(`"hierarchyEntityId" = ${sqlValue(body.departmentId || null)}`)
      updatedFields.push('hierarchyEntityId')
    }

    if (body.assignedToId !== undefined) {
      updateParts.push(`"assignedOfficerId" = ${sqlValue(body.assignedToId || null)}`)
      updatedFields.push('assignedOfficerId')
    }

    if (body.province !== undefined) {
      updateParts.push(`"governorateId" = ${sqlValue(body.province || null)}`)
      updatedFields.push('governorateId')
    }

    if (body.district !== undefined) {
      updateParts.push(`"districtId" = ${sqlValue(body.district || null)}`)
      updatedFields.push('districtId')
    }

    if (body.status !== undefined) {
      updateParts.push(`"status" = ${sqlValue(body.status)}`)
      updatedFields.push('status')
    }

    if (updateParts.length > 1) {
      await prisma.$executeRawUnsafe(`
        UPDATE "Case"
        SET ${updateParts.join(', ')}
        WHERE "id" = ${sqlValue(id)}
      `)
    }

    if (body.assignedToId !== undefined) {
      await replaceAssignment(id, body.assignedToId || null)
    }

    await prisma.auditLog.create({
      data: {
        officerId: user.id,
        action: 'UPDATE',
        entityType: 'Case',
        entityId: id,
        details: {
          updatedFields,
          title: existing.title,
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    })

    const updated = await findCaseById(id)

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'خطأ في تحديث القضية' },
      { status: 500 }
    )
  }
}

// DELETE: Soft delete case
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await apiGuard(request)
    if ('error' in guard) return guard.error

    const { user } = guard
    const meta = extractRequestMeta(request)
    const { id } = await params

    const existing = await findCaseById(id)
    if (!existing) {
      return NextResponse.json({ error: 'القضية غير موجودة' }, { status: 404 })
    }

    await prisma.$executeRawUnsafe(`
      UPDATE "Case"
      SET "status" = 'archived', "updatedAt" = NOW()
      WHERE "id" = ${sqlValue(id)}
    `)

    await prisma.auditLog.create({
      data: {
        officerId: user.id,
        action: 'DELETE',
        entityType: 'Case',
        entityId: id,
        details: {
          caseNumber: existing.caseNumber,
          title: existing.title,
          status: existing.status,
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'خطأ في حذف القضية' },
      { status: 500 }
    )
  }
}
