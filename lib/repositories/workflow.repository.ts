import { prisma } from '@/lib/prisma'
import { WorkflowState, WorkflowTransition, WorkflowApproval, WorkflowEscalation, WorkflowTransitionLog } from '@prisma/client'

export const workflowRepository = {
  // Workflow States
  async getWorkflowStates(workflowType: string) {
    return prisma.workflowState.findMany({
      where: { workflowType, isDeleted: false },
      orderBy: { orderSequence: 'asc' },
    })
  },

  async getWorkflowState(id: string) {
    return prisma.workflowState.findUnique({ where: { id } })
  },

  async createWorkflowState(data: any) {
    return prisma.workflowState.create({ data })
  },

  async updateWorkflowState(id: string, data: any) {
    return prisma.workflowState.update({ where: { id }, data })
  },

  // Workflow Transitions
  async getTransitions(fromStateId: string) {
    return prisma.workflowTransition.findMany({
      where: { fromStateId },
      include: { toState: true },
    })
  },

  async getTransitionByStates(fromStateId: string, toStateId: string) {
    return prisma.workflowTransition.findUnique({
      where: { fromStateId_toStateId: { fromStateId, toStateId } },
    })
  },

  // Approvals
  async getPendingApprovals(requiredRole: string, limit = 50) {
    return prisma.workflowApproval.findMany({
      where: { status: 'PENDING', requiredRole },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
  },

  async getApprovalsByEntity(entityId: string) {
    return prisma.workflowApproval.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async createApproval(data: any) {
    return prisma.workflowApproval.create({ data })
  },

  async approveWorkflow(approvalId: string, approvedBy: string) {
    return prisma.workflowApproval.update({
      where: { id: approvalId },
      data: { status: 'APPROVED', approvedBy, approvalDate: new Date() },
    })
  },

  async rejectWorkflow(approvalId: string, approvedBy: string, reason: string) {
    return prisma.workflowApproval.update({
      where: { id: approvalId },
      data: { status: 'REJECTED', approvedBy, approvalDate: new Date(), rejectionReason: reason },
    })
  },

  // Escalations
  async getActiveEscalations(workflowType: string) {
    return prisma.workflowEscalation.findMany({
      where: { workflowType, resolved: false },
      orderBy: { escalationTime: 'asc' },
    })
  },

  async createEscalation(data: any) {
    return prisma.workflowEscalation.create({ data })
  },

  async resolveEscalation(escalationId: string) {
    return prisma.workflowEscalation.update({
      where: { id: escalationId },
      data: { resolved: true, resolvedTime: new Date() },
    })
  },

  // Transition Logs
  async createTransitionLog(data: any) {
    return prisma.workflowTransitionLog.create({ data })
  },

  async getTransitionHistory(entityId: string, limit = 100) {
    return prisma.workflowTransitionLog.findMany({
      where: { entityId },
      take: limit,
      orderBy: { timestamp: 'desc' },
    })
  },

  // Statistics
  async getWorkflowStats(workflowType: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const logs = await prisma.workflowTransitionLog.findMany({
      where: { workflowType, timestamp: { gte: since } },
    })

    const states = logs.reduce((acc: any, log: any) => {
      acc[log.newState] = (acc[log.newState] || 0) + 1
      return acc
    }, {})

    const avgTime = logs.length > 0
      ? logs.reduce((sum: number, log: any) => sum + log.timestamp.getTime(), 0) / logs.length
      : 0

    return { totalTransitions: logs.length, stateDistribution: states, avgProcessingTime: avgTime }
  },
}
