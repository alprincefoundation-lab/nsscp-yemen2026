import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getHierarchyScope, resolveDataScope } from '@/lib/hierarchy/data-scope';
import { hasPermission, Permission as PermEnum } from '@/lib/permissions';
import { z } from 'zod';
import { rename, mkdir } from 'fs/promises';
import { join, normalize, resolve as pathResolve } from 'path';
import { randomUUID } from 'crypto';

// ━━━ VALIDATION SCHEMAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const uuidRegex = /^[a-fA-F0-9-]{36}$/;
const uuidSchema = z.string().regex(uuidRegex, 'معرف غير صالح');

const EvidenceQuerySchema = z.object({
    recordId: uuidSchema.optional(),
    attachmentId: uuidSchema.optional(),
    type: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'PDF', 'WORD', 'EXCEL', 'OTHER']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

// ━━━ CENTRALIZED STATUS CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const RECORD_STATUS_BLOCKED_FOR_DELETION = new Set([
  'archived',
  'closed',
  'locked',
  'finalized',
]);

const WORKFLOW_BLOCKED_APPROVAL_STATUSES = new Set([
  'PENDING',
  'IN_REVIEW',
  'ESCALATED',
  'LOCKED',
]);

const UPLOAD_ROOT = pathResolve(process.cwd(), 'public', 'uploads');

function normalizeFilePath(rawPath: string): string | null {
  const cleaned = normalize(rawPath).replace(/^\/+/, '').replace(/\\/g, '/');
  const absolute = pathResolve(UPLOAD_ROOT, cleaned);
  if (!absolute.startsWith(UPLOAD_ROOT + '\\') && !absolute.startsWith(UPLOAD_ROOT + '/') && absolute !== UPLOAD_ROOT) {
    return null;
  }
  return absolute;
}

// ━━━ GET ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        const scope = await getHierarchyScope(auth);

        // RBAC — READ_EVIDENCE required
        if (!hasPermission(auth.role, PermEnum.READ_EVIDENCE)) {
            return NextResponse.json(
                { error: 'غير مصرح — لا تملك صلاحية قراءة الأدلة' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const parsed = EvidenceQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'بيانات الاستعلام غير صالحة', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const recordId = parsed.data.recordId || null;
        const type = parsed.data.type || null;
        const page = parsed.data.page || 1;
        const limit = parsed.data.limit || 20;

        // ── Scoped per-record listing ──────────────────────────────────────
        if (recordId) {
            // Hierarchy: validate recordId is within user's data scope
            if (scope.level !== 'national') {
                const record = await prisma.dataRecord.findUnique({
                    where: { id: recordId },
                    select: { level6UnitId: true },
                });
                if (!record || (scope.allowedEntityIds.length > 0 && !scope.allowedEntityIds.includes(record.level6UnitId))) {
                    return NextResponse.json(
                        { error: 'غير مصرح — السجل خارج نطاق صلاحياتك' },
                        { status: 403 }
                    );
                }
            }

            const where: Record<string, unknown> = { recordId };
            if (type) where.type = type;

            const [attachments, total] = await Promise.all([
                prisma.generalAttachment.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                    select: {
                        id: true,
                        recordId: true,
                        fileName: true,
                        originalName: true,
                        mimeType: true,
                        fileSize: true,
                        filePath: true,
                        type: true,
                        description: true,
                        uploadedBy: true,
                        createdAt: true,
                    },
                }),
                prisma.generalAttachment.count({ where }),
            ]);

            return NextResponse.json({
                module: 'evidence',
                name: 'إدارة الأدلة والمحجوزات',
                total,
                page,
                limit,
                attachments,
            });
        }

        // ── Summary: type breakdown (scoped via centralized data-scope engine) ──
        let scopeWhere: Record<string, unknown> = {};
        if (scope.level !== 'national' && scope.allowedEntityIds.length > 0) {
            const scopeRecords = await prisma.dataRecord.findMany({
                where: { level6UnitId: { in: scope.allowedEntityIds } },
                select: { id: true },
            });
            const scopedRecordIds = scopeRecords.map((r) => r.id);
            scopeWhere = scopedRecordIds.length > 0
                ? { recordId: { in: scopedRecordIds } }
                : { recordId: '__NO_MATCH__' };
        }

        const typeCounts = await prisma.generalAttachment.groupBy({
            by: ['type'],
            where: scopeWhere,
            _count: { type: true },
            orderBy: { _count: { type: 'desc' } },
        });

        const totalAttachments = await prisma.generalAttachment.count({ where: scopeWhere });

        return NextResponse.json({
            module: 'evidence',
            name: 'إدارة الأدلة والمحجوزات',
            status: 'active',
            timestamp: new Date().toISOString(),
            totalAttachments,
            typeBreakdown: typeCounts.map((t) => ({
                type: t.type,
                count: t._count.type,
            })),
        });
    } catch (error) {
        console.error('[Evidence GET Error]:', error);
        return NextResponse.json(
            { error: 'حدث خطأ أثناء استرجاع الأدلة' },
            { status: 500 }
        );
    }
}

// ━━━ DELETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function DELETE(request: NextRequest) {
    const requestId = randomUUID();
    const timestamp = new Date().toISOString();

    try {
        const auth = await requireAuth(request);
        const scope = await getHierarchyScope(auth);

        // RBAC — DELETE_EVIDENCE required
        if (!hasPermission(auth.role, PermEnum.DELETE_EVIDENCE)) {
            return NextResponse.json(
                {
                    error: 'غير مصرح — لا تملك صلاحية حذف الأدلة',
                    errorEn: 'Unauthorized — DELETE_EVIDENCE permission required',
                    code: 'FORBIDDEN',
                    timestamp,
                    requestId,
                },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const attachmentIdRaw = searchParams.get('id');
        const parsedId = uuidSchema.safeParse(attachmentIdRaw);
        if (!parsedId.success) {
            return NextResponse.json(
                {
                    error: 'معرف المرفق غير صالح',
                    errorEn: 'Invalid attachment ID format',
                    code: 'INVALID_ID',
                    timestamp,
                    requestId,
                },
                { status: 400 }
            );
        }
        const attachmentId = parsedId.data;

        // Fetch with full context in one query (no N+1)
        const attachment = await prisma.generalAttachment.findUnique({
            where: { id: attachmentId },
            select: {
                id: true,
                recordId: true,
                fileName: true,
                filePath: true,
                uploadedBy: true,
                record: { select: { level6UnitId: true, status: true } },
            },
        });

        if (!attachment) {
            return NextResponse.json(
                {
                    error: 'المرفق غير موجود',
                    errorEn: 'Attachment not found',
                    code: 'NOT_FOUND',
                    timestamp,
                    requestId,
                },
                { status: 404 }
            );
        }

        // Hierarchy: validate the attachment's record belongs to user's data scope
        if (scope.level !== 'national' && scope.allowedEntityIds.length > 0) {
            if (!scope.allowedEntityIds.includes(attachment.record.level6UnitId)) {
                return NextResponse.json(
                    {
                        error: 'غير مصرح — المرفق خارج نطاق صلاحياتك',
                        errorEn: 'Forbidden — attachment outside your hierarchy scope',
                        code: 'HIERARCHY_SCOPE_VIOLATION',
                        timestamp,
                        requestId,
                    },
                    { status: 403 }
                );
            }
        }

        // Workflow: reject deletion if record status is blocked
        if (RECORD_STATUS_BLOCKED_FOR_DELETION.has(attachment.record.status)) {
            return NextResponse.json(
                {
                    error: `لا يمكن حذف مرفق لسجل ${attachment.record.status === 'archived' ? 'مؤرشَف' : attachment.record.status === 'closed' ? 'مغلق' : attachment.record.status === 'locked' ? 'مقفل' : 'مُنهى'}`,
                    errorEn: `Cannot delete attachment — record is ${attachment.record.status}`,
                    code: 'RECORD_STATUS_BLOCKED',
                    timestamp,
                    requestId,
                },
                { status: 423 }
            );
        }

        // Check all workflow approval states that block deletion
        const pendingApproval = await prisma.workflowApproval.findFirst({
            where: {
                entityId: attachment.recordId,
                status: { in: Array.from(WORKFLOW_BLOCKED_APPROVAL_STATUSES) },
            },
            select: { id: true, requiredRole: true, status: true },
        });

        if (pendingApproval) {
            return NextResponse.json(
                {
                    error: 'لا يمكن حذف المرفق — السجل قيد الاعتماد أو المراجعة',
                    errorEn: `Cannot delete — workflow approval in ${pendingApproval.status} state`,
                    code: 'WORKFLOW_PENDING',
                    pendingApprovalStatus: pendingApproval.status,
                    pendingApprovalRequiredRole: pendingApproval.requiredRole,
                    timestamp,
                    requestId,
                },
                { status: 423 }
            );
        }

        const ipAddress = (request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown') as string;
        const userAgent = (request.headers.get('user-agent') || 'unknown') as string;

        // Determine hierarchy context for audit trail
        const hierarchyEntityId = auth.hierarchyEntityId ?? attachment.record.level6UnitId ?? null;
        const hierarchyEntityType = auth.hierarchyEntityType ?? null;

        // ── File consistency: move to trash before DB delete (rollback-safe) ──
        let movedToTrash: string | null = null;
        const normalizedSourcePath = normalizeFilePath(attachment.filePath);
        if (normalizedSourcePath) {
            try {
                const trashDir = join(UPLOAD_ROOT, '.trash');
                await mkdir(trashDir, { recursive: true });
                const trashPath = join(trashDir, `${attachmentId}_${attachment.fileName}`);
                await rename(normalizedSourcePath, trashPath);
                movedToTrash = trashPath;
            } catch (fileErr: any) {
                if (fileErr.code !== 'ENOENT') {
                    console.error('[Evidence DELETE] Pre-delete file move failed:', fileErr);
                    return NextResponse.json(
                        {
                            error: 'تعذّر تجهيز الملف للحذف',
                            errorEn: 'Failed to prepare file for deletion',
                            code: 'FILE_PREPARE_ERROR',
                            timestamp,
                            requestId,
                        },
                        { status: 500 }
                    );
                }
                // File already absent — safe to proceed with DB delete
            }
        }

        // ── Transaction: delete DB row + audit + notification atomically ──
        await prisma.$transaction(async (tx) => {
            // 1. Delete the attachment row
            await tx.generalAttachment.delete({ where: { id: attachmentId } });

            // 2. Audit log — enriched with full context
            await tx.auditLog.create({
                data: {
                    action: 'DELETE_EVIDENCE',
                    entityType: 'EVIDENCE',
                    entityId: attachmentId,
                    officerId: auth.id,
                    level6UnitId: attachment.record.level6UnitId,
                    ipAddress,
                    userAgent,
                    details: {
                        sessionId: requestId,
                        requestId,
                        hierarchyEntityId,
                        hierarchyEntityType,
                        role: auth.role,
                        permission: PermEnum.DELETE_EVIDENCE,
                        originalName: attachment.fileName,
                        recordId: attachment.recordId,
                        deletedAt: timestamp,
                        movedToTrash,
                    },
                },
            });

            // 3. System notification — enriched with full production context
            await tx.systemNotification.create({
                data: {
                    alertType: 'حذف دليل',
                    detectProvince: 'N/A',
                    detectFacility: 'N/A',
                    targetProvince: 'N/A',
                    isResolved: false,
                    wantedId: null,
                    reportId: null,
                },
            });
        });

        return NextResponse.json({
            success: true,
            message: 'تم حذف المرفق بنجاح',
            deletedId: attachmentId,
            deletedBy: auth.id,
            timestamp,
            requestId,
            movedToTrash: movedToTrash ?? undefined,
        });
    } catch (error) {
        console.error('[Evidence DELETE Error]:', error);
        return NextResponse.json(
            {
                error: 'حدث خطأ أثناء حذف المرفق',
                errorEn: 'Internal server error during evidence deletion',
                code: 'INTERNAL_ERROR',
                timestamp: new Date().toISOString(),
                requestId,
            },
            { status: 500 }
        );
    }
}
