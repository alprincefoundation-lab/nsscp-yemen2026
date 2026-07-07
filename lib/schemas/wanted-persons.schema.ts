import { z } from 'zod'

export const createWantedPersonSchema = z.object({
  name: z.string().min(3).max(255),
  nationality: z.string().min(2).max(100),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  physicalDescription: z.string().max(1000).optional(),
  charges: z.string().min(5).max(1000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  photoUrl: z.string().url().optional(),
})

export const updateWantedPersonSchema = createWantedPersonSchema.partial()

export const captureRecordSchema = z.object({
  wantedPersonId: z.string().cuid(),
  captureDate: z.string().datetime(),
  location: z.string().min(5).max(500),
  capturedBy: z.string().cuid(),
  notes: z.string().max(2000).optional(),
})

export const internationalNoticeSchema = z.object({
  wantedPersonId: z.string().cuid(),
  noticeType: z.enum(['RED_NOTICE', 'BLUE_NOTICE', 'GREEN_NOTICE']),
  publishDate: z.string().datetime(),
})

export type CreateWantedPersonInput = z.infer<typeof createWantedPersonSchema>
export type UpdateWantedPersonInput = z.infer<typeof updateWantedPersonSchema>
export type CaptureRecordInput = z.infer<typeof captureRecordSchema>
export type InternationalNoticeInput = z.infer<typeof internationalNoticeSchema>
