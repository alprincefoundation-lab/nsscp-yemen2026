/**
 * Security Middleware – Request validation, rate limiting, CORS, and security headers for NSSCP API routes.
 * Integrates with Audit Engine for logging security events and RBAC for authorization.
 */
import { NextResponse } from 'next/server';
import { createAuditLog, extractRequestMeta } from '@/lib/core/audit-engine';
import { checkPermission, type RBACUser } from '@/lib/core/rbac-engine';
import type { Permission } from '@/lib/permissions';

// ============================================
// Types
// ============================================

export interface SecurityConfig {
    rateLimitWindow?: number; // ms window for rate limiting
    rateLimitMax?: number; // max requests per window
    requireHttps?: boolean;
    allowedOrigins?: string[];
    maxBodySize?: number; // in bytes
}

export interface SecurityValidationResult {
    valid: boolean;
    status?: number;
    error?: string;
    headers?: Record<string, string>;
}

// ============================================
// CORS Configuration
// ============================================

const DEFAULT_ALLOWED_ORIGINS = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'http://localhost:3000',
];

/**
 * Validate CORS origin
 */
export function validateCorsOrigin(
    origin: string | null,
    allowedOrigins: string[] = DEFAULT_ALLOWED_ORIGINS
): boolean {
    if (!origin) return true; // Server-side request
    return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
}

/**
 * Generate CORS headers
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
    const allowedOrigin = origin && validateCorsOrigin(origin)
        ? origin
        : DEFAULT_ALLOWED_ORIGINS[0];

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    };
}

// ============================================
// Security Headers
// ============================================

export function getSecurityHeaders(): Record<string, string> {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    };
}

// ============================================
// Request Validation
// ============================================

const ipRequestCounts: Record<string, { count: number; resetAt: number }> = {};

/**
 * Validate an API request for security concerns
 */
export function validateRequest(
    request: Request,
    config: SecurityConfig = {}
): SecurityValidationResult {
    const {
        rateLimitWindow = 60000,
        rateLimitMax = 100,
        requireHttps = false,
        maxBodySize = 5 * 1024 * 1024, // 5MB default
    } = config;

    // HTTPS enforcement (production)
    if (requireHttps && process.env.NODE_ENV === 'production') {
        const forwardedProto = request.headers.get('x-forwarded-proto');
        if (forwardedProto && forwardedProto !== 'https') {
            return {
                valid: false,
                status: 403,
                error: 'اتصال آمن (HTTPS) مطلوب',
            };
        }
    }

    // Content-Type validation for POST/PUT/PATCH
    const method = request.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.length > 0 && !contentType.includes('multipart/form-data') && !contentType.includes('application/json')) {
            return {
                valid: false,
                status: 415,
                error: 'نوع المحتوى غير مدعوم. يرجى استخدام application/json',
            };
        }
    }

    // Body size check
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxBodySize) {
        return {
            valid: false,
            status: 413,
            error: 'حجم الطلب كبير جداً',
        };
    }

    return { valid: true };
}

// ============================================
// Rate Limiting
// ============================================

/**
 * Check rate limit for an IP address
 */
export function checkRateLimit(
    ip: string,
    config: { windowMs?: number; maxRequests?: number } = {}
): { allowed: boolean; remaining: number; resetAt: number } {
    const windowMs = config.windowMs || 60000;
    const maxRequests = config.maxRequests || 100;
    const now = Date.now();

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
        for (const [key, value] of Object.entries(ipRequestCounts)) {
            if (value.resetAt < now) {
                delete ipRequestCounts[key];
            }
        }
    }

    const record = ipRequestCounts[ip];

    if (!record || record.resetAt < now) {
        ipRequestCounts[ip] = { count: 1, resetAt: now + windowMs };
        return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
    }

    record.count++;

    if (record.count > maxRequests) {
        return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

// ============================================
// RBAC-protected API Route Wrapper
// ============================================

export type ApiHandler = (
    request: Request,
    context: { user: RBACUser; params: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Wrap an API route handler with authentication, RBAC, and audit logging
 */
export function withSecurity(
    handler: ApiHandler,
    options: {
        requiredPermission?: Permission;
        requiredRole?: string[];
        requireAuth?: boolean;
        auditAction?: string;
        auditEntityType?: string;
        config?: SecurityConfig;
    } = {}
) {
    return async (request: Request, { params }: { params: Promise<Record<string, string>> | Record<string, string> }) => {
        try {
            // CORS preflight
            if (request.method === 'OPTIONS') {
                const origin = request.headers.get('origin');
                return new NextResponse(null, {
                    status: 204,
                    headers: {
                        ...getCorsHeaders(origin),
                        ...getSecurityHeaders(),
                    },
                });
            }

            // Validate request
            const validation = validateRequest(request, options.config);
            if (!validation.valid) {
                return NextResponse.json(
                    { error: validation.error },
                    { status: validation.status || 400, headers: getSecurityHeaders() }
                );
            }

            // Authentication check - import dynamically to avoid circular deps
            const { getAuthenticatedUser } = await import('@/lib/auth');
            const authUser = await getAuthenticatedUser();

            if (options.requireAuth !== false && !authUser) {
                return NextResponse.json(
                    { error: 'غير مصرح بالوصول، يرجى تسجيل الدخول' },
                    { status: 401, headers: getSecurityHeaders() }
                );
            }

            // Build RBAC user
            const rbacUser: RBACUser = {
                id: authUser?.id || 'SYSTEM',
                username: authUser?.username || 'system',
                role: authUser?.role || 'SYSTEM',
                fullName: authUser?.fullName,
            };

            // Role check
            if (options.requiredRole && options.requiredRole.length > 0) {
                if (!options.requiredRole.includes(rbacUser.role)) {
                    return NextResponse.json(
                        { error: 'ليس لديك صلاحية للوصول إلى هذا المورد' },
                        { status: 403, headers: getSecurityHeaders() }
                    );
                }
            }

            // Permission check
            if (options.requiredPermission) {
                const permissionCheck = await checkPermission(rbacUser, options.requiredPermission, {
                    request: options.auditAction ? request : undefined,
                });
                if (!permissionCheck.granted) {
                    return NextResponse.json(
                        { error: permissionCheck.reason },
                        { status: 403, headers: getSecurityHeaders() }
                    );
                }
            }

            const resolvedParams = await params;

            // Execute handler
            const response = await handler(request, { user: rbacUser, params: resolvedParams });

            // Add security headers to response
            const securityHeaders = getSecurityHeaders();
            const corsHeaders = getCorsHeaders(request.headers.get('origin'));
            const combinedHeaders = { ...securityHeaders, ...corsHeaders };

            // Merge headers into response
            for (const [key, value] of Object.entries(combinedHeaders)) {
                response.headers.set(key, value);
            }

            return response;
        } catch (error: any) {
            // Log security error
            try {
                const meta = extractRequestMeta(request);
                await createAuditLog({
                    action: 'VIEW',
                    entityType: 'PERMISSION',
                    entityId: 'ERROR',
                    userId: 'SYSTEM',
                    details: {
                        error: error.message,
                        path: request.url,
                        method: request.method,
                    },
                    ipAddress: meta.ipAddress,
                    userAgent: meta.userAgent,
                });
            } catch {
                // Silent fail
            }

            return NextResponse.json(
                { error: 'خطأ داخلي في الخادم' },
                { status: 500, headers: getSecurityHeaders() }
            );
        }
    };
}

// ============================================
// Input Sanitization
// ============================================

/**
 * Sanitize a string input to prevent XSS
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Sanitize an object's string fields recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'string' ? sanitizeInput(item) : item
            );
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized as T;
}