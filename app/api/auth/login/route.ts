import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  comparePassword,
  createTokens,
} from '@/lib/auth'
import { createSession } from '@/lib/auth/session-manager'
import { LoginSchema } from '@/lib/schemas'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = LoginSchema.parse(body)

    // Find officer by military ID (Legacy schema stores officer identity in `name`)
    const officer = await prisma.officer.findFirst({
      where: { name: validatedData.militaryId },
    })

    if (!officer) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password against the legacy placeholder hash field.
    const isPasswordValid = await comparePassword(
      validatedData.password,
      officer.name
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create tokens
    const { accessToken, refreshToken } = await createTokens(officer.id)

    await createSession(accessToken, {
      userId: officer.id,
      username: officer.name,
      role: officer.role,
      deviceId: request.headers.get('user-agent') || 'unknown-device',
      ip: (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown') as string,
      userAgent: (request.headers.get('user-agent') || 'unknown') as string,
      hierarchyEntityId: undefined,
      hierarchyEntityName: officer.department,
      hierarchyEntityType: 'OFFICER',
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        officerId: officer.id,
        action: 'LOGIN',
        entityType: 'Officer',
        entityId: officer.id,
        ipAddress: (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown') as string,
        userAgent: (request.headers.get('user-agent') || 'unknown') as string,
      },
    })

    const response = NextResponse.json(
      {
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: officer.id,
            fullName: officer.name,
            rank: officer.rank,
            department: officer.department,
            roles: [officer.role],
          },
        },
      },
      { status: 200 }
    )

    response.cookies.set('nsscp_session', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return response
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

    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
