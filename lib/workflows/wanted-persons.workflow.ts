type WantedPersonsStateConfig = {
  displayName: string
  next: string[]
  requiresApproval: boolean
  approvalRole?: string
}

export const wantedPersonsWorkflow = {
  workflowType: 'WANTED_PERSON',
  states: {
    DRAFT: {
      displayName: 'Draft',
      next: ['REVIEW', 'REJECTED'],
      requiresApproval: false,
    },
    REVIEW: {
      displayName: 'Under Review',
      next: ['APPROVED', 'REJECTED', 'DRAFT'],
      requiresApproval: true,
      approvalRole: 'INVESTIGATOR',
    },
    APPROVED: {
      displayName: 'Approved',
      next: ['PUBLISHED', 'ARCHIVED'],
      requiresApproval: false,
    },
    PUBLISHED: {
      displayName: 'Published',
      next: ['CAPTURED', 'DECEASED', 'INACTIVE'],
      requiresApproval: false,
    },
    CAPTURED: {
      displayName: 'Captured',
      next: ['TRANSFERRED', 'RELEASED'],
      requiresApproval: false,
    },
    TRANSFERRED: {
      displayName: 'Transferred to Custody',
      next: ['ARCHIVED'],
      requiresApproval: false,
    },
    DECEASED: {
      displayName: 'Deceased',
      next: ['ARCHIVED'],
      requiresApproval: false,
    },
    INACTIVE: {
      displayName: 'Inactive',
      next: ['ARCHIVED', 'REACTIVATED'],
      requiresApproval: false,
    },
    REACTIVATED: {
      displayName: 'Reactivated',
      next: ['PUBLISHED', 'INACTIVE'],
      requiresApproval: true,
      approvalRole: 'SUPERVISOR',
    },
    ARCHIVED: {
      displayName: 'Archived',
      next: [],
      requiresApproval: false,
    },
    REJECTED: {
      displayName: 'Rejected',
      next: ['DRAFT'],
      requiresApproval: false,
    },
  } as Record<string, WantedPersonsStateConfig>,
}

export const wantedPersonsTransitions = {
  publishNotice: { from: 'APPROVED', to: 'PUBLISHED', sla: 24 },
  recordCapture: { from: 'PUBLISHED', to: 'CAPTURED', sla: 0 },
  closeCase: { from: 'CAPTURED', to: 'TRANSFERRED', sla: 48 },
  archiveRecord: { from: ['TRANSFERRED', 'DECEASED'], to: 'ARCHIVED', sla: 72 },
}
