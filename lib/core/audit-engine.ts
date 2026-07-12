/**
 * Audit Engine – NSSCP Central Audit Logging System
 * Replaces all direct prisma.auditLog.create calls with a unified engine.
 * Integrates with RBAC and Hierarchy for scoped audit trails.
 */
import { prisma } from '@/lib/prisma';

export type AuditAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'VIEW'
    | 'LOGIN'
    | 'LOGOUT'
    | 'EXPORT'
    | 'IMPORT'
    | 'ASSIGN'
    | 'TRANSFER'
    | 'APPROVE'
    | 'REJECT'
    | 'ARCHIVE'
    | 'CREATE_HIERARCHY_ENTITY'
    | 'UPDATE_HIERARCHY_ENTITY'
    | 'DELETE_HIERARCHY_ENTITY'
    | 'CREATE_ROLE'
    | 'UPDATE_ROLE'
    | 'DELETE_ROLE'
    | 'ASSIGN_PERMISSION'
    | 'REVOKE_PERMISSION'
    | string;

export type AuditEntityType =
    | 'USER'
    | 'ROLE'
    | 'PERMISSION'
    | 'HIERARCHY_ENTITY'
    | 'OFFICER'
    | 'CASE'
    | 'EVIDENCE'
    | 'REPORT'
    | 'INCIDENT'
    | 'VEHICLE'
    | 'WEAPON'
    | 'WANTED_PERSON'
    | 'CIRCULAR'
    | 'ARCHIVE_FOLDER'
    | 'ARCHIVE_DOCUMENT'
    | 'OPERATION'
    | 'PATROL'
    | 'PRISONER'
    | 'PRISON'
    | 'NOTIFICATION'
    | 'SETTINGS'
    | string;

export interface AuditEntryInput {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    userId?: string | null;
    officerId?: string | null;
    details?: Record<string, unknown> | string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    hierarchyEntityId?: string | null;
    hierarchyEntityType?: string | null;
}

/**
 * Centralized audit logging
 * Automatically resolves hierarchy context when possible.
 */
export async function createAuditLog(input: AuditEntryInput) {
    const details =
        typeof input.details === 'string'
            ? input.details
            : input.details
                ? JSON.stringify(input.details)
                : null;

    return prisma.auditLog.create({
        data: {
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            officerId: input.officerId || input.userId || null,
            details: (details || null) as any,
            ipAddress: input.ipAddress || null,
            userAgent: input.userAgent || null,
        },
    });
}

/**
 * Retrieve audit logs with filtering and pagination
 */
export async function getAuditLogs(params: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    hierarchyEntityId?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    pageSize?: number;
}) {
    const where: Record<string, unknown> = {};

    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;
    if (params.userId) where.officerId = params.userId;
    if (params.action) where.action = params.action;
    if (params.hierarchyEntityId) where.hierarchyEntityId = params.hierarchyEntityId;
    if (params.fromDate || params.toDate) {
        where.createdAt = {};
        if (params.fromDate) (where.createdAt as Record<string, unknown>).gte = params.fromDate;
        if (params.toDate) (where.createdAt as Record<string, unknown>).lte = params.toDate;
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where: where as any,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: {
                Officer: { select: { id: true, name: true, rank: true, role: true, department: true } },
            },
        }),
        prisma.auditLog.count({ where: where as any }),
    ]);

    const data = logs.map((log) => ({
        ...log,
        user: log.Officer
            ? {
                id: log.Officer.id,
                username: log.Officer.name,
                fullName: log.Officer.name,
                badgeNumber: log.Officer.id,
                rank: log.Officer.rank,
                role: log.Officer.role,
                department: log.Officer.department,
            }
            : null,
    }));

    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

/**
 * Helper to extract request metadata from a Next.js Request
 */
export function extractRequestMeta(request: Request): {
    ipAddress: string;
    userAgent: string;
} {
    return {
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown',
    };
}
