import { prisma } from '@/lib/prisma'
import { Prisma, WantedPerson } from '@prisma/client'

export class WantedPersonRepository {
  async create(data: Prisma.WantedPersonCreateInput): Promise<WantedPerson> {
    return prisma.wantedPerson.create({ data })
  }

  private normalizeId(id: string | number): number {
    const numericId = typeof id === 'number' ? id : Number(id)
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new Error('Invalid wanted person id')
    }
    return numericId
  }

  async findById(id: string | number): Promise<WantedPerson | null> {
    return prisma.wantedPerson.findUnique({
      where: { id: this.normalizeId(id) },
      include: {
        WantedAttachment: true,
        Circular: true,
      },
    })
  }

  async findByIdentityNumber(identityNumber: string): Promise<WantedPerson | null> {
    return prisma.wantedPerson.findUnique({
      where: { identityNumber },
      include: {
        WantedAttachment: true,
        Circular: true,
      },
    })
  }

  async findAll(filters?: {
    status?: string
    dangerLevel?: string
    query?: string
    skip?: number
    take?: number
  }): Promise<{ data: WantedPerson[]; total: number }> {
    const where: Prisma.WantedPersonWhereInput = {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.dangerLevel && { dangerLevel: filters.dangerLevel }),
      ...(filters?.query && {
        OR: [
          { fullName: { contains: filters.query, mode: 'insensitive' } },
          { identityNumber: { contains: filters.query, mode: 'insensitive' } },
          { nationality: { contains: filters.query, mode: 'insensitive' } },
          { chargeDetails: { contains: filters.query, mode: 'insensitive' } },
          { issuingProvince: { contains: filters.query, mode: 'insensitive' } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.wantedPerson.findMany({
        where,
        skip: filters?.skip || 0,
        take: filters?.take || 50,
        orderBy: { createdAt: 'desc' },
        include: {
          WantedAttachment: true,
          Circular: true,
        },
      }),
      prisma.wantedPerson.count({ where }),
    ])

    return { data, total }
  }

  async search(query: string): Promise<WantedPerson[]> {
    return prisma.wantedPerson.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { identityNumber: { contains: query, mode: 'insensitive' } },
          { nationality: { contains: query, mode: 'insensitive' } },
          { chargeDetails: { contains: query, mode: 'insensitive' } },
          { issuingProvince: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    })
  }

  async update(
    id: string,
    data: Prisma.WantedPersonUpdateInput
  ): Promise<WantedPerson> {
    return prisma.wantedPerson.update({
      where: { id: this.normalizeId(id) },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.wantedPerson.update({
      where: { id: this.normalizeId(id) },
      data: { status: 'ARCHIVED' },
    })
  }

  async findBySeverity(severity: string): Promise<WantedPerson[]> {
    const normalizedSeverities =
      severity === 'CRITICAL' ? ['CRITICAL', 'عالي جداً'] : [severity]

    return prisma.wantedPerson.findMany({
      where: { dangerLevel: { in: normalizedSeverities } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByInternationalNotice(notice: string): Promise<WantedPerson[]> {
    return prisma.wantedPerson.findMany({
      where: {
        Circular: {
          some: {
            type: notice,
          },
        },
      },
      include: {
        Circular: true,
      },
    })
  }

  async updateStatus(id: string, status: string): Promise<WantedPerson> {
    return prisma.wantedPerson.update({
      where: { id: this.normalizeId(id) },
      data: { status },
    })
  }

  async issueInternationalNotice(
    id: string,
    noticeType: string
  ): Promise<WantedPerson> {
    const wantedPersonId = this.normalizeId(id)
    await prisma.circular.upsert({
      where: {
        circularNumber: `NOTICE-${wantedPersonId}-${noticeType}`,
      },
      create: {
        circularNumber: `NOTICE-${wantedPersonId}-${noticeType}`,
        title: `International notice for wanted person ${wantedPersonId}`,
        description: `Generated notice of type ${noticeType}`,
        type: noticeType,
        priority: 'HIGH',
        status: 'ACTIVE',
        issuedDate: new Date(),
        issuingAuthority: 'NSSCP',
        wantedPersonId,
      },
      update: {
        title: `International notice for wanted person ${wantedPersonId}`,
        description: `Generated notice of type ${noticeType}`,
        type: noticeType,
        priority: 'HIGH',
        status: 'ACTIVE',
        issuedDate: new Date(),
        issuingAuthority: 'NSSCP',
        wantedPersonId,
      },
    })

    const wantedPerson = await this.findById(wantedPersonId)
    if (!wantedPerson) {
      throw new Error('Wanted person not found after notice creation')
    }

    return wantedPerson
  }

  async getStatistics(): Promise<{
    total: number
    active: number
    captured: number
    archived: number
    critical: number
    withInternationalNotice: number
  }> {
    const [total, active, captured, archived, critical, international] =
      await Promise.all([
        prisma.wantedPerson.count(),
        prisma.wantedPerson.count({
          where: { status: 'مطلوب حياً' },
        }),
        prisma.wantedPerson.count({
          where: { status: 'مقبوض عليه' },
        }),
        prisma.wantedPerson.count({
          where: { status: 'ARCHIVED' },
        }),
        prisma.wantedPerson.count({
          where: {
            dangerLevel: { in: ['CRITICAL', 'عالي جداً'] },
          },
        }),
        prisma.wantedPerson.count({
          where: {
            Circular: {
              some: {},
            },
          },
        }),
      ])

    return {
      total,
      active,
      captured,
      archived,
      critical,
      withInternationalNotice: international,
    }
  }
}

export const wantedPersonRepository = new WantedPersonRepository()
