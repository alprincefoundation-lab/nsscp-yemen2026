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

        const reports = await prisma.report.findMany({
            where: where as any,
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({
            success: true,
            reports: reports.map((report) => ({
                ...report,
                governorate: report.department,
            })),
        });
    } catch (error) {
        console.error('Fetch Operations Reports Error:', error);
        return NextResponse.json({ error: 'حدث خطأ أثناء جلب بلاغات العمليات الأمنية المشتركة' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const guard = await apiGuard(request);
        if ('error' in guard) return guard.error;
        const { user } = guard;
        const meta = extractRequestMeta(request);

        const { title, description, governorate, attachments } = await request.json();

        if (!title || !description || !governorate) {
            return NextResponse.json({ error: 'العنوان والتفاصيل والمحافظة المصدرة حقول مطلوبة' }, { status: 400 });
        }

        const incidentNumber = `OPR-${Date.now()}`;
        const report = await prisma.report.create({
            data: {
                id: incidentNumber,
                title,
                description,
                status: 'REPORTED',
                priority: 'NORMAL',
                department: governorate,
            },
        });

        await createAuditLog({
            action: 'CREATE',
            entityType: 'REPORT',
            entityId: report.id,
            userId: user.id,
            details: { title, governorate, incidentNumber },
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
        });

        return NextResponse.json({
            success: true,
            report: {
                ...report,
                governorate,
                incidentNumber,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Create Operations Report Error:', error);
        return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل بلاغ العمليات الفوري' }, { status: 500 });
    }
}
