import { prisma } from '@/lib/prisma'

export class WantedPersonsSearch {
  static async search(query: string, filters: any = {}) {
    const where: any = {
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { identityNumber: { contains: query, mode: 'insensitive' } },
        { nationality: { contains: query, mode: 'insensitive' } },
        { chargeDetails: { contains: query, mode: 'insensitive' } },
        { issuingProvince: { contains: query, mode: 'insensitive' } },
      ],
    }

    if (filters.severity) where.dangerLevel = filters.severity
    if (filters.status) where.status = filters.status
    if (filters.nationality) where.nationality = filters.nationality

    return await prisma.wantedPerson.findMany({
      where,
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: filters.sortBy || { createdAt: 'desc' },
    })
  }

  static async advancedSearch(criteria: any) {
    const where: any = {}

    if (criteria.name) where.fullName = { contains: criteria.name, mode: 'insensitive' }
    if (criteria.severity) where.dangerLevel = criteria.severity
    if (criteria.status) where.status = criteria.status
    if (criteria.nationality) where.nationality = criteria.nationality

    if (criteria.charges) {
      where.chargeDetails = { contains: criteria.charges, mode: 'insensitive' }
    }

    return await prisma.wantedPerson.findMany({
      where,
      include: { WantedAttachment: true, Circular: true },
    })
  }

  static async filterBySeverity(severity: string) {
    return await prisma.wantedPerson.findMany({
      where: { dangerLevel: severity },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async filterByStatus(status: string) {
    return await prisma.wantedPerson.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    })
  }
}
