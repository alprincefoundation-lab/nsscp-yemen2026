export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { WantedPersonsReports } from '@/lib/reports/wanted-persons.reports'
import { verifyAccessToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyAccessToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const months = parseInt(request.nextUrl.searchParams.get('months') || '6')
    const report = await WantedPersonsReports.generateCaptureReport(months)
    return NextResponse.json(report)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
