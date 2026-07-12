import { prisma } from '@/lib/prisma'

export class WantedPersonsReports {
  static async generateSummaryReport(startDate: Date, endDate: Date) {
    const totalWanted = await prisma.wantedPerson.count()
    const captured = await prisma.wantedPerson.count({ where: { status: 'مقبوض عليه' } })
    const active = await prisma.wantedPerson.count({ where: { status: 'مطلوب حياً' } })

    const bySeverity = await prisma.wantedPerson.groupBy({
      by: ['dangerLevel'],
      _count: { id: true },
    })

    return {
      period: { startDate, endDate },
      statistics: {
        totalWanted,
        captured,
        active,
        captureRate: (captured / totalWanted) * 100,
      },
      bySeverity: bySeverity.map((s) => ({ severity: s.dangerLevel, count: s._count.id })),
    }
  }

  static async generateCaptureReport(monthsBack: number = 6) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - monthsBack)

    const captures = await prisma.wantedPerson.findMany({
      where: {
        status: 'مقبوض عليه',
        createdAt: { gte: startDate },
      },
      include: { Circular: true, WantedAttachment: true },
      orderBy: { createdAt: 'desc' },
    })

    return {
      period: `Last ${monthsBack} months`,
      totalCaptures: captures.length,
      byMonth: this.groupCapturesByMonth(captures),
      topOfficers: this.getTopCapturingOfficers(captures),
    }
  }

  private static groupCapturesByMonth(captures: any[]) {
    const grouped: any = {}
    captures.forEach(c => {
      const month = c.createdAt.toISOString().substring(0, 7)
      grouped[month] = (grouped[month] || 0) + 1
    })
    return grouped
  }

  private static getTopCapturingOfficers(captures: any[]) {
    const officers: any = {}
    captures.forEach(c => {
      officers[c.issuingAuthority ?? 'UNKNOWN'] =
        (officers[c.issuingAuthority ?? 'UNKNOWN'] || 0) + 1
    })
    return Object.entries(officers)
      .map(([officer, count]) => ({ officer, captures: count }))
      .sort((a: any, b: any) => b.captures - a.captures)
      .slice(0, 5)
  }

  static async generateInternationalNoticeReport() {
    const notices = await prisma.circular.findMany({
      where: { type: { contains: 'NOTICE', mode: 'insensitive' } },
      include: { wantedPerson: true },
      orderBy: { issuedDate: 'desc' },
    })

    return {
      totalNotices: notices.length,
      byType: this.groupNoticesByType(notices),
      recentNotices: notices.slice(0, 10),
    }
  }

  private static groupNoticesByType(notices: any[]) {
    const grouped: any = {}
    notices.forEach(n => {
      grouped[n.type] = (grouped[n.type] || 0) + 1
    })
    return grouped
  }
}
