import { workflowRepository } from '@/lib/repositories/workflow.repository'
import { prisma } from '@/lib/prisma'

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

    await prisma.auditLog.create({
      data: {
        userId: 'SYSTEM',
        action: 'WORKFLOW_ESCALATION_RESOLVED',
        resourceType: 'WorkflowEscalation',
        resourceId: escalationId,
      },
    })

    return escalation
  }

  async escalationStats(workflowType: string) {
    const escalations = await workflowRepository.getActiveEscalations(workflowType)
    const byLevel = escalations.reduce((acc: any, e: any) => {
      acc[e.escalationLevel] = (acc[e.escalationLevel] || 0) + 1
      return acc
    }, {})

    return {
      total: escalations.length,
      byLevel,
      average: escalations.length > 0
        ? escalations.reduce((sum: number, e: any) => sum + e.escalationLevel, 0) / escalations.length
        : 0,
    }
  }
}
