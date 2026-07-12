/**
 * Workflow Transitions Service
 * Manages workflow state transitions with approval, audit, and notifications
 */

import { createAuditLog } from '@/lib/core/audit-engine'
import { workflowRepository } from '@/lib/repositories/workflow.repository'
import {
  WorkflowType,
  WorkflowState,
  TransitionContext,
  TransitionResult,
  workflowStateMachine,
} from './state-machine'

export interface WorkflowTransitionLog {
  id: string
  entityId: string
  workflowType: string
  previousState: string
  newState: string
  userId: string
  userRole: string
  userDepartment: string
  reason?: string | null
  requiresApproval: boolean
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | string | null
  approvedBy?: string | null
  approvalTimestamp?: Date | null
  timestamp: Date
  metadata?: Record<string, unknown> | null
}

export interface WorkflowApproval {
  id: string
  workflowTransitionId: string
  entityId: string
  requestedBy: string
  requestedByRole: string
  requiredRole: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedBy?: string | null
  approvalDate?: Date | null
  rejectionReason?: string | null
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
    reason?: string,
  ): Promise<{
    success: boolean
    transition?: TransitionResult
    approval?: WorkflowApproval
    error?: string
  }> {
    try {
      const isValid = workflowStateMachine.canTransition(
        context.workflowType,
        context.currentState,
        context.targetState,
        context,
      )

      if (!isValid) {
        return {
          success: false,
          error: `Cannot transition from ${context.currentState} to ${context.targetState}`,
        }
      }

      const transition = await workflowStateMachine.transitionTo(context)

      if (!transition.success) {
        return {
          success: false,
          error: transition.message,
        }
      }

      await workflowRepository.createTransitionLog({
        id: transition.transitionId,
        entityId: context.entityId,
        workflowType: context.workflowType,
        previousState: transition.previousState,
        newState: transition.newState,
        userId: context.userId,
        userRole: context.userRole,
        userDepartment: context.userDepartment,
        reason: reason ?? null,
        requiresApproval: transition.approvalRequired,
        approvalStatus: transition.approvalRequired ? 'PENDING' : 'APPROVED',
        approvalTimestamp: transition.approvalRequired ? null : transition.timestamp,
        timestamp: transition.timestamp,
        metadata: context.metadata ?? null,
      })

      await createAuditLog({
        action: 'WORKFLOW_TRANSITION',
        entityType: 'WORKFLOW',
        entityId: context.entityId,
        userId: context.userId,
        details: {
          from: transition.previousState,
          to: transition.newState,
          workflowType: context.workflowType,
          requiresApproval: transition.approvalRequired,
        },
      })

      if (transition.approvalRequired && transition.approvalRole) {
        const approval = await this.createApprovalRequest({
          workflowTransitionId: transition.transitionId,
          entityId: context.entityId,
          requestedBy: context.userId,
          requestedByRole: context.userRole,
          requiredRole: transition.approvalRole,
          reason,
        })

        return {
          success: true,
          transition,
          approval,
        }
      }

      return {
        success: true,
        transition,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
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
    const approval = await workflowRepository.createApproval({
      workflowTransitionId: data.workflowTransitionId,
      entityId: data.entityId,
      requestedBy: data.requestedBy,
      requestedByRole: data.requestedByRole,
      requiredRole: data.requiredRole,
      status: 'PENDING',
      reason: data.reason ?? null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    return approval
  }

  /**
   * Approve transition
   */
  async approveTransition(
    approvalId: string,
    approvedBy: string,
    comment?: string,
  ): Promise<{
    success: boolean
    approval?: WorkflowApproval
    error?: string
  }> {
    try {
      const approvalRow = await workflowRepository.getApprovalById(approvalId)

      if (!approvalRow) {
        return {
          success: false,
          error: 'Approval request not found',
        }
      }

      if (approvalRow.status !== 'PENDING') {
        return {
          success: false,
          error: `Approval already ${approvalRow.status.toLowerCase()}`,
        }
      }

      if (new Date() > approvalRow.expiresAt) {
        return {
          success: false,
          error: 'Approval request has expired',
        }
      }

      const updated = await workflowRepository.approveWorkflow(approvalId, approvedBy)
      await workflowRepository.updateTransitionLogApproval(approvalRow.workflowTransitionId, {
        approvalStatus: 'APPROVED',
        approvedBy,
        approvalTimestamp: new Date(),
      })

      await createAuditLog({
        action: 'WORKFLOW_APPROVAL',
        entityType: 'WORKFLOW',
        entityId: approvalId,
        userId: approvedBy,
        details: {
          status: 'APPROVED',
          comment: comment ?? null,
        },
      })

      return {
        success: true,
        approval: updated,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Reject transition
   */
  async rejectTransition(
    approvalId: string,
    rejectedBy: string,
    reason: string,
  ): Promise<{
    success: boolean
    approval?: WorkflowApproval
    error?: string
  }> {
    try {
      const approvalRow = await workflowRepository.getApprovalById(approvalId)

      if (!approvalRow) {
        return {
          success: false,
          error: 'Approval request not found',
        }
      }

      if (approvalRow.status !== 'PENDING') {
        return {
          success: false,
          error: `Approval already ${approvalRow.status.toLowerCase()}`,
        }
      }

      const updated = await workflowRepository.rejectWorkflow(approvalId, rejectedBy, reason)
      await workflowRepository.updateTransitionLogApproval(approvalRow.workflowTransitionId, {
        approvalStatus: 'REJECTED',
        approvedBy: rejectedBy,
        approvalTimestamp: new Date(),
      })

      await createAuditLog({
        action: 'WORKFLOW_REJECTION',
        entityType: 'WORKFLOW',
        entityId: approvalId,
        userId: rejectedBy,
        details: {
          status: 'REJECTED',
          reason,
        },
      })

      return {
        success: true,
        approval: updated,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get transition history
   */
  async getTransitionHistory(
    entityId: string,
    limit: number = 50,
  ): Promise<WorkflowTransitionLog[]> {
    return workflowRepository.getTransitionHistory(entityId, limit)
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(
    requiredRole: string,
    limit: number = 20,
  ): Promise<WorkflowApproval[]> {
    return workflowRepository.getPendingApprovals(requiredRole, limit)
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(entityId: string): Promise<{
    currentState: string | null
    workflowType: string | null
    lastTransition?: WorkflowTransitionLog
    pendingApprovals?: WorkflowApproval[]
  }> {
    const logs = await workflowRepository.getTransitionHistory(entityId, 1)
    const lastLog = logs[0]

    const pendingApprovals = lastLog
      ? (await workflowRepository.getApprovalsByEntity(entityId)).filter(
          (approval) => approval.workflowTransitionId === lastLog.id && approval.status === 'PENDING',
        )
      : []

    return {
      currentState: lastLog?.newState || null,
      workflowType: lastLog?.workflowType || null,
      lastTransition: lastLog,
      pendingApprovals,
    }
  }

  /**
   * Get available transitions
   */
  getAvailableTransitions(workflowType: WorkflowType, currentState: WorkflowState) {
    return workflowStateMachine.getNextStates(workflowType, currentState)
  }
}

export const workflowTransitionsService = new WorkflowTransitionsService()
