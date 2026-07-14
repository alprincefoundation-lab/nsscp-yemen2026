import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  comparePassword,
  createTokens,
  resolveOfficerHierarchyContext,
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
      select: {
        id: true,
        name: true,
        rank: true,
        role: true,
        department: true,
        passwordHash: true,
      },
    })

    if (!officer) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!officer.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password against the stored bcrypt hash.
    const isPasswordValid = await comparePassword(
      validatedData.password,
      officer.passwordHash
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create tokens
    const { accessToken, refreshToken } = await createTokens(officer.id)
    const hierarchyContext = await resolveOfficerHierarchyContext(officer.id)

    await createSession(accessToken, {
      userId: officer.id,
      username: officer.name,
      role: officer.role,
      deviceId: request.headers.get('user-agent') || 'unknown-device',
      ip: (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown') as string,
      userAgent: (request.headers.get('user-agent') || 'unknown') as string,
      hierarchyEntityId: hierarchyContext.hierarchyEntityId ?? undefined,
      hierarchyEntityName: hierarchyContext.hierarchyEntityName ?? officer.department,
      hierarchyEntityType: hierarchyContext.hierarchyEntityType ?? 'OFFICER',
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
            hierarchyEntityId: hierarchyContext.hierarchyEntityId,
            hierarchyEntityName: hierarchyContext.hierarchyEntityName ?? officer.department,
            hierarchyEntityType: hierarchyContext.hierarchyEntityType ?? 'OFFICER',
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
