import { prisma } from '@/lib/prisma'

export class WantedPersonsNotifications {
  static async notifyPublishApproval(wantedPersonId: number, approvedBy: string) {
    const person = await prisma.wantedPerson.findUnique({ where: { id: wantedPersonId } })
    
    return {
      type: 'WANTED_PERSON_APPROVED',
      title: `Wanted person "${person?.fullName}" approved for publication`,
      recipients: ['SUPERVISOR', 'INTERPOL_OFFICER'],
      data: { wantedPersonId, approvedBy },
    }
  }

  static async notifyCapture(wantedPersonId: number, capturedBy: string) {
    const person = await prisma.wantedPerson.findUnique({ where: { id: wantedPersonId } })
    
    return {
      type: 'WANTED_PERSON_CAPTURED',
      title: `ALERT: ${person?.fullName} has been captured!`,
      priority: 'HIGH',
      recipients: ['ALL_INVESTIGATORS', 'SUPERVISORS', 'ADMIN'],
      data: { wantedPersonId, capturedBy, timestamp: new Date() },
    }
  }

  static async notifyInternationalNotice(wantedPersonId: number) {
    const person = await prisma.wantedPerson.findUnique({ where: { id: wantedPersonId } })
    
    return {
      type: 'INTERNATIONAL_NOTICE_PUBLISHED',
      title: `International notice published for ${person?.fullName}`,
      recipients: ['INTERPOL_OFFICER', 'SUPERVISOR', 'ADMIN'],
      data: { wantedPersonId, publishedAt: new Date() },
    }
  }

  static async notifyStatusChange(wantedPersonId: number, oldStatus: string, newStatus: string) {
    const person = await prisma.wantedPerson.findUnique({ where: { id: wantedPersonId } })
    
    return {
      type: 'WANTED_PERSON_STATUS_CHANGED',
      title: `${person?.fullName} status changed from ${oldStatus} to ${newStatus}`,
      recipients: ['INVESTIGATOR', 'SUPERVISOR', 'ADMIN'],
      data: { wantedPersonId, oldStatus, newStatus },
    }
  }
}
