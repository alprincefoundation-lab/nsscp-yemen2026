export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { canAccessRecord } from '@/lib/api-utils/record-guard'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

// POST /api/attachments — Upload file attachment linked to DataRecord
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const recordId = formData.get('recordId') as string
    const type = (formData.get('type') as string) || 'OTHER'
    const description = (formData.get('description') as string) || ''

    if (!file || !recordId) {
      return NextResponse.json({ error: 'file and recordId are required' }, { status: 400 })
    }

    // RBAC check
    const hasAccess = await canAccessRecord(auth.id, recordId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this record' }, { status: 403 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
    const filePath = `/uploads/${fileName}`
    const fullPath = join(UPLOAD_DIR, fileName)

    // Write file to disk (async)
    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(fullPath, buffer)

    const attachment = await prisma.generalAttachment.create({
      data: {
        recordId,
        fileName,
        originalName: file.name,
        mimeType: file.type,
        fileSize: buffer.length,
        filePath,
        type,
        description: description || null,
        uploadedBy: auth.id,
        updatedAt: new Date(),
      },
    })

    // Audit
    await prisma.auditLog.create({
      data: {
        action: 'UPLOAD_ATTACHMENT',
        entityType: 'GeneralAttachment',
        entityId: attachment.id,
        officerId: auth.id,
        details: { recordId, fileName, size: buffer.length, type },
        dataRecordId: recordId,
      },
    })

    return NextResponse.json({ success: true, data: attachment }, { status: 201 })
  } catch (error: any) {
    console.error('[attachments] POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// GET /api/attachments — List attachments for a record
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get('recordId')

    if (!recordId) {
      return NextResponse.json({ error: 'recordId is required' }, { status: 400 })
    }

    const hasAccess = await canAccessRecord(auth.id, recordId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const attachments = await prisma.generalAttachment.findMany({
      where: { recordId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: attachments })
  } catch (error: any) {
    console.error('[attachments] GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
