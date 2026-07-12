export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { wantedPersonsService } from '@/lib/services/wanted-persons.service'
import { getAuthenticatedUser } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { noticeType } = body

    if (!noticeType) {
      return NextResponse.json({ error: 'Notice type is required' }, { status: 400 })
    }

    const person = await wantedPersonsService.issueInternationalNotice(
      id,
      noticeType,
      decoded.id
    )

    return NextResponse.json(person)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
