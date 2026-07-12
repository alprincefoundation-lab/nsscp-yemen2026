import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { getSession } from './auth/session-manager'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-min-32-chars-required'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-min-32-chars'
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h'
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d'

export interface JWTPayload {
  id: string
  role: string
  roles: string[]
  rank?: string
  department?: string
  fullName?: string
}

export interface DecodedToken {
  id: string
  role: string
  roles: string[]
  rank?: string
  department?: string
  fullName?: string
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
  const officer = await prisma.officer.findUnique({
    where: { id: userId },
  })

  if (!officer) {
    throw new Error('Officer not found')
  }

  const payload: JWTPayload = {
    id: officer.id,
    role: officer.role,
    roles: [officer.role],
    rank: officer.rank,
    department: officer.department,
    fullName: officer.name,
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
  const officer = await prisma.officer.findUnique({
    where: { id: userId },
  })

  if (!officer) {
    return false
  }

  if (officer.role === 'SUPER_ADMIN') {
    return true
  }

  const privilegedRoles = new Set(['GOVERNORATE_ADMIN', 'DEPARTMENT_MANAGER', 'SECTION_MANAGER'])
  if (!privilegedRoles.has(officer.role)) {
    return action === 'READ'
  }

  return action !== 'DELETE' || resource === 'AuditLog'
}

/**
 * Get user with all roles and permissions
 */
export async function getUserWithPermissions(userId: string) {
  const officer = await prisma.officer.findUnique({
    where: { id: userId },
  })

  if (!officer) {
    return null
  }

  return {
    id: officer.id,
    username: officer.name,
    role: officer.role,
    roles: [{ name: officer.role, permissions: [] as never[] }],
    permissions: [] as never[],
  }
}

/**
 * Get authenticated user from request (Mock for now to fix build)
 */
export async function getAuthenticatedUser(req?: any) {
  const authHeader = req?.headers?.get?.('authorization') ?? null
  let token = extractTokenFromHeader(authHeader)

  if (!token) {
    token = req?.cookies?.get?.('nsscp_session')?.value ?? null
  }

  if (!token) {
    try {
      token = (await cookies()).get('nsscp_session')?.value ?? null
    } catch {
      token = null
    }
  }

  if (!token) return null

  const activeSession = await getSession(token)
  if (!activeSession) {
    return null
  }

  const officer = await prisma.officer.findUnique({
    where: { id: activeSession.userId },
  })

  if (!officer) {
    return null
  }

  return {
    id: officer.id,
    username: officer.name,
    role: officer.role,
    roles: [officer.role],
    badgeNumber: officer.id,
    rank: officer.rank,
    fullName: officer.name,
    departmentId: null,
    department: officer.department ? { nameAr: officer.department } : null,
    hierarchyEntityId: activeSession.hierarchyEntityId ?? null,
    hierarchyEntityName: officer.department || null,
    hierarchyEntityType: activeSession.hierarchyEntityType ?? 'OFFICER',
  }
}
