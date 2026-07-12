export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { wantedPersonsService } from '@/lib/services/wanted-persons.service'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const stats = await wantedPersonsService.getWantedPersonStatistics()
    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
