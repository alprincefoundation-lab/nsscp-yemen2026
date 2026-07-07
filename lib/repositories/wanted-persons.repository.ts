import { prisma } from '@/lib/prisma'
import { Prisma, WantedPerson } from '@prisma/client'

export class WantedPersonRepository {
  async create(data: Prisma.WantedPersonCreateInput): Promise<WantedPerson> {
    return prisma.wantedPerson.create({ data })
  }

  async findById(id: string): Promise<WantedPerson | null> {
    return prisma.wantedPerson.findUnique({
      where: { id },
    })
  }

  async findByNumber(wantedNumber: string): Promise<WantedPerson | null> {
    return prisma.wantedPerson.findUnique({
      where: { wantedNumber },
    })
  }

  async findAll(filters?: {
    status?: string
    severity?: string
    domesticStatus?: string
    internationalNotice?: string
    skip?: number
    take?: number
  }): Promise<{ data: WantedPerson[]; total: number }> {
    const where: Prisma.WantedPersonWhereInput = {
      isDeleted: false,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.severity && { severity: filters.severity }),
      ...(filters?.domesticStatus && { domesticStatus: filters.domesticStatus }),
      ...(filters?.internationalNotice && {
        internationalNotice: filters.internationalNotice,
      }),
    }

    const [data, total] = await Promise.all([
      prisma.wantedPerson.findMany({
        where,
        skip: filters?.skip || 0,
        take: filters?.take || 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.wantedPerson.count({ where }),
    ])

    return { data, total }
  }

  async search(query: string): Promise<WantedPerson[]> {
    return prisma.wantedPerson.findMany({
      where: {
        isDeleted: false,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { wantedNumber: { contains: query, mode: 'insensitive' } },
          { nationalId: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    })
  }

  async update(
    id: string,
    data: Prisma.WantedPersonUpdateInput
  ): Promise<WantedPerson> {
    return prisma.wantedPerson.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.wantedPerson.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    })
  }

  async findBySeverity(severity: string): Promise<WantedPerson[]> {
    return prisma.wantedPerson.findMany({
      where: { severity, isDeleted: false, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByInternationalNotice(notice: string): Promise<WantedPerson[]> {
    return prisma.wantedPerson.findMany({
      where: {
        internationalNotice: notice,
        isDeleted: false,
      },
    })
  }

  async updateStatus(id: string, status: string): Promise<WantedPerson> {
    return prisma.wantedPerson.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    })
  }

  async issueInternationalNotice(
    id: string,
    noticeType: string
  ): Promise<WantedPerson> {
    return prisma.wantedPerson.update({
      where: { id },
      data: {
        internationalNotice: noticeType,
        updatedAt: new Date(),
      },
    })
  }

  async updateLastSeen(
    id: string,
    location: string,
    date: Date
  ): Promise<WantedPerson> {
    return prisma.wantedPerson.update({
      where: { id },
      data: {
        lastSeenLocation: location,
        lastSeenDate: date,
        updatedAt: new Date(),
      },
    })
  }

  async getStatistics(): Promise<{
    total: number
    active: number
    captured: number
    deceased: number
    critical: number
    withInternationalNotice: number
  }> {
    const [total, active, captured, deceased, critical, international] =
      await Promise.all([
        prisma.wantedPerson.count({ where: { isDeleted: false } }),
        prisma.wantedPerson.count({
          where: { isDeleted: false, status: 'ACTIVE' },
        }),
        prisma.wantedPerson.count({
          where: { isDeleted: false, domesticStatus: 'CAPTURED' },
        }),
        prisma.wantedPerson.count({
          where: { isDeleted: false, domesticStatus: 'DECEASED' },
        }),
        prisma.wantedPerson.count({
          where: { isDeleted: false, severity: 'CRITICAL' },
        }),
        prisma.wantedPerson.count({
          where: { isDeleted: false, internationalNotice: { not: null } },
        }),
      ])

    return { total, active, captured, deceased, critical, withInternationalNotice: international }
  }
}

export const wantedPersonRepository = new WantedPersonRepository()
