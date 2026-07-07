export const workflowRules = {
  COMPLAINT: {
    canTransitionToDraft: ['INITIATED'],
    canTransitionToSubmitted: ['DRAFT'],
    canTransitionToAssigned: ['SUBMITTED'],
    canTransitionToInProgress: ['ASSIGNED'],
    canTransitionToCompleted: ['IN_PROGRESS'],
    canTransitionToClosed: ['COMPLETED'],
    canTransitionToAppealed: ['CLOSED'],
    canTransitionToArchived: ['CLOSED'],
    requiredApproversFor: {
      SUBMITTED: ['INVESTIGATOR_MANAGER'],
      COMPLETED: ['DEPARTMENT_HEAD'],
      CLOSED: ['JUSTICE_OFFICER'],
    },
    slaHours: {
      SUBMITTED: 24,
      ASSIGNED: 48,
      IN_PROGRESS: 30 * 24,
      COMPLETED: 5 * 24,
    },
  },

  INVESTIGATION: {
    canTransitionToInitiated: [],
    canTransitionToAssigned: ['INITIATED'],
    canTransitionToInProgress: ['ASSIGNED'],
    canTransitionToSuspended: ['IN_PROGRESS'],
    canTransitionToCompleted: ['IN_PROGRESS', 'SUSPENDED'],
    canTransitionToClosed: ['COMPLETED'],
    canTransitionToArchived: ['CLOSED'],
    requiredApproversFor: {
      ASSIGNED: ['CHIEF_INVESTIGATOR'],
      COMPLETED: ['DEPARTMENT_HEAD'],
      CLOSED: ['JUSTICE_OFFICER'],
    },
  },

  OPERATION: {
    canTransitionToPlanned: [],
    canTransitionToApproved: ['PLANNED'],
    canTransitionToActive: ['APPROVED'],
    canTransitionToOnHold: ['ACTIVE'],
    canTransitionToCompleted: ['ACTIVE', 'ON_HOLD'],
    canTransitionToClosed: ['COMPLETED'],
    requiredApproversFor: {
      APPROVED: ['COMMAND_OFFICER'],
      COMPLETED: ['OPERATIONS_DIRECTOR'],
    },
  },

  PRISONER: {
    canTransitionToBooked: [],
    canTransitionToProcessed: ['BOOKED'],
    canTransitionToCellAssigned: ['PROCESSED'],
    canTransitionToIncarcerated: ['CELL_ASSIGNED'],
    canTransitionToTransfer: ['INCARCERATED'],
    canTransitionToRelease: ['INCARCERATED'],
    canTransitionToEscape: ['INCARCERATED'],
    requiredApproversFor: {
      PROCESSED: ['BOOKING_OFFICER'],
      RELEASE: ['PRISON_DIRECTOR'],
    },
  },

  EVIDENCE: {
    canTransitionToCollected: [],
    canTransitionToLogged: ['COLLECTED'],
    canTransitionToStored: ['LOGGED'],
    canTransitionToAnalyzed: ['STORED'],
    canTransitionToArchived: ['ANALYZED'],
    requiredApproversFor: {
      STORED: ['EVIDENCE_MANAGER'],
      ANALYZED: ['FORENSICS_DIRECTOR'],
    },
  },

  // Universal rules
  universalRules: {
    noTransitionAfterArchived: true,
    requireAuditLogForAllTransitions: true,
    requireAuditLogForAllApprovals: true,
    maxApprovalWaitDays: 7,
    escalateAfterDays: 3,
    autoEscalateAfterHours: 24,
  },
}

export function canTransition(workflowType: string, fromState: string, toState: string): boolean {
  const workflow = workflowRules[workflowType as keyof typeof workflowRules] as any
  if (!workflow) return false

  const key = `canTransitionTo${toState.charAt(0).toUpperCase() + toState.slice(1).toLowerCase()}`
  const allowedStates = workflow[key] || []

  return allowedStates.includes(fromState.toUpperCase())
}

export function getRequiredApprovers(workflowType: string, toState: string): string[] {
  const workflow = workflowRules[workflowType as keyof typeof workflowRules] as any
  if (!workflow) return []

  return workflow.requiredApproversFor?.[toState.toUpperCase()] || []
}

export function getSLA(workflowType: string, state: string): number | undefined {
  const workflow = workflowRules[workflowType as keyof typeof workflowRules] as any
  if (!workflow) return undefined

  return workflow.slaHours?.[state.toUpperCase()]
}
