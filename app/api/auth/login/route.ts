import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  comparePassword,
  createTokens,
} from '@/lib/auth'
import { LoginSchema } from '@/lib/schemas'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = LoginSchema.parse(body)

    // Find user by military ID
    const user = await prisma.user.findUnique({
      where: { militaryId: validatedData.militaryId },
      include: {
        roles: true,
        department: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid military ID or password' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'User account is inactive' },
        { status: 403 }
      )
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.passwordHash
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid military ID or password' },
        { status: 401 }
      )
    }

    // Create tokens
    const { accessToken, refreshToken } = await createTokens(user.id)

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userRole: user.roles[0]?.name || 'USER',
        action: 'LOGIN',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress: (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown') as string,
        userAgent: (request.headers.get('user-agent') || 'unknown') as string,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            militaryId: user.militaryId,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            rank: user.rank,
            departmentId: user.departmentId,
            department: user.department,
            roles: user.roles.map((r: any) => r.name),
            clearanceLevel: user.clearanceLevel,
          },
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

    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
