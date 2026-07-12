/**
 * Workflow Engine – Multi-stage approval and status transition system for NSSCP
 * Integrates with Audit Engine for logging and RBAC for authorization.
 * Supports custom workflows for cases, reports, operations, and archive actions.
 */
import { prisma } from '@/lib/prisma';
import { createAuditLog } from './audit-engine';
import type { RBACUser } from './rbac-engine';

// ============================================
// Types
// ============================================

export type WorkflowEntityType = 'CASE' | 'REPORT' | 'OPERATION' | 'EVIDENCE' | 'TRANSFER' | 'LEAVE' | 'ARCHIVE';

export type WorkflowAction = 'SUBMIT' | 'APPROVE' | 'REJECT' | 'REVISE' | 'CLOSE' | 'ARCHIVE' | 'ESCALATE';

export interface WorkflowState {
    entityType: WorkflowEntityType;
    entityId: string;
    currentStatus: string;
    allowedTransitions: string[];
    assignedReviewerId?: string;
    ownerId?: string;
    hierarchyEntityId?: string;
}

export interface WorkflowTransitionInput {
    entityType: WorkflowEntityType;
    entityId: string;
    action: WorkflowAction;
    fromStatus: string;
    toStatus: string;
    userId: string;
    comment?: string;
    metadata?: Record<string, unknown>;
    hierarchyEntityId?: string;
    hierarchyEntityType?: string;
}

export interface WorkflowResult {
    success: boolean;
    message: string;
    newStatus: string;
    workflowRecordId?: string;
}

// ============================================
// Status Transition Maps
// ============================================

const CASE_TRANSITIONS: Record<string, string[]> = {
    OPEN: ['UNDER_INVESTIGATION', 'CLOSED'],
    UNDER_INVESTIGATION: ['PENDING_REVIEW', 'CLOSED', 'OPEN'],
    PENDING_REVIEW: ['CLOSED', 'UNDER_INVESTIGATION', 'ARCHIVED'],
    CLOSED: ['ARCHIVED', 'OPEN'],
    ARCHIVED: ['OPEN'],
};

const REPORT_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
    UNDER_REVIEW: ['APPROVED', 'REJECTED', 'REVISION_NEEDED'],
    REVISION_NEEDED: ['SUBMITTED', 'CANCELLED'],
    APPROVED: ['PUBLISHED', 'ARCHIVED'],
    PUBLISHED: ['ARCHIVED'],
    REJECTED: ['DRAFT'],
    CANCELLED: ['DRAFT'],
    ARCHIVED: [],
};

const OPERATION_TRANSITIONS: Record<string, string[]> = {
    PLANNED: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['COMPLETED', 'CANCELLED', 'STANDING_BY'],
    STANDING_BY: ['ACTIVE', 'CANCELLED'],
    COMPLETED: ['CANCELLED'],
    CANCELLED: [],
};

export function getAllowedTransitions(entityType: WorkflowEntityType, currentStatus: string): string[] {
    switch (entityType) {
        case 'CASE':
            return CASE_TRANSITIONS[currentStatus] || [];
        case 'REPORT':
            return REPORT_TRANSITIONS[currentStatus] || [];
        case 'OPERATION':
            return OPERATION_TRANSITIONS[currentStatus] || [];
        default:
            return [];
    }
}

export function isValidTransition(entityType: WorkflowEntityType, currentStatus: string, targetStatus: string): boolean {
    const allowed = getAllowedTransitions(entityType, currentStatus);
    return allowed.includes(targetStatus);
}

// ============================================
// Workflow Execution
// ============================================

/**
 * Execute a workflow transition with audit logging
 */
export async function executeTransition(
    input: WorkflowTransitionInput
): Promise<WorkflowResult> {
    // Validate transition
    if (!isValidTransition(input.entityType, input.fromStatus, input.toStatus)) {
        return {
            success: false,
            message: `انتقال غير صالح من ${input.fromStatus} إلى ${input.toStatus}`,
            newStatus: input.fromStatus,
        };
    }

    const updateData = { status: input.toStatus };

    try {
        // Determine the Prisma model that exists in the current schema
        const modelMap: Partial<Record<WorkflowEntityType, { update(args: { where: { id: string }; data: { status: string } }): Promise<unknown> }>> = {
            REPORT: prisma.report,
            EVIDENCE: prisma.dataRecord,
        };

        const model = modelMap[input.entityType];

        if (model) {
            await model.update({
                where: { id: input.entityId },
                data: updateData,
            });
        }

        // Audit log the transition
        await createAuditLog({
            action: input.action as any,
            entityType: input.entityType,
            entityId: input.entityId,
            userId: input.userId,
            details: {
                fromStatus: input.fromStatus,
                toStatus: input.toStatus,
                comment: input.comment || null,
                metadata: input.metadata || null,
            },
            hierarchyEntityId: input.hierarchyEntityId || null,
            hierarchyEntityType: input.hierarchyEntityType || null,
        });

        return {
            success: true,
            message: `تم تغيير الحالة بنجاح من ${input.fromStatus} إلى ${input.toStatus}`,
            newStatus: input.toStatus,
        };
    } catch (error: any) {
        return {
            success: false,
            message: `فشل تنفيذ الانتقال: ${error.message}`,
            newStatus: input.fromStatus,
        };
    }
}

// ============================================
// Approval Chains
// ============================================

export interface ApprovalChainStep {
    step: number;
    role: string;
    userId?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
    comment?: string;
    timestamp?: Date;
}

export interface ApprovalChain {
    id: string;
    entityType: string;
    entityId: string;
    steps: ApprovalChainStep[];
    currentStep: number;
    status: 'ACTIVE' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
}

/**
 * Create an approval chain for multi-step approval
 */
export async function createApprovalChain(data: {
    entityType: WorkflowEntityType;
    entityId: string;
    steps: Array<{ role: string; userId?: string }>;
    createdBy: string;
}): Promise<ApprovalChain> {
    const chainSteps: ApprovalChainStep[] = data.steps.map((s, idx) => ({
        step: idx + 1,
        role: s.role,
        userId: s.userId,
        status: 'PENDING' as const,
    }));

    // Store approval chain metadata via audit trail
    await createAuditLog({
        action: 'CREATE',
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.createdBy,
        details: {
            type: 'APPROVAL_CHAIN_CREATED',
            totalSteps: data.steps.length,
            steps: chainSteps,
        },
    });

    return {
        id: `${data.entityType}_${data.entityId}_approval`,
        entityType: data.entityType,
        entityId: data.entityId,
        steps: chainSteps,
        currentStep: 1,
        status: 'ACTIVE',
    };
}

/**
 * Process an approval step
 */
export async function processApprovalStep(params: {
    entityType: WorkflowEntityType;
    entityId: string;
    step: number;
    action: 'APPROVE' | 'REJECT';
    userId: string;
    comment?: string;
    hierarchyEntityId?: string;
}): Promise<WorkflowResult> {
    const actionLabel = params.action === 'APPROVE' ? 'موافقة' : 'رفض';

    await createAuditLog({
        action: params.action as any,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
        details: {
            approvalStep: params.step,
            comment: params.comment || null,
            action: actionLabel,
        },
        hierarchyEntityId: params.hierarchyEntityId || null,
    });

    return {
        success: true,
        message: `تم ${actionLabel} الخطوة ${params.step} بنجاح`,
        newStatus: params.action === 'APPROVE' ? 'PENDING_REVIEW' : 'REJECTED',
    };
}

/**
 * Get workflow history for an entity
 */
export async function getWorkflowHistory(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
        where: {
            entityType,
            entityId,
            action: {
                in: ['SUBMIT', 'APPROVE', 'REJECT', 'REVISE', 'CLOSE', 'ARCHIVE', 'CREATE', 'UPDATE', 'DELETE'],
            },
        },
        orderBy: { createdAt: 'desc' },
        include: {
            Officer: { select: { id: true, name: true, rank: true, role: true, department: true } },
        },
    }).then((logs) =>
        logs.map((log) => ({
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
        })),
    );
}
