import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'لم يتم العثور على أي ملف للرفع' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = join(process.cwd(), 'public', 'uploads');
        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        // Generate a safe unique file name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const originalName = file.name;
        const extension = originalName.split('.').pop() || '';
        const safeName = `${uniqueSuffix}.${extension}`;
        const filePath = join(uploadDir, safeName);
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${safeName}`;

        return NextResponse.json({
            success: true,
            file: {
                name: originalName,
                url: fileUrl,
                type: file.type,
                size: file.size
            }
        });
    } catch (error) {
        console.error('File Upload Error:', error);
        return NextResponse.json({ error: 'حدث خطأ أثناء رفع الملف' }, { status: 500 });
    }
}
