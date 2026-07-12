/**
 * API endpoints for Dynamic Records (السجلات الديناميكية)
 * Uses DynamicRecord model with hierarchy context
 */
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type DynamicRecordRow = {
  id: string
  formId: string
  data: unknown
  createdById: string | null
  createdAt: Date
  updatedAt: Date
}

type DynamicFormRow = {
  id: string
  name: string
  code: string | null
  hierarchyEntityId: string
}

type DynamicFileRow = {
  id: string
  originalName: string
  mimeType: string
  fileSize: number
  path: string
}

type CreatedByRow = {
  id: string
  username: string | null
  fullName: string | null
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

function sqlJson(value: unknown): string {
  return `'${escapeSqlLiteral(JSON.stringify(value))}'::jsonb`
}

async function getRecordById(id: string) {
  const records = await prisma.$queryRawUnsafe<DynamicRecordRow[]>(`
    SELECT
      "id",
      "formId",
      "data",
      "createdById",
      "createdAt",
      "updatedAt"
    FROM "DynamicRecord"
    WHERE "id" = ${sqlValue(id)}
    LIMIT 1
  `)

  const record = records[0] ?? null
  if (!record) {
    return null
  }

  const [forms, creators, attachments] = await Promise.all([
    prisma.$queryRawUnsafe<DynamicFormRow[]>(`
      SELECT
        "id",
        "name",
        "code",
        "hierarchyEntityId"
      FROM "DynamicForm"
      WHERE "id" = ${sqlValue(record.formId)}
      LIMIT 1
    `),
    record.createdById
      ? prisma.$queryRawUnsafe<CreatedByRow[]>(`
          SELECT
            "id",
            "username",
            "fullName"
          FROM "User"
          WHERE "id" = ${sqlValue(record.createdById)}
          LIMIT 1
        `)
      : Promise.resolve([] as CreatedByRow[]),
    prisma.$queryRawUnsafe<DynamicFileRow[]>(`
      SELECT
        "id",
        "originalName",
        "mimeType",
        "fileSize",
        "path"
      FROM "DynamicFile"
      WHERE "recordId" = ${sqlValue(record.id)}
      ORDER BY "createdAt" DESC
    `),
  ])

  const form = forms[0] ?? null
  const createdBy = creators[0] ?? null

  return {
    ...record,
    form,
    createdBy,
    attachments,
  }
}

// GET /api/hierarchy/records?formId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')
    const id = searchParams.get('id')

    if (!formId && !id) {
      return NextResponse.json(
        { error: 'formId or id parameter is required' },
        { status: 400 }
      )
    }

    if (id) {
      const record = await getRecordById(id)

      if (!record) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 })
      }

      return NextResponse.json(record)
    }

    const records = await prisma.$queryRawUnsafe<DynamicRecordRow[]>(`
      SELECT
        "id",
        "formId",
        "data",
        "createdById",
        "createdAt",
        "updatedAt"
      FROM "DynamicRecord"
      WHERE "formId" = ${sqlValue(formId)}
        AND COALESCE("data"->>'_deleted', 'false') <> 'true'
      ORDER BY "createdAt" DESC
      LIMIT 50
    `)

    const shapedRecords = await Promise.all(records.map((record) => getRecordById(record.id)))
    return NextResponse.json(shapedRecords.filter(Boolean))
  } catch (error) {
    console.error('Error fetching records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    )
  }
}

// POST /api/hierarchy/records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formId, data, createdById } = body

    if (!formId || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: formId, data' },
        { status: 400 }
      )
    }

    const recordId = randomUUID()
    const now = new Date().toISOString()

    await prisma.$executeRawUnsafe(`
      INSERT INTO "DynamicRecord" (
        "id",
        "formId",
        "data",
        "createdById",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${sqlValue(recordId)},
        ${sqlValue(formId)},
        ${sqlJson(data)},
        ${sqlValue(createdById || null)},
        ${sqlValue(now)},
        ${sqlValue(now)}
      )
    `)

    const record = await getRecordById(recordId)

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating record:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}

// PUT /api/hierarchy/records?id=xxx
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const body = await request.json()
    const { data } = body

    if (data === undefined) {
      return NextResponse.json({ error: 'data required' }, { status: 400 })
    }

    await prisma.$executeRawUnsafe(`
      UPDATE "DynamicRecord"
      SET "data" = ${sqlJson(data)},
          "updatedAt" = NOW()
      WHERE "id" = ${sqlValue(id)}
    `)

    const record = await getRecordById(id)
    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating record:', error)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}

// DELETE /api/hierarchy/records?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const existing = await getRecordById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    const existingData = (existing.data as Record<string, unknown>) || {}
    await prisma.$executeRawUnsafe(`
      UPDATE "DynamicRecord"
      SET "data" = ${sqlJson({ ...existingData, _deleted: true })},
          "updatedAt" = NOW()
      WHERE "id" = ${sqlValue(id)}
    `)

    return NextResponse.json({ message: 'Record archived successfully' })
  } catch (error) {
    console.error('Error deleting record:', error)
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}
