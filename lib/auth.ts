import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-min-32-chars-required'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-min-32-chars'
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h'
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d'

export interface JWTPayload {
  id: string
  email: string
  militaryId: string
  roles: string[]
}

export interface DecodedToken {
  id: string
  email: string
  militaryId: string
  roles: string[]
  iat: number
  exp: number
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Compare a plain password with a hashed password
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  const secret = JWT_SECRET || 'secret'
  return jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRATION || '1h',
    algorithm: 'HS256',
  } as any)
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  const secret = JWT_REFRESH_SECRET || 'refresh-secret'
  return jwt.sign(payload, secret, {
    expiresIn: JWT_REFRESH_EXPIRATION || '7d',
    algorithm: 'HS256',
  } as any)
}

/**
 * Verify access token and return decoded payload
 */
export function verifyAccessToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as DecodedToken
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Verify refresh token and return decoded payload
 */
export function verifyRefreshToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    }) as DecodedToken
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Create tokens for a user
 */
export async function createTokens(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
    militaryId: user.militaryId,
    roles: user.roles.map((r) => r.name),
  }

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null
  }

  return parts[1]
}

/**
 * Verify user has required permission
 */
export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          permissions: true,
        },
      },
      permissions: true,
    },
  })

  if (!user) {
    return false
  }

  // Check direct user permissions
  if (
    user.permissions.some((p) => p.resource === resource && p.action === action)
  ) {
    return true
  }

  // Check role permissions
  for (const role of user.roles) {
    if (
      role.permissions.some((p) => p.resource === resource && p.action === action)
    ) {
      return true
    }
  }

  return false
}

/**
 * Get user with all roles and permissions
 */
export async function getUserWithPermissions(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          permissions: true,
        },
      },
      permissions: true,
    },
  })
}

/**
 * Get authenticated user from request (Mock for now to fix build)
 */
export async function getAuthenticatedUser(req: any) {
  // In a real scenario, this would verify the JWT from headers
  // For now, we return a system user or throw unauthorized to allow build to proceed
  const authHeader = req.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader)
  if (!token) return null
  
  const decoded = verifyAccessToken(token)
  if (!decoded) return null
  
  return prisma.user.findUnique({
    where: { id: decoded.id },
    include: {
      roles: true,
      department: true
    }
  })
}
