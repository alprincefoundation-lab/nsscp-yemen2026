import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiGuard, withScope } from '@/lib/hierarchy/guard';
import { createAuditLog, extractRequestMeta } from '@/lib/core/audit-engine';

export async function GET(request: NextRequest) {
    try {
        const guard = await apiGuard(request);
        if ('error' in guard) return guard.error;
        const { scope } = guard;

        const where: Record<string, unknown> = withScope({}, scope);

        const reports = await prisma.incident.findMany({
            where: where as any,
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ success: true, reports });
    } catch (error) {
        console.error('Fetch Strategic Reports Error:', error);
        return NextResponse.json({ error: 'حدث خطأ أثناء جلب التقارير الاستراتيجية والختامية' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const guard = await apiGuard(request);
        if ('error' in guard) return guard.error;
        const { user } = guard;
        const meta = extractRequestMeta(request);

        const { title, summary, period, documents } = await request.json();

        if (!title || !summary || !period) {
            return NextResponse.json({ error: 'العنوان والملخص والفترة الزمنية حقول مطلوبة' }, { status: 400 });
        }

        const incidentNumber = `STR-${Date.now()}`;
        const report = await prisma.incident.create({
            data: {
                title,
                description: summary,
                type: 'OTHER',
                status: 'REPORTED',
                dateTime: new Date(),
                incidentNumber,
            },
        });

        await createAuditLog({
            action: 'CREATE',
            entityType: 'REPORT',
            entityId: report.id,
            userId: user.id,
            details: { title, period, incidentNumber },
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
        });

        return NextResponse.json({ success: true, report }, { status: 201 });
    } catch (error) {
        console.error('Create Strategic Report Error:', error);
        return NextResponse.json({ error: 'حدث خطأ أثناء إضافة التقرير الاستراتيجي' }, { status: 500 });
    }
}