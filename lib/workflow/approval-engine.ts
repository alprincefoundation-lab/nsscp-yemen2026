import { createAuditLog } from '@/lib/core/audit-engine'
import { prisma } from '@/lib/prisma'
import { workflowRepository } from '@/lib/repositories/workflow.repository'

export class ApprovalEngine {
  async requestApproval(
    transitionId: string,
    entityId: string,
    requestedBy: string,
    requestedByRole: string,
    requiredRoles: string[],
  ) {
    const approvals = []

    for (const role of requiredRoles) {
      const approval = await workflowRepository.createApproval({
        workflowTransitionId: transitionId,
        entityId,
        requestedBy,
        requestedByRole,
        requiredRole: role,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      approvals.push(approval)
    }

    return approvals
  }

  async getApprovalsForRole(role: string, limit = 50) {
    return workflowRepository.getPendingApprovals(role, limit)
  }

  async approve(approvalId: string, approvedBy: string, comments?: string) {
    const approval = await workflowRepository.approveWorkflow(approvalId, approvedBy)

    await createAuditLog({
      action: 'APPROVE',
      entityType: 'WORKFLOW_APPROVAL',
      entityId: approvalId,
      userId: approvedBy,
      details: comments ? { comments } : null,
    })

    return approval
  }

  async reject(approvalId: string, approvedBy: string, reason: string) {
    const approval = await workflowRepository.rejectWorkflow(approvalId, approvedBy, reason)

    await createAuditLog({
      action: 'REJECT',
      entityType: 'WORKFLOW_APPROVAL',
      entityId: approvalId,
      userId: approvedBy,
      details: { rejectionReason: reason },
    })

    return approval
  }

  async getAllApprovalsByEntity(entityId: string) {
    return workflowRepository.getApprovalsByEntity(entityId)
  }

  async isApprovalExpired(approvalId: string): Promise<boolean> {
    const approval = await prisma.workflowApproval.findUnique({ where: { id: approvalId } })
    if (!approval) return false
    return new Date() > approval.expiresAt
  }

  async getApprovalStats(role: string, days = 30) {
    return workflowRepository.getApprovalStats(role, days)
  }
}
