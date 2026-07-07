/**
 * Session Manager Module — NSSCP Platform
 * 
 * This module provides ONLY Redis session management:
 * - Create sessions
 * - Validate sessions
 * - Revoke sessions
 * - Get session data
 * 
 * NO authentication logic (see ./index.ts)
 * NO JWT logic (see ../jwt.ts)
 * NO middleware logic (see ../../middleware.ts)
 */

import { createClient, RedisClientType } from 'redis';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REDIS CLIENT INITIALIZATION (SAFE SINGLETON PATTERN)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Safe singleton pattern - lazy initialization
let redisClient: RedisClientType | null = null;
let isConnecting = false;

/**
 * Get or create Redis client instance
 * Uses lazy initialization to avoid top-level await
 * Safe for Next.js Edge runtime and build process
 */
function getRedisClient(): RedisClientType {
    if (!redisClient) {
        redisClient = createClient({ url: REDIS_URL });

        // Handle Redis connection errors
        redisClient.on('error', (err) => {
            console.error('❌ Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis Client Connected');
        });

        // Connect asynchronously (non-blocking)
        if (!isConnecting) {
            isConnecting = true;
            redisClient.connect().catch((err) => {
                console.error('❌ Failed to connect to Redis:', err);
                isConnecting = false;
            });
        }
    }

    return redisClient;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SESSION_PREFIX = 'nsscp:session:';
const SESSION_TTL = 60 * 60 * 24; // 24 hours in seconds

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
    ttl?: number; // Optional custom TTL in seconds
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SESSION CRUD OPERATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Create a new session in Redis
 * @param sessionId - Unique session identifier (usually JWT token)
 * @param options - Session creation options
 * @returns Promise<void>
 */
export async function createSession(sessionId: string, options: CreateSessionOptions): Promise<void> {
    const now = Date.now();
    const ttl = options.ttl || SESSION_TTL;

    const sessionData: SessionData = {
        userId: options.userId,
        username: options.username,
        role: options.role,
        deviceId: options.deviceId,
        ip: options.ip,
        userAgent: options.userAgent,
        hierarchyEntityId: options.hierarchyEntityId,
        hierarchyEntityName: options.hierarchyEntityName,
        hierarchyEntityType: options.hierarchyEntityType,
        createdAt: now,
        lastActive: now,
        expiresAt: now + ttl * 1000,
        isValid: true,
    };

    try {
        const redis = getRedisClient();
        await redis.set(SESSION_PREFIX + sessionId, JSON.stringify(sessionData), {
            EX: ttl,
        });
    } catch (error) {
        console.error('❌ Failed to create session:', error);
        throw new Error('فشل في إنشاء الجلسة');
    }
}

/**
 * Get session data from Redis
 * @param sessionId - Session identifier
 * @returns Session data or null if not found
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
    try {
        const redis = getRedisClient();
        const data = await redis.get(SESSION_PREFIX + sessionId);
        if (!data) return null;

        const session: SessionData = JSON.parse(String(data));

        // Check if session is expired or invalid
        if (!session.isValid || session.expiresAt < Date.now()) {
            await revokeSession(sessionId);
            return null;
        }

        return session;
    } catch (error) {
        console.error('❌ Failed to get session:', error);
        return null;
    }
}

/**
 * Validate and update session last active time
 * @param sessionId - Session identifier
 * @returns Session data if valid, null otherwise
 */
export async function validateSession(sessionId: string): Promise<SessionData | null> {
    const session = await getSession(sessionId);
    if (!session) return null;

    try {
        const redis = getRedisClient();
        
        // Update last active timestamp
        session.lastActive = Date.now();

        // Save updated session back to Redis with same TTL
        const ttl = await redis.ttl(SESSION_PREFIX + sessionId);
        if (ttl > 0) {
            await redis.set(SESSION_PREFIX + sessionId, JSON.stringify(session), {
                EX: ttl,
            });
        }

        return session;
    } catch (error) {
        console.error('❌ Failed to validate session:', error);
        return null;
    }
}

/**
 * Revoke a specific session
 * @param sessionId - Session identifier to revoke
 * @returns Promise<void>
 */
export async function revokeSession(sessionId: string): Promise<void> {
    try {
        const redis = getRedisClient();
        await redis.del(SESSION_PREFIX + sessionId);
    } catch (error) {
        console.error('❌ Failed to revoke session:', error);
        throw new Error('فشل في إلغاء الجلسة');
    }
}

/**
 * Revoke all sessions for a specific user
 * @param userId - User ID
 * @returns Promise<number> - Number of sessions revoked
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
    try {
        const redis = getRedisClient();
        const keys = await redis.keys(`${SESSION_PREFIX}*`);
        let revokedCount = 0;

        for (const key of keys) {
            const raw = await redis.get(key);
            if (raw) {
                const session: SessionData = JSON.parse(String(raw));
                if (session.userId === userId) {
                    await redis.del(key);
                    revokedCount++;
                }
            }
        }

        return revokedCount;
    } catch (error) {
        console.error('❌ Failed to revoke all user sessions:', error);
        throw new Error('فشل في إلغاء جميع جلسات المستخدم');
    }
}

/**
 * Get all active sessions for a specific user
 * @param userId - User ID
 * @returns Array of session data
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
    try {
        const redis = getRedisClient();
        const keys = await redis.keys(`${SESSION_PREFIX}*`);
        const sessions: SessionData[] = [];

        for (const key of keys) {
            const raw = await redis.get(key);
            if (raw) {
                const session: SessionData = JSON.parse(String(raw));
                if (session.userId === userId && session.isValid && session.expiresAt > Date.now()) {
                    sessions.push(session);
                }
            }
        }

        return sessions;
    } catch (error) {
        console.error('❌ Failed to get user sessions:', error);
        return [];
    }
}

/**
 * Update session TTL (extend session lifetime)
 * @param sessionId - Session identifier
 * @param ttl - New TTL in seconds
 * @returns Promise<boolean> - true if updated successfully
 */
export async function extendSession(sessionId: string, ttl: number = SESSION_TTL): Promise<boolean> {
    try {
        const session = await getSession(sessionId);
        if (!session) return false;

        const redis = getRedisClient();

        // Update expiration time
        session.expiresAt = Date.now() + ttl * 1000;

        await redis.set(SESSION_PREFIX + sessionId, JSON.stringify(session), {
            EX: ttl,
        });

        return true;
    } catch (error) {
        console.error('❌ Failed to extend session:', error);
        return false;
    }
}

/**
 * Invalidate a session without deleting it (marks as invalid)
 * @param sessionId - Session identifier
 * @returns Promise<boolean> - true if invalidated successfully
 */
export async function invalidateSession(sessionId: string): Promise<boolean> {
    try {
        const session = await getSession(sessionId);
        if (!session) return false;

        const redis = getRedisClient();
        session.isValid = false;

        const ttl = await redis.ttl(SESSION_PREFIX + sessionId);
        if (ttl > 0) {
            await redis.set(SESSION_PREFIX + sessionId, JSON.stringify(session), {
                EX: ttl,
            });
        }

        return true;
    } catch (error) {
        console.error('❌ Failed to invalidate session:', error);
        return false;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLEANUP & MAINTENANCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Clean up expired sessions (Redis auto-expires but this is for manual cleanup)
 * @returns Promise<number> - Number of sessions cleaned
 */
export async function cleanupExpiredSessions(): Promise<number> {
    try {
        const redis = getRedisClient();
        const keys = await redis.keys(`${SESSION_PREFIX}*`);
        let cleanedCount = 0;

        for (const key of keys) {
            const raw = await redis.get(key);
            if (raw) {
                const session: SessionData = JSON.parse(String(raw));
                if (session.expiresAt < Date.now() || !session.isValid) {
                    await redis.del(key);
                    cleanedCount++;
                }
            }
        }

        return cleanedCount;
    } catch (error) {
        console.error('❌ Failed to cleanup expired sessions:', error);
        return 0;
    }
}

/**
 * Get total number of active sessions
 * @returns Promise<number> - Number of active sessions
 */
export async function getActiveSessionCount(): Promise<number> {
    try {
        const redis = getRedisClient();
        const keys = await redis.keys(`${SESSION_PREFIX}*`);
        return keys.length;
    } catch (error) {
        console.error('❌ Failed to get active session count:', error);
        return 0;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Export getRedisClient for advanced use cases
export { getRedisClient };
