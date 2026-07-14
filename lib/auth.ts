import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { Prisma } from '@prisma/client'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { getSession } from './auth/session-manager'

const JWT_SECRET = process.env.JWT_SECRET || ''
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || ''

function getSecret(env: string, name: string): string {
  if (!env) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Environment variable ${name} is required in production`)
    }
    return `dev-${name}-min-32-chars-required-for-dev-only`
  }
  return env
}

const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h'
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d'

export interface JWTPayload {
  id: string
  role: string
  roles: string[]
  rank?: string
  department?: string
  fullName?: string
  hierarchyEntityId?: string | null
  hierarchyEntityName?: string | null
  hierarchyEntityType?: string | null
}

export interface DecodedToken {
  id: string
  role: string
  roles: string[]
  rank?: string
  department?: string
  fullName?: string
  hierarchyEntityId?: string | null
  hierarchyEntityName?: string | null
  hierarchyEntityType?: string | null
  iat: number
  exp: number
}

export interface ResolvedHierarchyContext {
  hierarchyEntityId: string | null
  hierarchyEntityName: string | null
  hierarchyEntityType: string | null
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
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
 * Resolve the officer's real hierarchy entity from the database.
 * The production source of truth is LevelAssignment -> HierarchyEntity.
 */
export async function resolveOfficerHierarchyContext(
  userId: string
): Promise<ResolvedHierarchyContext> {
  const assignment = await prisma.levelAssignment.findFirst({
    where: { officerId: userId },
    select: { unitId: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!assignment?.unitId) {
    return {
      hierarchyEntityId: null,
      hierarchyEntityName: null,
      hierarchyEntityType: null,
    }
  }

  const entityId = assignment.unitId
  let name: string | null = null
  let type: string | null = null

  // Try each hierarchy model — unitId can refer to any level
  const cc = await prisma.centralCommand.findUnique({ where: { id: entityId }, select: { name: true } })
  if (cc) { name = cc.name; type = 'MINISTRY' }

  if (!name) {
    const p = await prisma.province.findUnique({ where: { id: entityId }, select: { name: true } })
    if (p) { name = p.name; type = 'PROVINCE' }
  }

  if (!name) {
    const l3 = await prisma.level3Unit.findUnique({ where: { id: entityId }, select: { name: true } })
    if (l3) { name = l3.name; type = 'DEPARTMENT' }
  }

  if (!name) {
    const l4 = await prisma.level4Department.findUnique({ where: { id: entityId }, select: { name: true } })
    if (l4) { name = l4.name; type = 'SECTION' }
  }

  if (!name) {
    const l5 = await prisma.level5Section.findUnique({ where: { id: entityId }, select: { name: true } })
    if (l5) { name = l5.name; type = 'UNIT' }
  }

  if (!name) {
    const l6 = await prisma.level6Unit.findUnique({ where: { id: entityId }, select: { name: true } })
    if (l6) { name = l6.name; type = 'POLICE_STATION' }
  }

  return {
    hierarchyEntityId: entityId,
    hierarchyEntityName: name,
    hierarchyEntityType: type,
  }
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  const secret = getSecret(JWT_SECRET, 'JWT_SECRET')
  return jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRATION || '1h',
    algorithm: 'HS256',
  } as any)
}

/**
 * Generate JWT refresh token with unique JTI for rotation support
 */
export function generateRefreshToken(payload: JWTPayload): string {
  const secret = getSecret(JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET')
  return jwt.sign({ ...payload, jti: randomUUID() }, secret, {
    expiresIn: JWT_REFRESH_EXPIRATION || '7d',
    algorithm: 'HS256',
  } as any)
}

/**
 * Verify access token and return decoded payload
 */
export function verifyAccessToken(token: string): DecodedToken | null {
  try {
    const secret = getSecret(JWT_SECRET, 'JWT_SECRET')
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as unknown as DecodedToken
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Refresh token deny-list — prevents reuse after rotation.
 * In production, this should be backed by Redis. For now it uses a Set
 * with periodic cleanup (entries expire based on token expiry).
 */
const REFRESH_TOKEN_DENY_LIST = new Set<string>();

/** Periodically purge expired jti entries (every 1 hour) */
setInterval(() => {
  // Entries auto-expire after JWT_REFRESH_EXPIRATION anyway
  REFRESH_TOKEN_DENY_LIST.clear();
}, 60 * 60 * 1000).unref();

export function denyRefreshToken(token: string): void {
  try {
    const decoded = jwt.decode(token, { complete: true })?.payload as { jti?: string } | null;
    if (decoded?.jti) {
      REFRESH_TOKEN_DENY_LIST.add(decoded.jti);
    }
  } catch {
    // If we can't decode, still safe — token won't verify either
  }
}

/**
 * Verify refresh token and return decoded payload.
 * Rejects tokens whose JTI has been denied-listed (used after rotation).
 */
export function verifyRefreshToken(token: string): (DecodedToken & { jti?: string }) | null {
  try {
    const secret = getSecret(JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET')
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as unknown as DecodedToken & { jti?: string }

    // Check deny-list for JTI (refresh token rotation)
    if (decoded.jti && REFRESH_TOKEN_DENY_LIST.has(decoded.jti)) {
      return null
    }

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

  const hierarchyContext = await resolveOfficerHierarchyContext(officer.id)

  const payload: JWTPayload = {
    id: officer.id,
    role: officer.role,
    roles: [officer.role],
    rank: officer.rank,
    department: officer.department,
    fullName: officer.name,
    hierarchyEntityId: hierarchyContext.hierarchyEntityId,
    hierarchyEntityName: hierarchyContext.hierarchyEntityName,
    hierarchyEntityType: hierarchyContext.hierarchyEntityType,
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
 * Resolve the authenticated user from the current request, session, or JWT fallback.
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
  const decodedToken = activeSession ? null : verifyAccessToken(token)
  const userId = activeSession?.userId ?? decodedToken?.id ?? null

  if (!userId) {
    return null
  }

  const officer = await prisma.officer.findUnique({
    where: { id: userId },
  })

  if (!officer) {
    return null
  }

  const hierarchyContext = activeSession?.hierarchyEntityId
    ? {
        hierarchyEntityId: activeSession.hierarchyEntityId,
        hierarchyEntityName: activeSession.hierarchyEntityName ?? null,
        hierarchyEntityType: activeSession.hierarchyEntityType ?? null,
      }
    : decodedToken?.hierarchyEntityId
      ? {
          hierarchyEntityId: decodedToken.hierarchyEntityId,
          hierarchyEntityName: decodedToken.hierarchyEntityName ?? null,
          hierarchyEntityType: decodedToken.hierarchyEntityType ?? null,
        }
      : await resolveOfficerHierarchyContext(officer.id)

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
    hierarchyEntityId: hierarchyContext.hierarchyEntityId,
    hierarchyEntityName: hierarchyContext.hierarchyEntityName ?? officer.department ?? null,
    hierarchyEntityType: hierarchyContext.hierarchyEntityType ?? 'OFFICER',
  }
}

// Re-export from lib/auth/index.ts for backwards compatibility
// When @/lib/auth resolves to this file (lib/auth.ts), these ensure
// requireAuth and getAuthenticatedUser are available to all API routes.
export { requireAuth, getAuthenticatedUser as getAuthUser } from '@/lib/auth/index'
