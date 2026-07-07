import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiGuard, withScope } from '@/lib/hierarchy/guard'

// جلب البلاغات عبر نموذج Incident (بلاغات الحوادث)
export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuard(request);
    if ('error' in guard) return guard.error;
    const { scope } = guard;

    const where: Record<string, unknown> = withScope({}, scope);

    const reports = await prisma.incident.findMany({
      where: where as any,
      select: {
        id: true,
        incidentNumber: true,
        title: true,
        description: true,
        type: true,
        status: true,
        location: true,
        dateTime: true,
        createdAt: true,
        hierarchyEntityId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json({ success: true, reports })
  } catch (error) {
    console.error('Fetch Reports Error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البلاغات' }, { status: 500 })
  }
}

// إضافة بلاغ جديد
export async function POST(request: NextRequest) {
  try {
    const guard = await apiGuard(request);
    if ('error' in guard) return guard.error;

    const body = await request.json()

    if (!body.title) {
      return NextResponse.json({ error: 'عنوان البلاغ مطلوب' }, { status: 400 })
    }

    const report = await prisma.incident.create({
      data: {
        title: body.title,
        description: body.description || '',
        type: 'OTHER',
        status: 'REPORTED',
        dateTime: new Date(),
        location: body.department || null,
        incidentNumber: `RPT-${Date.now()}`,
      },
    })

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('Create Report Error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة البلاغ' }, { status: 500 })
  }
}