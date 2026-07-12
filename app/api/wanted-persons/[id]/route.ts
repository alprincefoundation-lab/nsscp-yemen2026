export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { wantedPersonsService } from '@/lib/services/wanted-persons.service'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const person = await wantedPersonsService.getWantedPerson(id)
    if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Include related records
    const details = await wantedPersonsService.getWantedPersonDetails(id)

    return NextResponse.json(details)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const person = await wantedPersonsService.updateWantedPerson(id, body, decoded.id)

    return NextResponse.json(person)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const person = await wantedPersonsService.getWantedPerson(id)
    if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Soft delete by updating status
    await wantedPersonsService.updateWantedPerson(id, { status: 'ARCHIVED' }, decoded.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
