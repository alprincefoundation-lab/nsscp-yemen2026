import { workflowRepository } from '@/lib/repositories/workflow.repository'
import { prisma } from '@/lib/prisma'
import { EscalationEngine } from './escalation-engine'

export class SLAEngine {
  private escalationEngine = new EscalationEngine()

  async checkViolations(workflowType: string) {
    const states = await workflowRepository.getWorkflowStates(workflowType)
    const violations = []

    for (const state of states) {
      const logs = await prisma.workflowTransitionLog.findMany({
        where: { workflowType, newState: state.stateName },
        orderBy: { timestamp: 'desc' },
      })

      for (const log of logs) {
        // Find transition for SLA info
        const transitions = await workflowRepository.getTransitions(state.id)
        
        for (const transition of transitions) {
          if (transition.sla) {
            const hoursSince = (Date.now() - log.timestamp.getTime()) / (1000 * 60 * 60)
            
            if (hoursSince > transition.sla) {
              // Check if escalation already created
              const existing = await prisma.workflowEscalation.findFirst({
                where: {
                  entityId: log.entityId,
                  workflowType,
                  resolved: false,
                  escalationReason: { contains: 'SLA' },
                },
              })

              if (!existing) {
                const escalation = await this.escalationEngine.escalateOnSLAViolation(
                  log.entityId,
                  workflowType,
                  state.stateName
                )
                violations.push(escalation)
              }
            }
          }
        }
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
    }
  }

  async setSLA(workflowType: string, fromState: string, toState: string, slaHours: number) {
    // Implementation depends on how transitions are fetched
    // This would update the transition with SLA value
    return { status: 'SLA_SET', slaHours }
  }
}
