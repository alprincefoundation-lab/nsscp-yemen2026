import { createAuditLog } from '@/lib/core/audit-engine'
import { workflowRepository } from '@/lib/repositories/workflow.repository'

type AutomationRule = (...args: [entityId: string, approvalOrContext: unknown]) => Promise<void> | void

export class AutomationEngine {
  private automationRules: Map<string, AutomationRule> = new Map()

  registerRule(workflowType: string, fromState: string, toState: string, action: AutomationRule) {
    const key = `${workflowType}:${fromState}:${toState}`
    this.automationRules.set(key, action)
  }

  async executePostApprovalActions(entityId: string, transitionId: string) {
    const approvals = await workflowRepository.getApprovalsByEntity(entityId)
    const approval = approvals.find((item) => item.workflowTransitionId === transitionId)
    const transitionHistory = await workflowRepository.getTransitionHistory(entityId, 1)
    const workflowType = transitionHistory[0]?.workflowType || 'UNKNOWN'

    if (!approval) {
      await workflowRepository.recordAutomationHistory({
        entityId,
        workflowType,
        ruleKey: 'post-approval',
        actionName: 'SKIPPED',
        status: 'SKIPPED',
        details: { transitionId, reason: 'approval not found' },
      })
      return
    }

    const key = `${approval.requiredRole}:auto`
    const action = this.automationRules.get(key)

    try {
      if (action) {
        await action(entityId, approval)
      }

      await workflowRepository.recordAutomationHistory({
        entityId,
        workflowType,
        ruleKey: key,
        actionName: action ? 'EXECUTED' : 'NO_OP',
        status: 'COMPLETED',
        details: { transitionId, approvalId: approval.id, executed: Boolean(action) },
      })
    } catch (error) {
      await workflowRepository.recordAutomationHistory({
        entityId,
        workflowType,
        ruleKey: key,
        actionName: 'FAILED',
        status: 'FAILED',
        details: {
          transitionId,
          approvalId: approval.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      console.error('[v0] Automation action failed:', error)
    }
  }

  async setupComplaintWorkflowAutomation() {
    this.registerRule('COMPLAINT', 'SUBMITTED', 'ASSIGNED', async (entityId: string) => {
      await createAuditLog({
        action: 'COMPLAINT_ASSIGNED',
        entityType: 'REPORT',
        entityId,
        userId: 'SYSTEM',
        details: { automated: true },
      })
    })

    this.registerRule('COMPLAINT', 'INVESTIGATION_COMPLETE', 'REVIEW', async (entityId: string) => {
      await createAuditLog({
        action: 'COMPLAINT_REVIEW_REQUIRED',
        entityType: 'REPORT',
        entityId,
        userId: 'SYSTEM',
        details: { automated: true },
      })
    })
  }

  async setupInvestigationWorkflowAutomation() {
    this.registerRule('INVESTIGATION', 'CLOSED', 'ARCHIVED', async (entityId: string) => {
      await createAuditLog({
        action: 'INVESTIGATION_ARCHIVED',
        entityType: 'REPORT',
        entityId,
        userId: 'SYSTEM',
        details: { automated: true },
      })
    })
  }

  async executeScheduledAutomations() {
    return
  }

  async setupAllWorkflowAutomations() {
    await this.setupComplaintWorkflowAutomation()
    await this.setupInvestigationWorkflowAutomation()
  }
}
