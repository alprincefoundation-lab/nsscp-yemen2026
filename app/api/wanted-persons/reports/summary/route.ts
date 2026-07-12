export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { WantedPersonsReports } from '@/lib/reports/wanted-persons.reports'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 6)

    const report = await WantedPersonsReports.generateSummaryReport(startDate, endDate)
    return NextResponse.json(report)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
