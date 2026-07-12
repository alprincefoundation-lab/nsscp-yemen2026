import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiGuard, withScope } from '@/lib/hierarchy/guard'

export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuard(request);
    if ('error' in guard) return guard.error;
    const { scope } = guard;

    const where: Record<string, unknown> = withScope({}, scope);

    const reports = await prisma.report.findMany({
      where: where as any,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        department: true,
        priority: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json({
      success: true,
      reports: reports.map((report) => ({
        ...report,
        incidentNumber: report.id,
        type: report.priority,
        location: report.department,
        dateTime: report.createdAt,
        hierarchyEntityId: null,
      })),
    })
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

    const reportId = `RPT-${Date.now()}`
    const report = await prisma.report.create({
      data: {
        id: reportId,
        title: body.title,
        description: body.description || '',
        status: 'active',
        priority: body.priority || 'NORMAL',
        department: body.department || '',
      },
    })

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        incidentNumber: reportId,
        type: report.priority,
        location: report.department,
        dateTime: report.createdAt,
        hierarchyEntityId: null,
      },
    })
  } catch (error) {
    console.error('Create Report Error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة البلاغ' }, { status: 500 })
  }
}
