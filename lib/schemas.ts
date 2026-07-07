import { z } from 'zod'

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const LoginSchema = z.object({
  militaryId: z.string().min(1, 'Military ID is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const RegisterSchema = z
  .object({
    militaryId: z
      .string()
      .min(1, 'Military ID is required')
      .regex(/^[A-Z0-9\-]+$/, 'Invalid military ID format'),
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    passwordConfirm: z.string(),
    departmentId: z.string().uuid('Invalid department'),
    rank: z.string().min(1, 'Rank is required'),
    nationalId: z
      .string()
      .regex(/^\d{13}$/, 'National ID must be 13 digits'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  })

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

// ============================================================================
// CASE SCHEMAS
// ============================================================================

export const CreateCaseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  type: z.enum(['CRIMINAL', 'SECURITY', 'ADMINISTRATIVE']),
  severity: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  departmentId: z.string().uuid('Invalid department'),
})

export const UpdateCaseSchema = CreateCaseSchema.partial().extend({
  status: z
    .enum(['OPEN', 'UNDER_INVESTIGATION', 'CLOSED', 'ARCHIVED'])
    .optional(),
})

export const UpdateCaseStatusSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_INVESTIGATION', 'CLOSED', 'ARCHIVED']),
})

// ============================================================================
// COMPLAINT SCHEMAS
// ============================================================================

export const CreateComplaintSchema = z.object({
  complaintType: z.enum([
    'CRIME_REPORT',
    'MISCONDUCT',
    'SECURITY_THREAT',
  ]),
  category: z.string().min(3, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  complainantName: z.string().min(2, 'Complainant name is required'),
  complainantPhone: z.string().optional(),
  complainantEmail: z.string().email('Invalid email').optional(),
  caseId: z.string().uuid('Invalid case'),
})

// ============================================================================
// INVESTIGATION SCHEMAS
// ============================================================================

export const CreateInvestigationSchema = z.object({
  caseId: z.string().uuid('Invalid case'),
  assignedToId: z.string().uuid('Invalid investigator'),
  findings: z.string().optional(),
})

export const UpdateInvestigationSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED']).optional(),
  findings: z.string().optional(),
})

// ============================================================================
// EVIDENCE SCHEMAS
// ============================================================================

export const CreateEvidenceSchema = z.object({
  type: z.enum(['PHYSICAL', 'DIGITAL', 'DOCUMENT', 'BIOLOGICAL']),
  description: z.string().min(10, 'Description is required'),
  caseId: z.string().uuid('Invalid case'),
  investigationId: z.string().uuid('Invalid investigation').optional(),
  collectedBy: z.string().optional(),
  collectedAt: z.string().datetime('Invalid date'),
  location: z.string().optional(),
  handler: z.string().optional(),
  storageLocation: z.string().optional(),
})

// ============================================================================
// WANTED PERSON SCHEMAS
// ============================================================================

export const CreateWantedPersonSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  nationalId: z
    .string()
    .regex(/^\d{13}$/, 'National ID must be 13 digits')
    .optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  dateOfBirth: z.string().datetime('Invalid date').optional(),
  height: z.string().optional(),
  physicalDescription: z.string().optional(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  lastSeenLocation: z.string().optional(),
  lastSeenDate: z.string().datetime('Invalid date').optional(),
})

// ============================================================================
// OPERATION SCHEMAS
// ============================================================================

export const CreateOperationSchema = z.object({
  name: z.string().min(5, 'Name must be at least 5 characters'),
  description: z.string().optional(),
  type: z.enum(['SECURITY', 'SEARCH', 'SURVEILLANCE', 'RESCUE']),
  startDate: z.string().datetime('Invalid date'),
  commanderId: z.string().uuid('Invalid commander'),
  departmentId: z.string().uuid('Invalid department'),
  objectives: z.string().optional(),
  location: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  unitsInvolved: z.array(z.string()).default([]),
  vehiclesUsed: z.array(z.string()).default([]),
  weaponsUsed: z.array(z.string()).default([]),
})

export const UpdateOperationSchema = z.object({
  status: z
    .enum(['PLANNED', 'BRIEFING', 'EXECUTION', 'DEBRIEF', 'COMPLETED'])
    .optional(),
  endDate: z.string().datetime('Invalid date').optional(),
})

// ============================================================================
// INCIDENT SCHEMAS
// ============================================================================

export const CreateIncidentSchema = z.object({
  type: z.enum(['EMERGENCY', 'ACCIDENT', 'CRIME', 'MEDICAL']),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  description: z.string().min(10, 'Description is required'),
  location: z.string().min(5, 'Location is required'),
  province: z.string().optional(),
  district: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  reportedBy: z.string().optional(),
  respondingUnits: z.array(z.string()).default([]),
})

export const UpdateIncidentSchema = z.object({
  status: z
    .enum(['OPEN', 'RESPONDING', 'RESOLVED', 'CLOSED'])
    .optional(),
})

// ============================================================================
// VEHICLE SCHEMAS
// ============================================================================

export const CreateVehicleSchema = z.object({
  vehicleId: z.string().min(3, 'Vehicle ID is required'),
  plateNumber: z.string().min(3, 'Plate number is required'),
  type: z.enum(['CAR', 'TRUCK', 'MOTORCYCLE', 'VAN']),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  year: z.number().min(1950).max(2100).optional(),
  vin: z.string().optional(),
})

// ============================================================================
// WEAPON SCHEMAS
// ============================================================================

export const CreateWeaponSchema = z.object({
  weaponId: z.string().min(3, 'Weapon ID is required'),
  type: z.string().min(2, 'Type is required'),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
})

// ============================================================================
// TASK SCHEMAS
// ============================================================================

export const CreateTaskSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  investigationId: z.string().uuid('Invalid investigation').optional(),
  assignedTo: z.string().uuid('Invalid user').optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  dueDate: z.string().datetime('Invalid date').optional(),
})

export const UpdateTaskSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  dueDate: z.string().datetime('Invalid date').optional(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type CreateCaseInput = z.infer<typeof CreateCaseSchema>
export type UpdateCaseInput = z.infer<typeof UpdateCaseSchema>
export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>
export type CreateInvestigationInput = z.infer<typeof CreateInvestigationSchema>
export type CreateEvidenceInput = z.infer<typeof CreateEvidenceSchema>
export type CreateWantedPersonInput = z.infer<typeof CreateWantedPersonSchema>
export type CreateOperationInput = z.infer<typeof CreateOperationSchema>
export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>
export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>
export type CreateWeaponInput = z.infer<typeof CreateWeaponSchema>
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
