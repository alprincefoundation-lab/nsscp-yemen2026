import { prisma } from '@/lib/prisma'

export class WantedPersonsReports {
  static async generateSummaryReport(startDate: Date, endDate: Date) {
    const totalWanted = await prisma.wantedPerson.count()
    const captured = await prisma.wantedPerson.count({ where: { status: 'CAPTURED' } })
    const active = await prisma.wantedPerson.count({ where: { status: 'ACTIVE' } })
    
    const bySeverity = await prisma.wantedPerson.groupBy({
      by: ['severity'],
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
      bySeverity: bySeverity.map(s => ({ severity: s.severity, count: s._count.id })),
    }
  }

  static async generateCaptureReport(monthsBack: number = 6) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - monthsBack)

    const captures = await prisma.captureRecord.findMany({
      where: { captureDate: { gte: startDate } },
      include: { wantedPerson: true },
      orderBy: { captureDate: 'desc' },
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
      const month = c.captureDate.toISOString().substring(0, 7)
      grouped[month] = (grouped[month] || 0) + 1
    })
    return grouped
  }

  private static getTopCapturingOfficers(captures: any[]) {
    const officers: any = {}
    captures.forEach(c => {
      officers[c.capturedBy] = (officers[c.capturedBy] || 0) + 1
    })
    return Object.entries(officers)
      .map(([officer, count]) => ({ officer, captures: count }))
      .sort((a: any, b: any) => b.captures - a.captures)
      .slice(0, 5)
  }

  static async generateInternationalNoticeReport() {
    const notices = await prisma.internationalNotice.findMany({
      include: { wantedPerson: true },
      orderBy: { publishDate: 'desc' },
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
      grouped[n.noticeType] = (grouped[n.noticeType] || 0) + 1
    })
    return grouped
  }
}
