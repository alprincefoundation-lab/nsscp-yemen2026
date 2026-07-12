import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiGuard, withScope } from '@/lib/hierarchy/guard';
import { createAuditLog, extractRequestMeta } from '@/lib/core/audit-engine';

// GET: جلب قائمة المطلوبين (Hierarchy-scoped)
export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuard(request);
    if ('error' in guard) return guard.error;
    const { scope } = guard;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const where: Record<string, unknown> = withScope({}, scope);

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { identityNumber: { contains: search, mode: 'insensitive' } },
        { chargeDetails: { contains: search, mode: 'insensitive' } },
        { issuingProvince: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      prisma.wantedPerson.findMany({
        where: where as any,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.wantedPerson.count({ where: where as any }),
    ]);

    return NextResponse.json({
      data, total, page, pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: إضافة مطلوب جديد
export async function POST(request: NextRequest) {
  try {
    const guard = await apiGuard(request);
    if ('error' in guard) return guard.error;
    const { user, scope } = guard;
    const meta = extractRequestMeta(request);

    const body = await request.json();
    const { fullName, ...rest } = body;

    const newWanted = await prisma.wantedPerson.create({
      data: {
        ...rest,
        fullName: fullName || 'غير معروف',
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entityType: 'WANTED_PERSON',
      entityId: String(newWanted.id),
      userId: user.id,
      details: { fullName: newWanted.fullName },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(newWanted, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: تحديث بيانات مطلوب
export async function PUT(request: NextRequest) {
  try {
    const guard = await apiGuard(request);
    if ('error' in guard) return guard.error;
    const { user } = guard;
    const meta = extractRequestMeta(request);

    const body = await request.json();
    const { id, fullName, ...rest } = body;
    const wantedId = typeof id === 'string' ? parseInt(id, 10) : id;

    if (!wantedId || Number.isNaN(wantedId)) {
      return NextResponse.json({ error: 'المعرف الخاص بالمطلوب مطلوب' }, { status: 400 });
    }

    const updateData: any = { ...rest };
    if (fullName) updateData.fullName = fullName;

    const updated = await prisma.wantedPerson.update({
      where: { id: wantedId },
      data: updateData,
    });

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'WANTED_PERSON',
      entityId: String(updated.id),
      userId: user.id,
      details: { updatedFields: Object.keys(updateData) },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: حذف مطلوب من النظام
export async function DELETE(request: NextRequest) {
  try {
    const guard = await apiGuard(request);
    if ('error' in guard) return guard.error;
    const { user } = guard;
    const meta = extractRequestMeta(request);

    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id');
    let id = rawId ? parseInt(rawId, 10) : undefined;

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = typeof body.id === 'string' ? parseInt(body.id, 10) : body.id;
    }

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'المعرف مطلوب للحذف' }, { status: 400 });
    }

    // Fetch before delete for audit trail
    const existing = await prisma.wantedPerson.findUnique({ where: { id } });

    await prisma.wantedPerson.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE',
      entityType: 'WANTED_PERSON',
      entityId: String(id),
      userId: user.id,
      details: existing ? { fullName: existing.fullName } : { id },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
