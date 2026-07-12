export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { workflowService } from '@/lib/services/workflow.service'
import { getAuthenticatedUser } from '@/lib/auth'
import { transitionRequestSchema } from '@/lib/schemas/workflow.schema'
import { canPerformAction } from '@/lib/access-control/workflow.ac'

export async function POST(request: NextRequest) {
  try {
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validated = transitionRequestSchema.parse(body)

    // Check permission
    if (!canPerformAction(decoded.roles[0] || decoded.role || 'USER', validated.workflowType, 'initiate')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const result = await workflowService.transitionEntity(
      validated.entityId,
      validated.workflowType,
      validated.fromState,
      validated.toState,
      decoded.id,
      decoded.roles[0] || decoded.role || 'USER',
      validated.userDepartment,
      validated.reason
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const workflowType = searchParams.get('workflowType')

    if (!workflowType) {
      return NextResponse.json({ error: 'workflowType required' }, { status: 400 })
    }

    const stats = await workflowService.getWorkflowStats(workflowType)
    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
