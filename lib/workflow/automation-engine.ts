import { workflowRepository } from '@/lib/repositories/workflow.repository'
import { prisma } from '@/lib/prisma'

export class AutomationEngine {
  private automationRules: Map<string, any> = new Map()

  registerRule(workflowType: string, fromState: string, toState: string, action: Function) {
    const key = `${workflowType}:${fromState}:${toState}`
    this.automationRules.set(key, action)
  }

  async executePostApprovalActions(entityId: string, transitionId: string) {
    // Find the approval that triggered this
    const approval = await prisma.workflowApproval.findFirst({
      where: { workflowTransitionId: transitionId },
    })

    if (!approval) return

    // Execute registered automation rules
    const key = `${approval.requiredRole}:auto`
    const action = this.automationRules.get(key)
    
    if (action) {
      try {
        await action(entityId, approval)
      } catch (error) {
        console.error('[v0] Automation action failed:', error)
      }
    }
  }

  async setupComplaintWorkflowAutomation() {
    this.registerRule('COMPLAINT', 'SUBMITTED', 'ASSIGNED', async (entityId: string) => {
      // Notify assigned investigator
      await prisma.auditLog.create({
        data: {
          userId: 'SYSTEM',
          action: 'COMPLAINT_ASSIGNED',
          resourceType: 'Complaint',
          resourceId: entityId,
          changes: { automated: true },
        },
      })
    })

    this.registerRule('COMPLAINT', 'INVESTIGATION_COMPLETE', 'REVIEW', async (entityId: string) => {
      // Create review task
      await prisma.auditLog.create({
        data: {
          userId: 'SYSTEM',
          action: 'COMPLAINT_REVIEW_REQUIRED',
          resourceType: 'Complaint',
          resourceId: entityId,
          changes: { automated: true },
        },
      })
    })
  }

  async setupInvestigationWorkflowAutomation() {
    this.registerRule('INVESTIGATION', 'CLOSED', 'ARCHIVED', async (entityId: string) => {
      // Archive related documents
      await prisma.auditLog.create({
        data: {
          userId: 'SYSTEM',
          action: 'INVESTIGATION_ARCHIVED',
          resourceType: 'Investigation',
          resourceId: entityId,
          changes: { automated: true },
        },
      })
    })
  }

  async executeScheduledAutomations() {
    // Run periodic checks
    const escalations = await prisma.workflowEscalation.findMany({
      where: { resolved: false },
    })

    for (const escalation of escalations) {
      const hoursSinceEscalation = (Date.now() - escalation.escalationTime.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceEscalation > 24) {
        // Auto-escalate to next level
        await prisma.workflowEscalation.update({
          where: { id: escalation.id },
          data: { escalationLevel: escalation.escalationLevel + 1 },
        })
      }
    }
  }

  async setupAllWorkflowAutomations() {
    await this.setupComplaintWorkflowAutomation()
    await this.setupInvestigationWorkflowAutomation()
  }
}
