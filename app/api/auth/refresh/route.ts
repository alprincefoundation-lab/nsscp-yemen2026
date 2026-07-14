import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, denyRefreshToken, createTokens } from '@/lib/auth'
import { RefreshTokenSchema } from '@/lib/schemas'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = RefreshTokenSchema.parse(body)

    // Verify refresh token
    const decoded = verifyRefreshToken(validatedData.refreshToken)

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    // Deny old refresh token (rotation — prevents reuse)
    denyRefreshToken(validatedData.refreshToken)

    // Create new tokens
    const { accessToken, refreshToken } = await createTokens(decoded.id)

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken,
          refreshToken,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('[v0] Refresh token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
