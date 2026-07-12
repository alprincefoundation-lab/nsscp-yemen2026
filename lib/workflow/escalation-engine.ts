import { workflowRepository } from '@/lib/repositories/workflow.repository'
import { createAuditLog } from '@/lib/core/audit-engine'

export class EscalationEngine {
  async escalate(
    entityId: string,
    workflowType: string,
    currentState: string,
    reason: string,
    escalatedTo?: string
  ) {
    return workflowRepository.createEscalation({
      entityId,
      workflowType,
      currentState,
      escalationLevel: 1,
      escalatedTo,
      escalationReason: reason,
      escalationTime: new Date(),
      resolved: false,
    })
  }

  async escalateOnRejection(entityId: string, reason: string) {
    // Log rejection escalation
    const logs = await workflowRepository.getTransitionHistory(entityId, 1)
    if (logs.length === 0) return

    const log = logs[0]
    return this.escalate(entityId, log.workflowType, log.newState, `Rejected: ${reason}`)
  }

  async escalateOnSLAViolation(
    entityId: string,
    workflowType: string,
    currentState: string
  ) {
    return this.escalate(
      entityId,
      workflowType,
      currentState,
      'SLA Violation - Processing exceeded deadline'
    )
  }

  async getActiveEscalations(workflowType: string) {
    return workflowRepository.getActiveEscalations(workflowType)
  }

  async resolveEscalation(escalationId: string) {
    const escalation = await workflowRepository.resolveEscalation(escalationId)

    await createAuditLog({
      action: 'WORKFLOW_ESCALATION_RESOLVED',
      entityType: 'PRISON',
      entityId: escalationId,
      userId: 'SYSTEM',
      details: { resolved: true },
    })

    return escalation
  }

  async escalationStats(workflowType: string) {
    const escalations = await workflowRepository.getActiveEscalations(workflowType)
    const byLevel: Record<number, number> = {}
    for (const escalation of escalations) {
      byLevel[escalation.escalationLevel] = (byLevel[escalation.escalationLevel] || 0) + 1
    }

    const average =
      escalations.length > 0
        ? escalations.reduce((sum, escalation) => sum + escalation.escalationLevel, 0) / escalations.length
        : 0

    return {
      total: escalations.length,
      byLevel,
      average,
    }
  }
}
