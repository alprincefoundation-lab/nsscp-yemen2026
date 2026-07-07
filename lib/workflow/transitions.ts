/**
 * Workflow Transitions Service
 * Manages workflow state transitions with approval, audit, and notifications
 */

import { prisma } from '@/lib/prisma'
import {
  WorkflowType,
  WorkflowState,
  TransitionContext,
  TransitionResult,
  workflowStateMachine
} from './state-machine'

export interface WorkflowTransitionLog {
  id: string
  entityId: string
  workflowType: WorkflowType
  previousState: WorkflowState
  newState: WorkflowState
  userId: string
  userRole: string
  userDepartment: string
  reason?: string
  requiresApproval: boolean
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedBy?: string
  approvalTimestamp?: Date
  timestamp: Date
  metadata?: Record<string, any>
}

export interface WorkflowApproval {
  id: string
  workflowTransitionId: string
  entityId: string
  requestedBy: string
  requestedByRole: string
  requiredRole: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedBy?: string
  approvalDate?: Date
  rejectionReason?: string
  createdAt: Date
  expiresAt: Date
}

/**
 * Workflow Transitions Service
 */
export class WorkflowTransitionsService {
  /**
   * Request state transition with potential approval
   */
  async requestTransition(
    context: TransitionContext,
    reason?: string
  ): Promise<{
    success: boolean
    transition?: TransitionResult
    approval?: WorkflowApproval
    error?: string
  }> {
    try {
      // Validate transition
      const isValid = workflowStateMachine.canTransition(
        context.workflowType,
        context.currentState,
        context.targetState,
        context
      )

      if (!isValid) {
        return {
          success: false,
          error: `Cannot transition from ${context.currentState} to ${context.targetState}`
        }
      }

      // Perform transition
      const transition = await workflowStateMachine.transitionTo(context)

      if (!transition.success) {
        return {
          success: false,
          error: transition.message
        }
      }

      // Log transition
      const transitionLog = await this.logTransition({
        id: transition.transitionId,
        entityId: context.entityId,
        workflowType: context.workflowType,
        previousState: transition.previousState,
        newState: transition.newState,
        userId: context.userId,
        userRole: context.userRole,
        userDepartment: context.userDepartment,
        reason,
        requiresApproval: transition.approvalRequired,
        timestamp: transition.timestamp,
        metadata: context.metadata
      })

      // If approval required, create approval request
      if (transition.approvalRequired && transition.approvalRole) {
        const approval = await this.createApprovalRequest({
          workflowTransitionId: transition.transitionId,
          entityId: context.entityId,
          requestedBy: context.userId,
          requestedByRole: context.userRole,
          requiredRole: transition.approvalRole,
          reason
        })

        return {
          success: true,
          transition,
          approval
        }
      }

      return {
        success: true,
        transition
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Log workflow transition
   */
  private async logTransition(log: WorkflowTransitionLog): Promise<void> {
    try {
      await prisma.workflowTransitionLog.create({
        data: {
          id: log.id,
          entityId: log.entityId,
          workflowType: log.workflowType,
          previousState: log.previousState,
          newState: log.newState,
          userId: log.userId,
          userRole: log.userRole,
          userDepartment: log.userDepartment,
          reason: log.reason,
          requiresApproval: log.requiresApproval,
          timestamp: log.timestamp,
          metadata: log.metadata
        }
      } as any)

      // Also log to audit trail
      await prisma.auditLog.create({
        data: {
          action: 'WORKFLOW_TRANSITION',
          resourceType: 'WORKFLOW',
          resourceId: log.entityId,
          userId: log.userId,
          userRole: log.userRole,
          changes: {
            from: log.previousState,
            to: log.newState,
            workflowType: log.workflowType
          },
          ipAddress: '',
          userAgent: '',
          timestamp: log.timestamp,
          isDeleted: false
        }
      })
    } catch (error) {
      console.error('Error logging transition:', error)
    }
  }

  /**
   * Create approval request
   */
  private async createApprovalRequest(data: {
    workflowTransitionId: string
    entityId: string
    requestedBy: string
    requestedByRole: string
    requiredRole: string
    reason?: string
  }): Promise<WorkflowApproval> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7-day expiration

    const approval = await prisma.workflowApproval.create({
      data: {
        workflowTransitionId: data.workflowTransitionId,
        entityId: data.entityId,
        requestedBy: data.requestedBy,
        requestedByRole: data.requestedByRole,
        requiredRole: data.requiredRole,
        status: 'PENDING',
        createdAt: new Date(),
        expiresAt,
        reason: data.reason
      }
    } as any)

    return approval as any
  }

  /**
   * Approve transition
   */
  async approveTransition(
    approvalId: string,
    approvedBy: string,
    comment?: string
  ): Promise<{
    success: boolean
    approval?: WorkflowApproval
    error?: string
  }> {
    try {
      const approval = await prisma.workflowApproval.findUnique({
        where: { id: approvalId }
      } as any)

      if (!approval) {
        return {
          success: false,
          error: 'Approval request not found'
        }
      }

      if (approval.status !== 'PENDING') {
        return {
          success: false,
          error: `Approval already ${approval.status.toLowerCase()}`
        }
      }

      if (new Date() > approval.expiresAt) {
        return {
          success: false,
          error: 'Approval request has expired'
        }
      }

      const updated = await prisma.workflowApproval.update({
        where: { id: approvalId },
        data: {
          status: 'APPROVED',
          approvedBy,
          approvalDate: new Date()
        }
      } as any)

      // Log approval
      await prisma.auditLog.create({
        data: {
          action: 'WORKFLOW_APPROVAL',
          resourceType: 'WORKFLOW_APPROVAL',
          resourceId: approvalId,
          userId: approvedBy,
          userRole: '',
          changes: {
            status: 'APPROVED',
            comment
          },
          ipAddress: '',
          userAgent: '',
          timestamp: new Date(),
          isDeleted: false
        }
      })

      return {
        success: true,
        approval: updated as any
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Reject transition
   */
  async rejectTransition(
    approvalId: string,
    rejectedBy: string,
    reason: string
  ): Promise<{
    success: boolean
    approval?: WorkflowApproval
    error?: string
  }> {
    try {
      const approval = await prisma.workflowApproval.findUnique({
        where: { id: approvalId }
      } as any)

      if (!approval) {
        return {
          success: false,
          error: 'Approval request not found'
        }
      }

      if (approval.status !== 'PENDING') {
        return {
          success: false,
          error: `Approval already ${approval.status.toLowerCase()}`
        }
      }

      const updated = await prisma.workflowApproval.update({
        where: { id: approvalId },
        data: {
          status: 'REJECTED',
          approvedBy: rejectedBy,
          approvalDate: new Date(),
          rejectionReason: reason
        }
      } as any)

      // Log rejection
      await prisma.auditLog.create({
        data: {
          action: 'WORKFLOW_REJECTION',
          resourceType: 'WORKFLOW_APPROVAL',
          resourceId: approvalId,
          userId: rejectedBy,
          userRole: '',
          changes: {
            status: 'REJECTED',
            reason
          },
          ipAddress: '',
          userAgent: '',
          timestamp: new Date(),
          isDeleted: false
        }
      })

      return {
        success: true,
        approval: updated as any
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get transition history
   */
  async getTransitionHistory(
    entityId: string,
    limit: number = 50
  ): Promise<WorkflowTransitionLog[]> {
    const logs = await prisma.workflowTransitionLog.findMany({
      where: { entityId },
      orderBy: { timestamp: 'desc' },
      take: limit
    } as any)

    return logs as any
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(
    requiredRole: string,
    limit: number = 20
  ): Promise<WorkflowApproval[]> {
    const approvals = await prisma.workflowApproval.findMany({
      where: {
        requiredRole,
        status: 'PENDING',
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    } as any)

    return approvals as any
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(entityId: string): Promise<{
    currentState: WorkflowState | null
    workflowType: WorkflowType | null
    lastTransition?: WorkflowTransitionLog
    pendingApprovals?: WorkflowApproval[]
  }> {
    const lastLog = await prisma.workflowTransitionLog.findFirst({
      where: { entityId },
      orderBy: { timestamp: 'desc' }
    } as any)

    const pendingApprovals = lastLog
      ? await prisma.workflowApproval.findMany({
        where: {
          workflowTransitionId: lastLog.id,
          status: 'PENDING'
        }
      } as any)
      : []

    return {
      currentState: lastLog?.newState || null,
      workflowType: lastLog?.workflowType || null,
      lastTransition: lastLog as any,
      pendingApprovals: pendingApprovals as any
    }
  }

  /**
   * Get available transitions
   */
  getAvailableTransitions(
    workflowType: WorkflowType,
    currentState: WorkflowState
  ) {
    return workflowStateMachine.getNextStates(workflowType, currentState)
  }
}

// Export singleton instance
export const workflowTransitionsService = new WorkflowTransitionsService()
