export const dynamic = "force-dynamic"

/**
 * Workflow Approvals API
 * GET /api/workflows/approvals - Get pending approvals
 * POST /api/workflows/approvals/:id/approve - Approve transition
 * POST /api/workflows/approvals/:id/reject - Reject transition
 */

import { NextRequest, NextResponse } from 'next/server'
import { workflowTransitionsService } from '@/lib/workflow/transitions'

/**
 * GET - Get pending approvals for a user role
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const requiredRole = searchParams.get('requiredRole')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!requiredRole) {
      return NextResponse.json(
        { error: 'requiredRole parameter required' },
        { status: 400 }
      )
    }

    // Get pending approvals
    const approvals = await workflowTransitionsService.getPendingApprovals(
      requiredRole,
      limit
    )

    return NextResponse.json(
      {
        success: true,
        approvals,
        count: approvals.length
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get approvals error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Approve or reject approval request
 * Body: { action: 'approve' | 'reject', approvedBy: string, comment?: string, rejectionReason?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const pathParts = request.nextUrl.pathname.split('/')
    const approvalId = pathParts[pathParts.length - 2]

    const {
      action,
      approvedBy,
      comment,
      rejectionReason
    } = body

    if (!action || !approvedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: action, approvedBy' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      const result = await workflowTransitionsService.approveTransition(
        approvalId,
        approvedBy,
        comment
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
          approval: result.approval,
          message: 'Approval granted successfully'
        },
        { status: 200 }
      )
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'rejectionReason required for rejection' },
          { status: 400 }
        )
      }

      const result = await workflowTransitionsService.rejectTransition(
        approvalId,
        approvedBy,
        rejectionReason
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
          approval: result.approval,
          message: 'Transition rejected successfully'
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve or reject' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Approval action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
