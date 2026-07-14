import { wantedPersonRepository } from '@/lib/repositories/wanted-persons.repository'
import { logAudit } from '@/lib/audit'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

export const CreateWantedPersonSchema = z.object({
  fullName: z.string().min(2).optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  identityNumber: z.string().min(1).optional(),
  nationalId: z.string().min(1).optional(),
  nationality: z.string().min(2).optional(),
  chargeDetails: z.string().min(3).optional(),
  charges: z.string().min(3).optional(),
  reason: z.string().min(3).optional(),
  issuingProvince: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
  dangerLevel: z.string().min(1).optional(),
  severity: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
})

export const UpdateWantedPersonSchema = CreateWantedPersonSchema.partial()

export class WantedPersonsService {
  async createWantedPerson(
    data: z.infer<typeof CreateWantedPersonSchema>,
    userId: string
  ) {
    const validated = CreateWantedPersonSchema.parse(data)

    const fullName = this.resolveFullName(validated)
    const chargeDetails =
      validated.chargeDetails ?? validated.charges ?? validated.reason
    const nationality = validated.nationality ?? 'يمني'
    const issuingProvince = validated.issuingProvince ?? validated.province ?? 'غير محددة'
    const dangerLevel = validated.dangerLevel ?? validated.severity ?? 'عالي'
    const identityNumber = validated.identityNumber ?? validated.nationalId
    const status = validated.status ?? 'مطلوب حياً'

    const person = await wantedPersonRepository.create({
      fullName,
      identityNumber,
      nationality,
      chargeDetails,
      issuingProvince,
      dangerLevel,
      status,
    })

    await logAudit({
      action: 'CREATE',
      officerId: userId,
      entityType: 'WantedPerson',
      entityId: String(person.id),
      changes: person,
    })

    return person
  }

  async getWantedPerson(id: string) {
    return wantedPersonRepository.findById(id)
  }

  async getWantedPersonDetails(id: string) {
    return wantedPersonRepository.findById(id)
  }

  async searchWantedPersons(query: string) {
    return wantedPersonRepository.search(query)
  }

  async listWantedPersons(filters?: {
    status?: string
    dangerLevel?: string
    query?: string
    departmentIds?: string[]
    skip?: number
    take?: number
  }) {
    return wantedPersonRepository.findAll(filters)
  }

  async updateWantedPerson(
    id: string,
    data: z.infer<typeof UpdateWantedPersonSchema>,
    userId: string
  ) {
    const person = await wantedPersonRepository.findById(id)
    if (!person) throw new Error('Wanted person not found')

    const validated = UpdateWantedPersonSchema.parse(data)

    const updateData = this.normalizeUpdate(validated) as Prisma.WantedPersonUpdateInput
    const updated = await wantedPersonRepository.update(id, updateData)

    await logAudit({
      action: 'UPDATE',
      officerId: userId,
      entityType: 'WantedPerson',
      entityId: id,
      changes: updateData,
    })

    return updated
  }

  async captureWantedPerson(id: string, location: string, userId: string) {
    const person = await wantedPersonRepository.findById(id)
    if (!person) throw new Error('Wanted person not found')

    const updated = await wantedPersonRepository.updateStatus(id, 'مقبوض عليه')

    await logAudit({
      action: 'CAPTURE',
      officerId: userId,
      entityType: 'WantedPerson',
      entityId: id,
      changes: { captured: true, location },
    })

    return { person: updated, location }
  }

  async issueInternationalNotice(id: string, noticeType: string, userId: string) {
    const person = await wantedPersonRepository.findById(id)
    if (!person) throw new Error('Wanted person not found')

    const updated = await wantedPersonRepository.issueInternationalNotice(id, noticeType)

    await logAudit({
      action: 'ISSUE_NOTICE',
      officerId: userId,
      entityType: 'WantedPerson',
      entityId: id,
      changes: { noticeType },
    })

    return updated
  }

  async getWantedPersonStatistics() {
    return wantedPersonRepository.getStatistics()
  }

  async getCriticalWantedPersons() {
    return wantedPersonRepository.findBySeverity('CRITICAL')
  }

  private resolveFullName(data: z.infer<typeof CreateWantedPersonSchema>): string {
    if (data.fullName?.trim()) {
      return data.fullName.trim()
    }

    const firstName = data.firstName?.trim() ?? ''
    const lastName = data.lastName?.trim() ?? ''
    const combined = `${firstName} ${lastName}`.trim()
    if (combined) {
      return combined
    }

    throw new Error('Full name is required')
  }

  private normalizeUpdate(data: z.infer<typeof UpdateWantedPersonSchema>) {
    const update: Record<string, unknown> = {}

    const fullName = data.fullName?.trim()
    if (fullName) {
      update.fullName = fullName
    } else if (data.firstName || data.lastName) {
      update.fullName = this.resolveFullName(data as z.infer<typeof CreateWantedPersonSchema>)
    }

    const identityNumber = data.identityNumber ?? data.nationalId
    if (identityNumber !== undefined) update.identityNumber = identityNumber

    if (data.nationality !== undefined) update.nationality = data.nationality

    const chargeDetails = data.chargeDetails ?? data.charges ?? data.reason
    if (chargeDetails !== undefined) update.chargeDetails = chargeDetails

    const issuingProvince = data.issuingProvince ?? data.province
    if (issuingProvince !== undefined) update.issuingProvince = issuingProvince

    const dangerLevel = data.dangerLevel ?? data.severity
    if (dangerLevel !== undefined) update.dangerLevel = dangerLevel

    if (data.status !== undefined) update.status = data.status

    return update
  }
}

export const wantedPersonsService = new WantedPersonsService()
