/**
 * Cases [id] API Route — Workflow-Integrated CRUD
 * GET → Fetch case details (hierarchy-scoped)
 * PATCH → Update case; status changes route through executeTransition()
 * DELETE → Delete with full audit trail
 * All handlers protected by apiGuard (JWT + Hierarchy scope).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiGuard, withScope } from '@/lib/hierarchy/guard';
import { createAuditLog, extractRequestMeta } from '@/lib/core/audit-engine';
import { executeTransition } from '@/lib/core/workflow-engine';

// ─── GET: Fetch single case (hierarchy-scoped) ───────────────────────
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const guard = await apiGuard(request);
        if ('error' in guard) return guard.error;

        const { id } = await params;
        const caseItem = await prisma.case.findUnique({
            where: { id },
            include: {
                department: {
                    select: { id: true, nameAr: true, code: true }
                },
                assignedTo: {
                    select: { id: true, fullName: true, militaryId: true, rank: true }
                },
                evidence: {
                    orderBy: { createdAt: 'desc' }
                },
            }
        });

        if (!caseItem) {
            return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: caseItem });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch case' },
            { status: 500 }
        );
    }
}

// ─── PATCH: Update case (status via executeTransition) ───────────────
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const guard = await apiGuard(request);
        if ('error' in guard) return guard.error;
        const { user } = guard;
        const meta = extractRequestMeta(request);

        const { id } = await params;
        const body = await request.json();

        const existing = await prisma.case.findUnique({
            where: { id },
            select: { id: true, status: true, caseNumber: true, title: true, departmentId: true },
        });
        if (!existing) {
            return NextResponse.json({ error: 'القضية غير موجودة' }, { status: 404 });
        }

        // ── Workflow: Status transition via executeTransition ─────────
        if (body.status && body.status !== existing.status) {
            const actionMap: Record<string, string> = {
                CLOSED: 'CLOSE', ARCHIVED: 'ARCHIVE',
                UNDER_INVESTIGATION: 'SUBMIT', PENDING_REVIEW: 'APPROVE',
            };
            const result = await executeTransition({
                entityType: 'CASE',
                entityId: id,
                action: (actionMap[body.status] || 'APPROVE') as any,
                fromStatus: existing.status,
                toStatus: body.status,
                userId: user.id,
                comment: body.transitionComment || undefined,
                hierarchyEntityId: existing.departmentId || undefined,
                hierarchyEntityType: 'CASE',
            });

            if (!result.success) {
                return NextResponse.json({ error: result.message }, { status: 400 });
            }
        }

        // ── Update other fields ───────────────────────────────────────
        const updateData: Record<string, unknown> = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.type !== undefined) updateData.type = body.type;
        if (body.severity !== undefined) updateData.severity = body.severity;
        if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId || null;
        if (body.departmentId !== undefined) updateData.departmentId = body.departmentId || null;

        if (Object.keys(updateData).length > 0) {
            await prisma.case.update({ where: { id }, data: updateData });

            await createAuditLog({
                action: body.assignedToId && body.assignedToId !== existing.departmentId ? 'ASSIGN' : 'UPDATE',
                entityType: 'CASE',
                entityId: id,
                userId: user.id,
                details: { updatedFields: Object.keys(updateData), title: existing.title },
                ipAddress: meta.ipAddress,
                userAgent: meta.userAgent,
                hierarchyEntityId: existing.departmentId || undefined,
            });
        }

        // Return updated case
        const updated = await prisma.case.findUnique({
            where: { id },
            include: {
                department: { select: { id: true, nameAr: true } },
                assignedTo: { select: { id: true, fullName: true, militaryId: true, rank: true } },
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'خطأ في تحديث القضية' }, { status: 500 });
    }
}

// ─── DELETE: Delete case with audit trail ────────────────────────────
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const guard = await apiGuard(request);
        if ('error' in guard) return guard.error;
        const { user } = guard;
        const meta = extractRequestMeta(request);

        const { id } = await params;

        const existing = await prisma.case.findUnique({
            where: { id },
            select: { id: true, caseNumber: true, title: true, status: true, departmentId: true },
        });
        if (!existing) {
            return NextResponse.json({ error: 'القضية غير موجودة' }, { status: 404 });
        }

        await prisma.case.delete({ where: { id } });

        await createAuditLog({
            action: 'DELETE',
            entityType: 'CASE',
            entityId: id,
            userId: user.id,
            details: { caseNumber: existing.caseNumber, title: existing.title, status: existing.status },
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
                hierarchyEntityId: existing.departmentId || undefined,
            });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'خطأ في حذف القضية' }, { status: 500 });
    }
}