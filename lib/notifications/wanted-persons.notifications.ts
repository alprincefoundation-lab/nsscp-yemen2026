import { prisma } from '@/lib/prisma'

export class WantedPersonsNotifications {
  static async notifyPublishApproval(wantedPersonId: string, approvedBy: string) {
    const person = await prisma.wantedPerson.findUnique({ where: { id: wantedPersonId } })
    
    return {
      type: 'WANTED_PERSON_APPROVED',
      title: `Wanted person "${person?.name}" approved for publication`,
      recipients: ['SUPERVISOR', 'INTERPOL_OFFICER'],
      data: { wantedPersonId, approvedBy },
    }
  }

  static async notifyCapture(wantedPersonId: string, capturedBy: string) {
    const person = await prisma.wantedPerson.findUnique({ where: { id: wantedPersonId } })
    
    return {
      type: 'WANTED_PERSON_CAPTURED',
      title: `ALERT: ${person?.name} has been captured!`,
      priority: 'HIGH',
      recipients: ['ALL_INVESTIGATORS', 'SUPERVISORS', 'ADMIN'],
      data: { wantedPersonId, capturedBy, timestamp: new Date() },
    }
  }

  static async notifyInternationalNotice(wantedPersonId: string) {
    const person = await prisma.wantedPerson.findUnique({ where: { id: wantedPersonId } })
    
    return {
      type: 'INTERNATIONAL_NOTICE_PUBLISHED',
      title: `International notice published for ${person?.name}`,
      recipients: ['INTERPOL_OFFICER', 'SUPERVISOR', 'ADMIN'],
      data: { wantedPersonId, publishedAt: new Date() },
    }
  }

  static async notifyStatusChange(wantedPersonId: string, oldStatus: string, newStatus: string) {
    const person = await prisma.wantedPerson.findUnique({ where: { id: wantedPersonId } })
    
    return {
      type: 'WANTED_PERSON_STATUS_CHANGED',
      title: `${person?.name} status changed from ${oldStatus} to ${newStatus}`,
      recipients: ['INVESTIGATOR', 'SUPERVISOR', 'ADMIN'],
      data: { wantedPersonId, oldStatus, newStatus },
    }
  }
}
