import { workflowRepository } from '@/lib/repositories/workflow.repository'
import { prisma } from '@/lib/prisma'

export class ApprovalEngine {
  async requestApproval(
    transitionId: string,
    entityId: string,
    requestedBy: string,
    requestedByRole: string,
    requiredRoles: string[]
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
    
    if (comments) {
      await prisma.auditLog.create({
        data: {
          userId: approvedBy,
          action: 'WORKFLOW_APPROVAL',
          resourceType: 'WorkflowApproval',
          resourceId: approvalId,
          changes: { comments },
        },
      })
    }

    return approval
  }

  async reject(approvalId: string, approvedBy: string, reason: string) {
    const approval = await workflowRepository.rejectWorkflow(approvalId, approvedBy, reason)
    
    await prisma.auditLog.create({
      data: {
        userId: approvedBy,
        action: 'WORKFLOW_REJECTION',
        resourceType: 'WorkflowApproval',
        resourceId: approvalId,
        changes: { rejectionReason: reason },
      },
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
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const approvals = await prisma.workflowApproval.findMany({
      where: { requiredRole: role, createdAt: { gte: since } },
    })

    const pending = approvals.filter(a => a.status === 'PENDING').length
    const approved = approvals.filter(a => a.status === 'APPROVED').length
    const rejected = approvals.filter(a => a.status === 'REJECTED').length

    return { pending, approved, rejected, total: approvals.length }
  }
}
