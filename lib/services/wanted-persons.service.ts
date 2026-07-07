import { wantedPersonRepository } from '@/lib/repositories/wanted-persons.repository'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

export const CreateWantedPersonSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  nationalId: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.date().optional(),
  height: z.string().optional(),
  physicalDescription: z.string().optional(),
  profilePhoto: z.string().optional(),
  reason: z.string().min(10),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  domesticStatus: z.enum(['ACTIVE', 'CAPTURED', 'DECEASED', 'PARDONED']).default('ACTIVE'),
  lastSeenLocation: z.string().optional(),
  lastSeenDate: z.date().optional(),
})

export const UpdateWantedPersonSchema = CreateWantedPersonSchema.partial()

export class WantedPersonsService {
  async createWantedPerson(
    data: z.infer<typeof CreateWantedPersonSchema>,
    userId: string,
    departmentId: string
  ) {
    const validated = CreateWantedPersonSchema.parse(data)
    
    const wantedNumber = await this.generateWantedNumber()
    
    const person = await wantedPersonRepository.create({
      ...validated,
      wantedNumber,
      status: 'ACTIVE',
    })

    await logAudit({
      userId,
      userRole: 'SYSTEM',
      action: 'CREATE',
      resourceType: 'WantedPerson',
      resourceId: person.id,
      changes: person,
    })

    return person
  }

  async getWantedPerson(id: string) {
    return wantedPersonRepository.findById(id)
  }

  async searchWantedPersons(query: string) {
    return wantedPersonRepository.search(query)
  }

  async listWantedPersons(filters?: {
    status?: string
    severity?: string
    domesticStatus?: string
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
    
    const updated = await wantedPersonRepository.update(id, validated)

    await logAudit({
      userId,
      userRole: 'SYSTEM',
      action: 'UPDATE',
      resourceType: 'WantedPerson',
      resourceId: id,
      changes: validated,
    })

    return updated
  }

  async captureWantedPerson(id: string, location: string, userId: string) {
    const person = await wantedPersonRepository.findById(id)
    if (!person) throw new Error('Wanted person not found')

    const updated = await wantedPersonRepository.update(id, {
      domesticStatus: 'CAPTURED',
      lastSeenLocation: location,
      lastSeenDate: new Date(),
      status: 'INACTIVE',
    })

    // Create case for captured person
    const case_ = await prisma.case.create({
      data: {
        caseNumber: `CAPTURE-${Date.now()}`,
        title: `Capture: ${person.firstName} ${person.lastName}`,
        description: `Wanted person captured at ${location}`,
        status: 'OPEN',
        caseType: 'WANTED_PERSON_CAPTURE',
        createdById: userId,
        createdByUser: { connect: { id: userId } },
      },
    })

    await logAudit({
      userId,
      userRole: 'SYSTEM',
      action: 'CAPTURE',
      resourceType: 'WantedPerson',
      resourceId: id,
      changes: { captured: true, location, caseId: case_.id },
    })

    return { person: updated, case: case_ }
  }

  async issueInternationalNotice(id: string, noticeType: string, userId: string) {
    const person = await wantedPersonRepository.findById(id)
    if (!person) throw new Error('Wanted person not found')

    const updated = await wantedPersonRepository.issueInternationalNotice(id, noticeType)

    await logAudit({
      userId,
      userRole: 'SYSTEM',
      action: 'ISSUE_NOTICE',
      resourceType: 'WantedPerson',
      resourceId: id,
      changes: { internationalNotice: noticeType },
    })

    return updated
  }

  async getWantedPersonStatistics() {
    return wantedPersonRepository.getStatistics()
  }

  async getCriticalWantedPersons() {
    return wantedPersonRepository.findBySeverity('CRITICAL')
  }

  private async generateWantedNumber(): Promise<string> {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.random().toString(36).substring(2, 7).toUpperCase()
    return `WP-${timestamp}-${random}`
  }
}

export const wantedPersonsService = new WantedPersonsService()
