import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ━━━ SECURE UPLOAD WHITELISTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
]);

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp',
  'pdf',
  'doc', 'docx',
  'xls', 'xlsx',
  'txt', 'csv',
  'mp3', 'wav', 'ogg',
  'mp4', 'mpeg', 'mov',
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'لم يتم العثور على أي ملف للرفع' }, { status: 400 });
        }

        const originalName = file.name;
        const extension = (originalName.split('.').pop() || '').toLowerCase();

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: `نوع الملف غير مسموح به: ${file.type}` },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: 'حجم الملف يتجاوز الحد المسموح به (50 ميجابايت)' },
                { status: 400 }
            );
        }

        // Validate extension
        if (!ALLOWED_EXTENSIONS.has(extension)) {
            return NextResponse.json(
                { error: `امتداد الملف غير مسموح به: .${extension}` },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = join(process.cwd(), 'public', 'uploads');
        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        // Generate a safe unique file name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const safeName = `${uniqueSuffix}.${extension}`;
        const filePath = join(uploadDir, safeName);
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${safeName}`;

        // PostgreSQL persistence — optional, requires association with a DataRecord
        const recordId = formData.get('recordId') as string | null;
        const attachmentType = (formData.get('attachmentType') as string) || 'OTHER';
        const description = formData.get('description') as string | null;
        let dbAttachment: { id: string; recordId: string } | null = null;

        if (recordId) {
            dbAttachment = await prisma.generalAttachment.create({
                data: {
                    recordId,
                    fileName: safeName,
                    originalName,
                    mimeType: file.type,
                    fileSize: file.size,
                    filePath,
                    type: attachmentType,
                    description,
                    uploadedBy: user.id,
                },
                select: { id: true, recordId: true },
            });
        }

        return NextResponse.json({
            success: true,
            file: {
                name: originalName,
                url: fileUrl,
                type: file.type,
                size: file.size,
                uploadedBy: user.id,
                ...(dbAttachment ? { attachmentId: dbAttachment.id, recordId: dbAttachment.recordId } : {}),
            }
        });
    } catch (error) {
        console.error('File Upload Error:', error);
        return NextResponse.json({ error: 'حدث خطأ أثناء رفع الملف' }, { status: 500 });
    }
}
