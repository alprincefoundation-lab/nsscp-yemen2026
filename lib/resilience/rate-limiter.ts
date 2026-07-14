/**
 * Redis-Backed Rate Limiter — NSSCP Production
 *
 * Replaces in-memory Map with Redis for persistence across deployments.
 * Falls back to in-memory store if Redis is unavailable.
 */
import Redis from 'ioredis';

// ─── Redis client (lazy) ──────────────────────────────────────────────────

let redis: Redis | null = null;
let redisFailed = false;

function getRedis(): Redis | null {
  if (redisFailed) return null;
  if (redis) return redis;

  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: false,
      enableAutoPipelining: false,
      retryStrategy: () => null, // no retry — fail fast
    });

    redis.on('error', () => {
      redisFailed = true;
      redis = null;
    });

    return redis;
  } catch {
    redisFailed = true;
    return null;
  }
}

// ─── In-memory fallback ──────────────────────────────────────────────────

const FALLBACK_MAP = new Map<string, { count: number; resetAt: number }>();

function checkFallback(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = FALLBACK_MAP.get(key);

  if (!entry || now > entry.resetAt) {
    FALLBACK_MAP.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count += 1;
  return true;
}

// ─── Redis-backed check ───────────────────────────────────────────────────

async function checkRedis(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const r = getRedis();
  if (!r) return checkFallback(key, maxRequests, windowMs);

  try {
    const windowKey = `nsscp:ratelimit:${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove expired entries and count current window
    const multi = r
      .multi()
      .zremrangebyscore(windowKey, 0, windowStart)
      .zcard(windowKey);

    const [, count] = (await multi.exec()) as [[null, number], [null, number]];
    const currentCount = count?.[1] ?? 0;

    if (currentCount >= maxRequests) return false;

    // Add current request
    await r.zadd(windowKey, now, `${now}-${Math.random().toString(36).slice(2, 10)}`);
    await r.expire(windowKey, Math.ceil(windowMs / 1000) + 1);
    return true;
  } catch {
    return checkFallback(key, maxRequests, windowMs);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; limit: number; resetSeconds: number }> {
  const allowed = await checkRedis(key, config.maxRequests, config.windowMs);
  return {
    allowed,
    limit: config.maxRequests,
    resetSeconds: Math.ceil(config.windowMs / 1000),
  };
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  LOGIN: { maxRequests: 10, windowMs: 60_000 },
  UPLOAD: { maxRequests: 30, windowMs: 60_000 },
  MUTATING_API: { maxRequests: 60, windowMs: 60_000 },
};
