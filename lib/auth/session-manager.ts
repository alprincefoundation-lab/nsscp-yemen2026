/**
 * Session Manager Module — NSSCP Platform
 *
 * Persistent session storage backed by Prisma/PostgreSQL.
 * The public API remains compatible with the legacy session manager,
 * but the implementation is now fully durable and restart-safe.
 */

import { prisma } from '@/lib/prisma';

const SESSION_TTL = 60 * 60 * 24; // 24 hours in seconds

export interface SessionData {
  userId: string;
  username: string;
  role: string;
  deviceId: string;
  ip: string;
  userAgent: string;
  hierarchyEntityId?: string;
  hierarchyEntityName?: string;
  hierarchyEntityType?: string;
  createdAt: number;
  lastActive: number;
  expiresAt: number;
  isValid: boolean;
}

export interface CreateSessionOptions {
  userId: string;
  username: string;
  role: string;
  deviceId: string;
  ip: string;
  userAgent: string;
  hierarchyEntityId?: string;
  hierarchyEntityName?: string;
  hierarchyEntityType?: string;
  ttl?: number;
}

function toSessionData(row: {
  officerId: string;
  username: string;
  role: string;
  deviceId: string;
  ip: string;
  userAgent: string;
  hierarchyEntityId: string | null;
  hierarchyEntityName: string | null;
  hierarchyEntityType: string | null;
  createdAt: Date;
  lastActive: Date;
  expiresAt: Date;
  isValid: boolean;
}): SessionData {
  return {
    userId: row.officerId,
    username: row.username,
    role: row.role,
    deviceId: row.deviceId,
    ip: row.ip,
    userAgent: row.userAgent,
    hierarchyEntityId: row.hierarchyEntityId ?? undefined,
    hierarchyEntityName: row.hierarchyEntityName ?? undefined,
    hierarchyEntityType: row.hierarchyEntityType ?? undefined,
    createdAt: row.createdAt.getTime(),
    lastActive: row.lastActive.getTime(),
    expiresAt: row.expiresAt.getTime(),
    isValid: row.isValid,
  };
}

async function getSessionRow(sessionId: string) {
  return prisma.authSession.findUnique({
    where: { id: sessionId },
  });
}

export async function createSession(sessionId: string, options: CreateSessionOptions): Promise<void> {
  const now = new Date();
  const ttl = options.ttl || SESSION_TTL;
  const expiresAt = new Date(now.getTime() + ttl * 1000);

  await prisma.authSession.upsert({
    where: { id: sessionId },
    update: {
      officerId: options.userId,
      username: options.username,
      role: options.role,
      deviceId: options.deviceId,
      ip: options.ip,
      userAgent: options.userAgent,
      hierarchyEntityId: options.hierarchyEntityId ?? null,
      hierarchyEntityName: options.hierarchyEntityName ?? null,
      hierarchyEntityType: options.hierarchyEntityType ?? null,
      isValid: true,
      lastActive: now,
      expiresAt,
    },
    create: {
      id: sessionId,
      officerId: options.userId,
      username: options.username,
      role: options.role,
      deviceId: options.deviceId,
      ip: options.ip,
      userAgent: options.userAgent,
      hierarchyEntityId: options.hierarchyEntityId ?? null,
      hierarchyEntityName: options.hierarchyEntityName ?? null,
      hierarchyEntityType: options.hierarchyEntityType ?? null,
      isValid: true,
      createdAt: now,
      lastActive: now,
      expiresAt,
    },
  });
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  try {
    const row = await getSessionRow(sessionId);
    if (!row) return null;

    if (!row.isValid || row.expiresAt.getTime() <= Date.now()) {
      await revokeSession(sessionId);
      return null;
    }

    return toSessionData(row);
  } catch (error) {
    console.error('❌ Failed to get session:', error);
    return null;
  }
}

export async function validateSession(sessionId: string): Promise<SessionData | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  try {
    await prisma.authSession.update({
      where: { id: sessionId },
      data: { lastActive: new Date() },
    });
    return session;
  } catch (error) {
    console.error('❌ Failed to validate session:', error);
    return null;
  }
}

export async function revokeSession(sessionId: string): Promise<void> {
  try {
    await prisma.authSession.delete({ where: { id: sessionId } });
  } catch (error) {
    console.error('❌ Failed to revoke session:', error);
    throw new Error('فشل في إلغاء الجلسة');
  }
}

export async function revokeAllUserSessions(userId: string): Promise<number> {
  try {
    const result = await prisma.authSession.deleteMany({
      where: { officerId: userId },
    });
    return result.count;
  } catch (error) {
    console.error('❌ Failed to revoke all user sessions:', error);
    throw new Error('فشل في إلغاء جميع جلسات المستخدم');
  }
}

export async function getUserSessions(userId: string): Promise<SessionData[]> {
  try {
    const rows = await prisma.authSession.findMany({
      where: {
        officerId: userId,
        isValid: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActive: 'desc' },
    });

    return rows.map(toSessionData);
  } catch (error) {
    console.error('❌ Failed to get user sessions:', error);
    return [];
  }
}

export async function extendSession(sessionId: string, ttl: number = SESSION_TTL): Promise<boolean> {
  try {
    const session = await getSession(sessionId);
    if (!session) return false;

    await prisma.authSession.update({
      where: { id: sessionId },
      data: {
        expiresAt: new Date(Date.now() + ttl * 1000),
        lastActive: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to extend session:', error);
    return false;
  }
}

export async function invalidateSession(sessionId: string): Promise<boolean> {
  try {
    const session = await getSession(sessionId);
    if (!session) return false;

    await prisma.authSession.update({
      where: { id: sessionId },
      data: { isValid: false, lastActive: new Date() },
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to invalidate session:', error);
    return false;
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.authSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: new Date() } },
          { isValid: false },
        ],
      },
    });

    return result.count;
  } catch (error) {
    console.error('❌ Failed to cleanup expired sessions:', error);
    return 0;
  }
}

export async function getActiveSessionCount(): Promise<number> {
  try {
    return prisma.authSession.count({
      where: {
        isValid: true,
        expiresAt: { gt: new Date() },
      },
    });
  } catch (error) {
    console.error('❌ Failed to get active session count:', error);
    return 0;
  }
}
