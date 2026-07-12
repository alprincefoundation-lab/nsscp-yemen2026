export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDataRecordWhereClause } from '@/lib/api-utils/record-guard'

// GET /api/records — List DataRecords scoped to officer
export async function GET(request: NextRequest) {
  try {
    const officerId = request.headers.get('x-officer-id')
    if (!officerId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const recordType = searchParams.get('recordType')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const scopeWhere = await getDataRecordWhereClause(officerId)
    const where: any = { ...scopeWhere }
    if (recordType) where.recordType = recordType
    if (status) where.status = status

    const [records, total] = await Promise.all([
      prisma.dataRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          Level6Unit: { select: { id: true, name: true, code: true } },
          AuditLog: { take: 1, orderBy: { createdAt: 'desc' }, select: { action: true, createdAt: true } },
        },
      }),
      prisma.dataRecord.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    console.error('[records] GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// POST /api/records — Create new DataRecord
export async function POST(request: NextRequest) {
  try {
    const officerId = request.headers.get('x-officer-id')
    if (!officerId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const body = await request.json()
    const { level6UnitId, recordType, data, securityLevel } = body

    if (!level6UnitId || !recordType || !data) {
      return NextResponse.json({ error: 'level6UnitId, recordType, and data are required' }, { status: 400 })
    }

    const record = await prisma.dataRecord.create({
      data: {
        id: `DR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        level6UnitId,
        recordType,
        data,
        securityLevel: securityLevel || 'internal',
        status: 'active',
        updatedAt: new Date(),
      },
      include: {
        Level6Unit: { select: { id: true, name: true, code: true } },
      },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_RECORD',
        entityType: 'DataRecord',
        entityId: record.id,
        officerId,
        level6UnitId,
        details: { recordType, summary: typeof data === 'object' ? JSON.stringify(data).slice(0, 200) : String(data).slice(0, 200) },
      },
    })

    return NextResponse.json({ success: true, data: record }, { status: 201 })
  } catch (error: any) {
    console.error('[records] POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// PUT /api/records — Update DataRecord
export async function PUT(request: NextRequest) {
  try {
    const officerId = request.headers.get('x-officer-id')
    if (!officerId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const body = await request.json()
    const { id, data, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Record id is required' }, { status: 400 })
    }

    const record = await prisma.dataRecord.update({
      where: { id },
      data: {
        ...(data && { data }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_RECORD',
        entityType: 'DataRecord',
        entityId: id,
        officerId,
        details: { status },
      },
    })

    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    console.error('[records] PUT error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}