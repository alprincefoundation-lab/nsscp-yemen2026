import { z } from 'zod'

export const transitionRequestSchema = z.object({
  entityId: z.string().min(1, 'Entity ID required'),
  workflowType: z.enum(['COMPLAINT', 'INVESTIGATION', 'OPERATION', 'EVIDENCE', 'PRISONER', 'WANTED_PERSON', 'APPEAL', 'COURT']),
  fromState: z.string().min(1, 'From state required'),
  toState: z.string().min(1, 'To state required'),
  userId: z.string().min(1, 'User ID required'),
  userRole: z.string().min(1, 'User role required'),
  userDepartment: z.string().min(1, 'Department required'),
  reason: z.string().optional(),
})

export const approvalSchema = z.object({
  approvalId: z.string().min(1, 'Approval ID required'),
  approvedBy: z.string().min(1, 'Approver ID required'),
  comments: z.string().optional(),
})

export const rejectionSchema = z.object({
  approvalId: z.string().min(1, 'Approval ID required'),
  rejectedBy: z.string().min(1, 'Rejector ID required'),
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters'),
})

export const workflowStateSchema = z.object({
  workflowType: z.string().min(1),
  stateName: z.string().min(1),
  displayName: z.string().min(1),
  orderSequence: z.number().int().positive(),
  requiresApproval: z.boolean().default(false),
  approvalRole: z.string().optional(),
})

export const workflowTransitionSchema = z.object({
  fromStateId: z.string().min(1),
  toStateId: z.string().min(1),
  requiresApproval: z.boolean().default(false),
  approvalRole: z.string().optional(),
  condition: z.string().optional(),
  description: z.string().optional(),
  sla: z.number().int().positive().optional(),
})

export type TransitionRequest = z.infer<typeof transitionRequestSchema>
export type ApprovalRequest = z.infer<typeof approvalSchema>
export type RejectionRequest = z.infer<typeof rejectionSchema>
