export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canAccessRecord } from '@/lib/api-utils/record-guard'
import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// POST /api/attachments — Upload file attachment linked to DataRecord
export async function POST(request: NextRequest) {
  try {
    const officerId = request.headers.get('x-officer-id')
    if (!officerId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const recordId = formData.get('recordId') as string
    const type = (formData.get('type') as string) || 'OTHER'
    const description = (formData.get('description') as string) || ''

    if (!file || !recordId) {
      return NextResponse.json({ error: 'file and recordId are required' }, { status: 400 })
    }

    // RBAC check
    const hasAccess = await canAccessRecord(officerId, recordId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this record' }, { status: 403 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
    const filePath = `/uploads/${fileName}`
    const fullPath = path.join(UPLOAD_DIR, fileName)

    // Write file to disk
    fs.writeFileSync(fullPath, buffer)

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
        uploadedBy: officerId,
        updatedAt: new Date(),
      },
    })

    // Audit
    await prisma.auditLog.create({
      data: {
        action: 'UPLOAD_ATTACHMENT',
        entityType: 'GeneralAttachment',
        entityId: attachment.id,
        officerId,
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
    const officerId = request.headers.get('x-officer-id')
    if (!officerId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get('recordId')

    if (!recordId) {
      return NextResponse.json({ error: 'recordId is required' }, { status: 400 })
    }

    const hasAccess = await canAccessRecord(officerId, recordId)
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