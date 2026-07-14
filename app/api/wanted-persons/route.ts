export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { wantedPersonsService } from '@/lib/services/wanted-persons.service'
import { requireAuth } from '@/lib/auth'
import { getHierarchyScope } from '@/lib/hierarchy/data-scope'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const scope = await getHierarchyScope(auth)

    const body = await request.json()
    const person = await wantedPersonsService.createWantedPerson(body, auth.id)

    return NextResponse.json(person, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const scope = await getHierarchyScope(auth)

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const skip = parseInt(searchParams.get('skip') || '0')
    const take = parseInt(searchParams.get('take') || '50')
    const departmentId = searchParams.get('departmentId')

    // Validate client-supplied departmentId against scope
    if (departmentId && scope.allowedEntityIds.length > 0 && !scope.allowedEntityIds.includes(departmentId)) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذا النطاق' },
        { status: 403 }
      )
    }

    if (query) {
      const results = await wantedPersonsService.searchWantedPersons(query)
      return NextResponse.json(results)
    }

    const result = await wantedPersonsService.listWantedPersons({
      status: status || undefined,
      dangerLevel: severity || undefined,
      departmentIds: scope.allowedEntityIds.length > 0 ? scope.allowedEntityIds : undefined,
      skip,
      take,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
