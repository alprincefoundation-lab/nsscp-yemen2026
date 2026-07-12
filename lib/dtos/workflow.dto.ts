export class WorkflowStateDTO {
  id!: string
  workflowType!: string
  stateName!: string
  displayName!: string
  orderSequence!: number
  requiresApproval!: boolean
  approvalRole?: string
  createdAt!: Date
  updatedAt!: Date
}

export class WorkflowTransitionDTO {
  id!: string
  fromStateId!: string
  toStateId!: string
  requiresApproval!: boolean
  approvalRole?: string
  condition?: string
  description?: string
  sla?: number
}

export class WorkflowApprovalDTO {
  id!: string
  workflowTransitionId!: string
  entityId!: string
  requestedBy!: string
  requestedByRole!: string
  requiredRole!: string
  status!: string
  approvedBy?: string
  approvalDate?: Date
  rejectionReason?: string
  reason?: string
  createdAt!: Date
  expiresAt!: Date
}

export class WorkflowEscalationDTO {
  id!: string
  entityId!: string
  workflowType!: string
  currentState!: string
  escalationLevel!: number
  escalatedTo?: string
  escalationReason?: string
  escalationTime!: Date
  resolvedTime?: Date
  resolved!: boolean
  createdAt!: Date
  updatedAt!: Date
}

export class WorkflowTransitionLogDTO {
  id!: string
  entityId!: string
  workflowType!: string
  previousState!: string
  newState!: string
  userId!: string
  userRole!: string
  userDepartment!: string
  reason?: string
  requiresApproval!: boolean
  metadata?: any
  timestamp!: Date
}

export class TransitionRequestDTO {
  entityId!: string
  workflowType!: string
  fromState!: string
  toState!: string
  userId!: string
  userRole!: string
  userDepartment!: string
  reason?: string
}

export class ApprovalResponseDTO {
  approvalId!: string
  status!: 'APPROVED' | 'REJECTED'
  approvedBy!: string
  approvalDate!: Date
  rejectionReason?: string
}
