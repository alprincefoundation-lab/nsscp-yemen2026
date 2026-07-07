import { prisma } from '@/lib/prisma'

export class WantedPersonsSearch {
  static async search(query: string, filters: any = {}) {
    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { physicalDescription: { contains: query, mode: 'insensitive' } },
        { charges: { contains: query, mode: 'insensitive' } },
      ],
    }

    if (filters.severity) where.severity = filters.severity
    if (filters.status) where.status = filters.status
    if (filters.nationality) where.nationality = filters.nationality
    if (filters.gender) where.gender = filters.gender

    return await prisma.wantedPerson.findMany({
      where,
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: filters.sortBy || { createdAt: 'desc' },
    })
  }

  static async advancedSearch(criteria: any) {
    const where: any = {}

    if (criteria.name) where.name = { contains: criteria.name, mode: 'insensitive' }
    if (criteria.severity) where.severity = criteria.severity
    if (criteria.status) where.status = criteria.status
    if (criteria.nationality) where.nationality = criteria.nationality
    if (criteria.dateOfBirthFrom || criteria.dateOfBirthTo) {
      where.dateOfBirth = {}
      if (criteria.dateOfBirthFrom) where.dateOfBirth.gte = criteria.dateOfBirthFrom
      if (criteria.dateOfBirthTo) where.dateOfBirth.lte = criteria.dateOfBirthTo
    }

    if (criteria.charges) where.charges = { contains: criteria.charges, mode: 'insensitive' }

    return await prisma.wantedPerson.findMany({
      where,
      include: { captures: true, notices: true },
    })
  }

  static async filterBySeverity(severity: string) {
    return await prisma.wantedPerson.findMany({
      where: { severity },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async filterByStatus(status: string) {
    return await prisma.wantedPerson.findMany({
      where: { status },
      orderBy: { updatedAt: 'desc' },
    })
  }
}
