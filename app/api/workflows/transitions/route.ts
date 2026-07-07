export const dynamic = "force-dynamic"

/**
 * Workflow Transitions API
 * POST /api/workflows/transitions - Request state transition
 * GET /api/workflows/transitions?entityId=... - Get transition history
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  WorkflowType,
  workflowStateMachine,
  TransitionContext
} from '@/lib/workflow/state-machine'
import { workflowTransitionsService } from '@/lib/workflow/transitions'

/**
 * POST - Request workflow state transition
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      entityId,
      workflowType,
      currentState,
      targetState,
      userId,
      userRole,
      userDepartment,
      reason,
      metadata
    } = body

    // Validate required fields
    if (!entityId || !workflowType || !currentState || !targetState || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate workflow type
    if (!Object.values(WorkflowType).includes(workflowType)) {
      return NextResponse.json(
        { error: 'Invalid workflow type' },
        { status: 400 }
      )
    }

    // Validate states
    if (!workflowStateMachine.isValidState(workflowType, currentState)) {
      return NextResponse.json(
        { error: `Invalid current state: ${currentState}` },
        { status: 400 }
      )
    }

    if (!workflowStateMachine.isValidState(workflowType, targetState)) {
      return NextResponse.json(
        { error: `Invalid target state: ${targetState}` },
        { status: 400 }
      )
    }

    // Create transition context
    const context: TransitionContext = {
      workflowType,
      entityId,
      userId,
      userRole: userRole || 'OFFICER',
      userDepartment: userDepartment || '',
      metadata: metadata || {},
      currentState,
      targetState,
      timestamp: new Date()
    }

    // Request transition
    const result = await workflowTransitionsService.requestTransition(
      context,
      reason
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        transition: result.transition,
        approval: result.approval,
        message: 'Transition requested successfully'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Workflow transition error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get workflow transition history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entityId = searchParams.get('entityId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!entityId) {
      return NextResponse.json(
        { error: 'entityId parameter required' },
        { status: 400 }
      )
    }

    // Get transition history
    const history = await workflowTransitionsService.getTransitionHistory(
      entityId,
      limit
    )

    // Get workflow status
    const status = await workflowTransitionsService.getWorkflowStatus(entityId)

    return NextResponse.json(
      {
        success: true,
        status,
        history,
        count: history.length
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get transitions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
