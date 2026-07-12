import { prisma } from '@/lib/prisma'
import { workflowRepository } from '@/lib/repositories/workflow.repository'
import { EscalationEngine } from './escalation-engine'

export class SLAEngine {
  private escalationEngine = new EscalationEngine()

  async checkViolations(workflowType: string) {
    const rules = await workflowRepository.getSlaRules(workflowType)
    const logs = await prisma.workflowTransitionLog.findMany({
      where: { workflowType },
      orderBy: { timestamp: 'desc' },
    })
    const activeEscalations = await workflowRepository.getActiveEscalations(workflowType)
    const violations = []

    for (const rule of rules) {
      for (const log of logs) {
        if (log.previousState !== rule.fromState || log.newState !== rule.toState) {
          continue
        }

        const hoursSince = (Date.now() - log.timestamp.getTime()) / (1000 * 60 * 60)
        if (hoursSince <= rule.slaHours) {
          continue
        }

        const existing = activeEscalations.find(
          (item) =>
            item.entityId === log.entityId &&
            item.currentState === log.newState &&
            item.escalationReason?.includes('SLA'),
        )

        if (existing) {
          continue
        }

        const escalation = await this.escalationEngine.escalateOnSLAViolation(
          log.entityId,
          workflowType,
          log.newState,
        )
        violations.push(escalation)
      }
    }

    return violations
  }

  async getSLAMetrics(workflowType: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const logs = await prisma.workflowTransitionLog.findMany({
      where: { workflowType, timestamp: { gte: since } },
      orderBy: { timestamp: 'asc' },
    })

    const violations = await this.checkViolations(workflowType)

    return {
      totalTransitions: logs.length,
      slaViolations: violations.length,
      slaCompliance: logs.length > 0 ? ((logs.length - violations.length) / logs.length) * 100 : 100,
      averageProcessingTimeHours: logs.length > 1
        ? (logs[logs.length - 1].timestamp.getTime() - logs[0].timestamp.getTime()) / (logs.length * 60 * 60 * 1000)
        : 0,
      days,
    }
  }

  async setSLA(workflowType: string, fromState: string, toState: string, slaHours: number) {
    await workflowRepository.upsertSlaRule({
      id: `${workflowType}:${fromState}:${toState}`,
      workflowType,
      fromState,
      toState,
      slaHours,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return { status: 'SLA_SET', slaHours }
  }
}
