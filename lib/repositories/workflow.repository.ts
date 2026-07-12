import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  WorkflowType,
  WorkflowState,
  workflowStateMachine,
} from '@/lib/workflow/state-machine'

export interface WorkflowStateRecord {
  id: string
  workflowType: string
  stateName: string
  displayName: string
  orderSequence: number
  requiresApproval: boolean
  approvalRole?: string | null
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowTransitionRecord {
  id: string
  fromStateId: string
  toStateId: string
  requiresApproval: boolean
  approvalRole?: string | null
  condition?: string | null
  description?: string | null
  sla?: number | null
  toState?: WorkflowStateRecord | null
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowApprovalRecord {
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
  reason?: string | null
  createdAt: Date
  expiresAt: Date
}

export interface WorkflowEscalationRecord {
  id: string
  entityId: string
  workflowType: string
  currentState: string
  escalationLevel: number
  escalatedTo?: string | null
  escalationReason?: string | null
  escalationTime: Date
  resolvedTime?: Date | null
  resolved: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowTransitionLogRecord {
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
  approvalStatus?: string | null
  approvedBy?: string | null
  approvalTimestamp?: Date | null
  metadata?: Record<string, unknown> | null
  timestamp: Date
}

export interface WorkflowAutomationHistoryRecord {
  id: string
  entityId: string
  workflowType: string
  ruleKey: string
  actionName: string
  status: string
  details?: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowSlaRuleRecord {
  id: string
  workflowType: string
  fromState: string
  toState: string
  slaHours: number
  createdAt: Date
  updatedAt: Date
}

const seededWorkflowTypes = new Set<string>()
let seedPromise: Promise<void> | null = null

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getStateId(workflowType: string, stateName: string): string {
  return `${workflowType}:${stateName}`
}

function getTransitionId(fromStateId: string, toStateId: string): string {
  return `${fromStateId}=>${toStateId}`
}

async function ensureWorkflowDefinitions() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const workflowTypes = Object.values(WorkflowType)

      for (const workflowType of workflowTypes) {
        if (seededWorkflowTypes.has(workflowType)) {
          continue
        }

        const states = workflowStateMachine.getAllStates(workflowType)
        if (states.length === 0) {
          seededWorkflowTypes.add(workflowType)
          continue
        }

        let orderSequence = 1
        for (const stateName of states) {
          const id = getStateId(workflowType, stateName)
          await prisma.workflowState.upsert({
            where: { id },
            create: {
              id,
              workflowType,
              stateName,
              displayName: titleCase(stateName),
              orderSequence,
              requiresApproval: false,
              approvalRole: null,
              isDeleted: false,
            },
            update: {
              workflowType,
              stateName,
              displayName: titleCase(stateName),
              orderSequence,
              isDeleted: false,
            },
          })
          orderSequence += 1
        }

        for (const fromStateName of states) {
          const transitions = workflowStateMachine.getNextStates(workflowType, fromStateName as WorkflowState)
          for (const transition of transitions) {
            const fromStateId = getStateId(workflowType, String(transition.fromState))
            const toStateId = getStateId(workflowType, String(transition.toState))

            await prisma.workflowTransition.upsert({
              where: { id: getTransitionId(fromStateId, toStateId) },
              create: {
                id: getTransitionId(fromStateId, toStateId),
                fromStateId,
                toStateId,
                requiresApproval: transition.requiresApproval,
                approvalRole: transition.approvalRole ?? null,
                condition: null,
                description: transition.description,
                sla: transition.sla ?? null,
              },
              update: {
                requiresApproval: transition.requiresApproval,
                approvalRole: transition.approvalRole ?? null,
                description: transition.description,
                sla: transition.sla ?? null,
              },
            })

            if (transition.sla !== undefined && transition.sla !== null) {
              await prisma.workflowSlaRule.upsert({
                where: {
                  workflowType_fromState_toState: {
                    workflowType,
                    fromState: String(transition.fromState),
                    toState: String(transition.toState),
                  },
                },
                create: {
                  workflowType,
                  fromState: String(transition.fromState),
                  toState: String(transition.toState),
                  slaHours: transition.sla,
                },
                update: {
                  slaHours: transition.sla,
                },
              })
            }
          }
        }

        seededWorkflowTypes.add(workflowType)
      }
    })().finally(() => {
      seedPromise = null
    })
  }

  return seedPromise
}

export const workflowRepository = {
  async getWorkflowStates(workflowType: string) {
    await ensureWorkflowDefinitions()
    return prisma.workflowState.findMany({
      where: { workflowType, isDeleted: false },
      orderBy: { orderSequence: 'asc' },
    })
  },

  async getWorkflowState(id: string) {
    await ensureWorkflowDefinitions()
    return prisma.workflowState.findUnique({ where: { id } })
  },

  async createWorkflowState(data: Partial<WorkflowStateRecord>) {
    if (!data.workflowType || !data.stateName) {
      throw new Error('workflowType and stateName are required')
    }

    const id = data.id || getStateId(data.workflowType, data.stateName)
    return prisma.workflowState.upsert({
      where: { id },
      create: {
        id,
        workflowType: data.workflowType,
        stateName: data.stateName,
        displayName: data.displayName || titleCase(data.stateName),
        orderSequence: data.orderSequence || 1,
        requiresApproval: data.requiresApproval ?? false,
        approvalRole: data.approvalRole ?? null,
        isDeleted: data.isDeleted ?? false,
      },
      update: {
        workflowType: data.workflowType,
        stateName: data.stateName,
        displayName: data.displayName || titleCase(data.stateName),
        orderSequence: data.orderSequence || 1,
        requiresApproval: data.requiresApproval ?? false,
        approvalRole: data.approvalRole ?? null,
        isDeleted: data.isDeleted ?? false,
      },
    })
  },

  async updateWorkflowState(id: string, data: Partial<WorkflowStateRecord>) {
    return prisma.workflowState.update({
      where: { id },
      data: {
        ...(data.workflowType !== undefined ? { workflowType: data.workflowType } : {}),
        ...(data.stateName !== undefined ? { stateName: data.stateName } : {}),
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.orderSequence !== undefined ? { orderSequence: data.orderSequence } : {}),
        ...(data.requiresApproval !== undefined ? { requiresApproval: data.requiresApproval } : {}),
        ...(data.approvalRole !== undefined ? { approvalRole: data.approvalRole } : {}),
        ...(data.isDeleted !== undefined ? { isDeleted: data.isDeleted } : {}),
      },
    })
  },

  async getTransitions(fromStateId: string) {
    await ensureWorkflowDefinitions()
    return prisma.workflowTransition.findMany({
      where: { fromStateId },
      include: { toState: true },
      orderBy: { createdAt: 'asc' },
    })
  },

  async getTransitionByStates(fromStateId: string, toStateId: string) {
    await ensureWorkflowDefinitions()
    return prisma.workflowTransition.findUnique({
      where: {
        fromStateId_toStateId: {
          fromStateId,
          toStateId,
        },
      },
      include: { toState: true },
    })
  },

  async getPendingApprovals(requiredRole: string, limit = 50) {
    await ensureWorkflowDefinitions()
    return prisma.workflowApproval.findMany({
      where: {
        requiredRole,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as unknown as WorkflowApprovalRecord[]
  },

  async getApprovalsByEntity(entityId: string) {
    await ensureWorkflowDefinitions()
    return prisma.workflowApproval.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
    }) as unknown as WorkflowApprovalRecord[]
  },

  async getApprovalById(approvalId: string) {
    await ensureWorkflowDefinitions()
    return prisma.workflowApproval.findUnique({ where: { id: approvalId } }) as Promise<WorkflowApprovalRecord | null>
  },

  async createApproval(data: Partial<WorkflowApprovalRecord>) {
    if (!data.workflowTransitionId || !data.entityId || !data.requestedBy || !data.requestedByRole || !data.requiredRole) {
      throw new Error('Missing required approval data')
    }

    return prisma.workflowApproval.create({
      data: {
        workflowTransitionId: data.workflowTransitionId,
        entityId: data.entityId,
        requestedBy: data.requestedBy,
        requestedByRole: data.requestedByRole,
        requiredRole: data.requiredRole,
        status: data.status || 'PENDING',
        approvedBy: data.approvedBy ?? null,
        approvalDate: data.approvalDate ?? null,
        rejectionReason: data.rejectionReason ?? null,
        reason: data.reason ?? null,
        expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }) as unknown as WorkflowApprovalRecord
  },

  async approveWorkflow(approvalId: string, approvedBy: string) {
    return prisma.workflowApproval.update({
      where: { id: approvalId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvalDate: new Date(),
        rejectionReason: null,
      },
    }) as unknown as WorkflowApprovalRecord
  },

  async rejectWorkflow(approvalId: string, approvedBy: string, reason: string) {
    return prisma.workflowApproval.update({
      where: { id: approvalId },
      data: {
        status: 'REJECTED',
        approvedBy,
        approvalDate: new Date(),
        rejectionReason: reason,
      },
    }) as unknown as WorkflowApprovalRecord
  },

  async getActiveEscalations(workflowType: string) {
    await ensureWorkflowDefinitions()
    return prisma.workflowEscalation.findMany({
      where: { workflowType, resolved: false },
      orderBy: { escalationTime: 'asc' },
    }) as unknown as WorkflowEscalationRecord[]
  },

  async createEscalation(data: Partial<WorkflowEscalationRecord>) {
    if (!data.entityId || !data.workflowType || !data.currentState) {
      throw new Error('Missing required escalation data')
    }

    return prisma.workflowEscalation.create({
      data: {
        entityId: data.entityId,
        workflowType: data.workflowType,
        currentState: data.currentState,
        escalationLevel: data.escalationLevel || 1,
        escalatedTo: data.escalatedTo ?? null,
        escalationReason: data.escalationReason ?? null,
        escalationTime: data.escalationTime || new Date(),
        resolvedTime: data.resolvedTime ?? null,
        resolved: data.resolved ?? false,
      },
    }) as unknown as WorkflowEscalationRecord
  },

  async resolveEscalation(escalationId: string) {
    return prisma.workflowEscalation.update({
      where: { id: escalationId },
      data: {
        resolved: true,
        resolvedTime: new Date(),
      },
    }) as unknown as WorkflowEscalationRecord
  },

  async createTransitionLog(data: Partial<WorkflowTransitionLogRecord>) {
    if (!data.entityId || !data.workflowType || !data.previousState || !data.newState || !data.userId || !data.userRole || !data.userDepartment) {
      throw new Error('Missing required transition log data')
    }

    return prisma.workflowTransitionLog.create({
      data: {
        entityId: data.entityId,
        workflowType: data.workflowType,
        previousState: data.previousState,
        newState: data.newState,
        userId: data.userId,
        userRole: data.userRole,
        userDepartment: data.userDepartment,
        reason: data.reason ?? null,
        requiresApproval: data.requiresApproval ?? false,
        approvalStatus: data.approvalStatus ?? null,
        approvedBy: data.approvedBy ?? null,
        approvalTimestamp: data.approvalTimestamp ?? null,
        metadata: (data.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
        timestamp: data.timestamp || new Date(),
      },
    }) as unknown as WorkflowTransitionLogRecord
  },

  async updateTransitionLogApproval(
    transitionId: string,
    data: {
      approvalStatus: string
      approvedBy: string
      approvalTimestamp?: Date | null
    },
  ) {
    return prisma.workflowTransitionLog.update({
      where: { id: transitionId },
      data: {
        approvalStatus: data.approvalStatus,
        approvedBy: data.approvedBy,
        approvalTimestamp: data.approvalTimestamp ?? new Date(),
      },
    })
  },

  async getTransitionHistory(entityId: string, limit = 100) {
    await ensureWorkflowDefinitions()
    return prisma.workflowTransitionLog.findMany({
      where: { entityId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    }) as unknown as WorkflowTransitionLogRecord[]
  },

  async getWorkflowStats(workflowType: string, days = 30) {
    await ensureWorkflowDefinitions()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const logs = await prisma.workflowTransitionLog.findMany({
      where: { workflowType, timestamp: { gte: since } },
      orderBy: { timestamp: 'asc' },
    })

    const states = logs.reduce<Record<string, number>>((acc, log) => {
      acc[log.newState] = (acc[log.newState] || 0) + 1
      return acc
    }, {})

    const avgTime = logs.length > 0
      ? logs.reduce((sum, log) => sum + log.timestamp.getTime(), 0) / logs.length
      : 0

    return {
      totalTransitions: logs.length,
      stateDistribution: states,
      avgProcessingTime: avgTime,
    }
  },

  async getApprovalStats(requiredRole: string, days = 30) {
    await ensureWorkflowDefinitions()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const approvals = await prisma.workflowApproval.findMany({
      where: {
        requiredRole,
        createdAt: { gte: since },
      },
    })

    const pending = approvals.filter((item) => item.status === 'PENDING').length
    const approved = approvals.filter((item) => item.status === 'APPROVED').length
    const rejected = approvals.filter((item) => item.status === 'REJECTED').length

    return { pending, approved, rejected, total: approvals.length }
  },

  async recordAutomationHistory(data: {
    entityId: string
    workflowType: string
    ruleKey: string
    actionName: string
    status: string
    details?: Record<string, unknown> | null
  }) {
    return prisma.workflowAutomationHistory.create({
      data: {
        entityId: data.entityId,
        workflowType: data.workflowType,
        ruleKey: data.ruleKey,
        actionName: data.actionName,
        status: data.status,
        details: (data.details ?? Prisma.JsonNull) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
      },
    }) as unknown as WorkflowAutomationHistoryRecord
  },

  async getAutomationHistory(entityId: string, workflowType?: string) {
    return prisma.workflowAutomationHistory.findMany({
      where: {
        entityId,
        ...(workflowType ? { workflowType } : {}),
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as WorkflowAutomationHistoryRecord[]
  },

  async upsertSlaRule(data: WorkflowSlaRuleRecord) {
    return prisma.workflowSlaRule.upsert({
      where: {
        workflowType_fromState_toState: {
          workflowType: data.workflowType,
          fromState: data.fromState,
          toState: data.toState,
        },
      },
      create: data,
      update: {
        slaHours: data.slaHours,
      },
    }) as unknown as WorkflowSlaRuleRecord
  },

  async getSlaRules(workflowType: string) {
    return prisma.workflowSlaRule.findMany({
      where: { workflowType },
    }) as unknown as WorkflowSlaRuleRecord[]
  },
}
