import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile with resolved hierarchy context.
 * Uses centralized getAuthenticatedUser() from lib/auth for JWT verification.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName || user.username,
        hierarchyEntityId: null,
        hierarchyNodeName: user.fullName || user.username,
        hierarchyNodeType: 'OFFICER',
        badgeNumber: user.badgeNumber || null,
        rank: user.rank || null,
        userType: user.role,
      },
    })
  } catch (error) {
    console.error('Auth Me Error:', error)
    return NextResponse.json({ error: 'حدث خطأ داخلي' }, { status: 500 })
  }
}
