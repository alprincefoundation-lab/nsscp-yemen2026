export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { WantedPersonsSearch } from '@/lib/search/wanted-persons.search'
import { verifyAccessToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyAccessToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const results = await WantedPersonsSearch.advancedSearch(body)

    return NextResponse.json({
      count: results.length,
      results,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyAccessToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const query = request.nextUrl.searchParams.get('q') || ''
    const severity = request.nextUrl.searchParams.get('severity')
    const status = request.nextUrl.searchParams.get('status')

    const filters = {
      severity: severity || undefined,
      status: status || undefined,
    }

    const results = await WantedPersonsSearch.search(query, filters)

    return NextResponse.json({
      count: results.length,
      results,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
