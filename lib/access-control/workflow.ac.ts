export const workflowAccessControl = {
  // Complaint Workflow
  COMPLAINT: {
    canInitiate: ['CITIZEN', 'POLICE_OFFICER', 'ADMIN'],
    canAssign: ['INVESTIGATOR_MANAGER', 'DEPARTMENT_HEAD'],
    canApprove: {
      SUBMITTED: ['INVESTIGATOR_MANAGER'],
      COMPLETED: ['DEPARTMENT_HEAD'],
      CLOSED: ['JUSTICE_OFFICER'],
    },
    canReject: ['INVESTIGATOR_MANAGER', 'DEPARTMENT_HEAD', 'JUSTICE_OFFICER'],
    canView: ['INITIATOR', 'ASSIGNED_USER', 'MANAGER', 'ADMIN'],
    canEdit: ['INITIATOR', 'ASSIGNED_USER'],
  },

  // Investigation Workflow
  INVESTIGATION: {
    canInitiate: ['INVESTIGATOR', 'CHIEF_INVESTIGATOR', 'ADMIN'],
    canAssign: ['CHIEF_INVESTIGATOR', 'DEPARTMENT_HEAD'],
    canApprove: {
      ASSIGNED: ['CHIEF_INVESTIGATOR'],
      COMPLETED: ['DEPARTMENT_HEAD'],
      CLOSED: ['JUSTICE_OFFICER'],
    },
    canReject: ['CHIEF_INVESTIGATOR', 'DEPARTMENT_HEAD'],
    canView: ['INVESTIGATOR', 'CHIEF_INVESTIGATOR', 'MANAGER', 'ADMIN'],
    canEdit: ['INVESTIGATOR', 'CHIEF_INVESTIGATOR'],
  },

  // Operation Workflow
  OPERATION: {
    canInitiate: ['COMMANDER', 'COMMAND_OFFICER', 'ADMIN'],
    canApprove: {
      APPROVED: ['COMMAND_OFFICER'],
      COMPLETED: ['OPERATIONS_DIRECTOR'],
    },
    canView: ['COMMANDER', 'COMMAND_OFFICER', 'OPERATIONS_DIRECTOR', 'ADMIN'],
    canEdit: ['COMMANDER', 'COMMAND_OFFICER'],
  },

  // Prison Workflow
  PRISONER: {
    canInitiate: ['POLICE_OFFICER', 'BOOKING_OFFICER', 'ADMIN'],
    canProcess: ['BOOKING_OFFICER', 'PRISON_STAFF'],
    canApprove: {
      PROCESSED: ['BOOKING_OFFICER'],
      RELEASE: ['PRISON_DIRECTOR'],
    },
    canView: ['PRISON_STAFF', 'PRISON_DIRECTOR', 'ADMIN'],
    canEdit: ['BOOKING_OFFICER', 'PRISON_STAFF'],
  },

  // Evidence Workflow
  EVIDENCE: {
    canInitiate: ['INVESTIGATOR', 'FORENSICS_OFFICER', 'ADMIN'],
    canCollect: ['INVESTIGATOR', 'FORENSICS_OFFICER'],
    canApprove: {
      STORED: ['EVIDENCE_MANAGER'],
      ANALYZED: ['FORENSICS_DIRECTOR'],
    },
    canView: ['INVESTIGATOR', 'FORENSICS_OFFICER', 'EVIDENCE_MANAGER', 'ADMIN'],
    canEdit: ['FORENSICS_OFFICER', 'EVIDENCE_MANAGER'],
  },
}

export function canPerformAction(
  role: string,
  workflowType: string,
  action: string,
  targetState?: string
): boolean {
  const config = workflowAccessControl[workflowType as keyof typeof workflowAccessControl] as any
  
  if (!config) return false

  if (action === 'approve' && targetState) {
    const approvers = config.canApprove?.[targetState] || []
    return approvers.includes(role)
  }

  const allowedRoles = config[`can${action.charAt(0).toUpperCase() + action.slice(1)}`] || []
  
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(role)
  }

  return false
}
