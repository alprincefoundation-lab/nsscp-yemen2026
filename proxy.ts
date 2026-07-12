import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// NSSCP Unified Authentication & Authorization Proxy
// ============================================================================
// Single protection layer responsible for:
//  - Session validation (via nsscp_session cookie)
//  - JWT token verification
//  - Authorization (role checks for restricted routes)
//  - Rate limiting for API endpoints
//  - Security headers
//  - Public/Protected/Restricted route segregation
// ============================================================================

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>()

// ─── RATE LIMITING ────────────────────────────────────────────────────────

function getRateLimitKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  return `${ip}:${request.nextUrl.pathname}`
}

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = RATE_LIMIT_MAP.get(key)

  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count += 1
  return true
}

// ─── SECURITY HEADERS ─────────────────────────────────────────────────────

function applySecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
}

// ─── JWT VALIDATION ───────────────────────────────────────────────────────

function isLikelyJwt(value: string): boolean {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)
}

// ─── HELPERS ──────────────────────────────────────────────────────────────

function buildRedirect(url: string, request: NextRequest) {
  const response = NextResponse.redirect(new URL(url, request.url))
  applySecurityHeaders(response)
  return response
}

function unauthorizedJson(message: string) {
  return NextResponse.json({ error: message }, { status: 403 })
}

// ─── ROUTE CLASSIFICATION ─────────────────────────────────────────────────

const PUBLIC_ROUTES = new Set(['/', '/login'])
const PUBLIC_PREFIXES = ['/_next', '/api/auth/login', '/api/auth/logout', '/api/health', '/favicon.ico', '/icon']

const RESTRICTED_ROUTES: Record<string, string[]> = {
  '/dashboard/users': ['SUPER_ADMIN', 'GOVERNORATE_ADMIN'],
  '/dashboard/roles': ['SUPER_ADMIN'],
  '/dashboard/permissions': ['SUPER_ADMIN'],
  '/dashboard/settings': ['SUPER_ADMIN', 'GOVERNORATE_ADMIN'],
  '/api/users': ['SUPER_ADMIN', 'GOVERNORATE_ADMIN'],
  '/api/roles': ['SUPER_ADMIN'],
  '/api/role-permissions': ['SUPER_ADMIN'],
  '/api/user-permissions': ['SUPER_ADMIN'],
  '/api/settings': ['SUPER_ADMIN', 'GOVERNORATE_ADMIN'],
  '/api/systems': ['SUPER_ADMIN'],
}

function isPublicRoute(path: string): boolean {
  if (PUBLIC_ROUTES.has(path)) return true
  return PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))
}

function isApiRoute(path: string): boolean {
  return path.startsWith('/api/')
}

function isDashboardRoute(path: string): boolean {
  return path.startsWith('/dashboard')
}

function getRequiredRoles(path: string): string[] | null {
  // Exact match first
  if (RESTRICTED_ROUTES[path]) return RESTRICTED_ROUTES[path]
  // Prefix match
  for (const [routePath, roles] of Object.entries(RESTRICTED_ROUTES)) {
    if (path.startsWith(routePath + '/') || path.startsWith(routePath)) {
      return roles
    }
  }
  return null
}

// ─── SIMPLE TOKEN DECODE (no prisma dependency in edge) ───────────────────

function decodeTokenPayload(token: string): { role?: string; sub?: string; iat?: number; exp?: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8')
    return JSON.parse(payload)
  } catch {
    return null
  }
}

// ─── MAIN PROXY HANDLER ───────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const response = NextResponse.next()

  // ─── API ROUTE HANDLING ──────────────────────────────────────────────
  if (isApiRoute(path)) {
    const isLoginPath = path.startsWith('/api/auth/login')
    const isUploadPath = path.startsWith('/api/attachments') && request.method === 'POST'
    const isMutatingApi = request.method !== 'GET'

    // Rate limiting
    if (isLoginPath) {
      const key = getRateLimitKey(request)
      if (!checkRateLimit(key, 10, 60_000)) {
        return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 })
      }
      response.headers.set('X-RateLimit-Limit', '10')
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + 60))
    } else if (isUploadPath) {
      const key = getRateLimitKey(request)
      if (!checkRateLimit(key, 30, 60_000)) {
        return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429 })
      }
    } else if (isMutatingApi) {
      const key = getRateLimitKey(request)
      if (!checkRateLimit(key, 60, 60_000)) {
        return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
      }
    }

    // For restricted API routes, check role from token
    const requiredRoles = getRequiredRoles(path)
    if (requiredRoles) {
      const token = request.cookies.get('nsscp_session')?.value
      if (!token || !isLikelyJwt(token)) {
        return unauthorizedJson('Authentication required')
      }
      const payload = decodeTokenPayload(token)
      if (!payload || !payload.role) {
        return unauthorizedJson('Invalid session')
      }
      if (!requiredRoles.includes(payload.role)) {
        return unauthorizedJson('Insufficient permissions for this resource')
      }
    }

    applySecurityHeaders(response)
    return response
  }

  // ─── PUBLIC ROUTES ────────────────────────────────────────────────────
  if (path === '/login') {
    const token = request.cookies.get('nsscp_session')?.value
    if (token && isLikelyJwt(token)) {
      // Already authenticated — redirect to dashboard
      return buildRedirect('/dashboard', request)
    }

    applySecurityHeaders(response)
    return response
  }

  if (isPublicRoute(path)) {
    applySecurityHeaders(response)
    return response
  }

  // ─── DASHBOARD PROTECTED ROUTES ────────────────────────────────────────
  if (isDashboardRoute(path)) {
    const token = request.cookies.get('nsscp_session')?.value

    if (!token || !isLikelyJwt(token)) {
      return buildRedirect(`/login?from=${encodeURIComponent(path)}`, request)
    }

    // Check restricted routes for role-based access
    const requiredRoles = getRequiredRoles(path)
    if (requiredRoles) {
      const payload = decodeTokenPayload(token)
      if (!payload || !payload.role) {
        return buildRedirect('/unauthorized', request)
      }
      if (!requiredRoles.includes(payload.role)) {
        return buildRedirect('/unauthorized', request)
      }
    }

    applySecurityHeaders(response)
    return response
  }

  // ─── CATCH-ALL — apply security headers ───────────────────────────────
  applySecurityHeaders(response)
  return response
}

export default proxy

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/login',
    '/',
  ],
}