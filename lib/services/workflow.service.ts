import { workflowRepository } from '@/lib/repositories/workflow.repository'
import { ApprovalEngine } from '@/lib/workflow/approval-engine'
import { EscalationEngine } from '@/lib/workflow/escalation-engine'
import { SLAEngine } from '@/lib/workflow/sla-engine'
import { AutomationEngine } from '@/lib/workflow/automation-engine'
import { canTransition } from '@/lib/rules/workflow.rules'

export const workflowService = {
  approvals: new ApprovalEngine(),
  escalations: new EscalationEngine(),
  sla: new SLAEngine(),
  automation: new AutomationEngine(),

  async transitionEntity(
    entityId: string,
    workflowType: string,
    fromState: string,
    toState: string,
    userId: string,
    userRole: string,
    department: string,
    reason?: string
  ) {
    // Validate transition is allowed
    const allowed = canTransition(workflowType, fromState, toState)
    if (!allowed) {
      throw new Error(`Cannot transition from ${fromState} to ${toState}`)
    }

    // Check if approval is required
    const transition = await workflowRepository.getTransitionByStates(fromState, toState)
    if (transition?.requiresApproval) {
      // Create approval request
      const approval = await workflowRepository.createApproval({
        workflowTransitionId: transition.id,
        entityId,
        requestedBy: userId,
        requestedByRole: userRole,
        requiredRole: transition.approvalRole,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        reason,
      })
      return { status: 'PENDING_APPROVAL', approvalId: approval.id }
    }

    // Execute transition immediately
    await workflowRepository.createTransitionLog({
      entityId,
      workflowType,
      previousState: fromState,
      newState: toState,
      userId,
      userRole,
      userDepartment: department,
      reason,
      requiresApproval: false,
      metadata: { timestamp: new Date() },
    })

    return { status: 'TRANSITIONED', newState: toState }
  },

  async approveTransition(approvalId: string, approvedBy: string) {
    const approval = await workflowRepository.approveWorkflow(approvalId, approvedBy)
    
    // Auto-transition after approval
    await this.automation.executePostApprovalActions(approval.entityId, approval.workflowTransitionId)

    return approval
  },

  async rejectTransition(approvalId: string, approvedBy: string, reason: string) {
    const approval = await workflowRepository.rejectWorkflow(approvalId, approvedBy, reason)
    
    // Trigger escalation on rejection
    await this.escalations.escalateOnRejection(approval.entityId, reason)

    return approval
  },

  async getPendingApprovals(userRole: string) {
    return workflowRepository.getPendingApprovals(userRole)
  },

  async getWorkflowHistory(entityId: string) {
    return workflowRepository.getTransitionHistory(entityId)
  },

  async checkSLAViolations(workflowType: string) {
    return this.sla.checkViolations(workflowType)
  },

  async getWorkflowStats(workflowType: string, days?: number) {
    return workflowRepository.getWorkflowStats(workflowType, days)
  },

  async initializeWorkflow(entityId: string, workflowType: string, initiatedBy: string) {
    const states = await workflowRepository.getWorkflowStates(workflowType)
    if (states.length === 0) {
      throw new Error(`No workflow states defined for ${workflowType}`)
    }

    const initialState = states.find(s => s.orderSequence === 1)
    if (!initialState) {
      throw new Error(`No initial state found for ${workflowType}`)
    }

    await workflowRepository.createTransitionLog({
      entityId,
      workflowType,
      previousState: 'INITIATED',
      newState: initialState.stateName,
      userId: initiatedBy,
      userRole: 'SYSTEM',
      userDepartment: 'SYSTEM',
      reason: 'Workflow initialized',
      requiresApproval: false,
      metadata: { initialized: true },
    })

    return initialState
  },
}
