/**
 * Audit Logging Utility – NSSCP Platform
 *
 * Provides a unified wrapper around the audit engine for sensitive API calls.
 * Automatically enriches audit entries with hierarchy context,
 * request metadata, and RBAC violation tracking.
 *
 * Usage:
 *   import { auditSensitiveAction, auditAccessDenied } from '@/lib/logging/audit';
 *
 *   // Log a successful action
 *   await auditSensitiveAction(request, user, 'READ', 'STATS', { ... });
 *
 *   // Log an access denial
 *   await auditAccessDenied(request, user, 'READ', 'STATS', targetNodeId);
 */

import { createAuditLog, extractRequestMeta, type AuditAction, type AuditEntityType } from '@/lib/core/audit-engine';
import type { AuthenticatedUser } from '@/lib/auth/auth.types';

// ─── Types ──────────────────────────────────────────────────────────

export interface SensitiveActionInput {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    details?: Record<string, unknown> | string | null;
    hierarchyEntityId?: string | null;
    hierarchyEntityType?: string | null;
}

// ─── Log a Sensitive API Action ─────────────────────────────────────

/**
 * Log a sensitive action with full request context.
 * Call this in any API route that performs a sensitive operation
 * (create/update/delete/export) or returns critical data.
 *
 * @param request  - The Next.js Request object (for IP/UA extraction)
 * @param user     - Authenticated user
 * @param action   - The action being performed
 * @param entityType - The entity type being acted upon
 * @param entityId - The entity ID (or a descriptive string if none exists)
 * @param options  - Optional context (details, hierarchy scope)
 */
export async function auditSensitiveAction(
    request: Request,
    user: AuthenticatedUser | { id: string; fullName?: string; username?: string } | null,
    action: string,
    entityType: string,
    entityId: string,
    options?: {
        details?: Record<string, unknown> | string | null;
        hierarchyEntityId?: string | null;
        hierarchyEntityType?: string | null;
    },
): Promise<void> {
    const meta = extractRequestMeta(request);

    await createAuditLog({
        action: action as AuditAction,
        entityType: entityType as AuditEntityType,
        entityId,
        userId: user?.id || null,
        officerId: null,
        details: options?.details || null,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        hierarchyEntityId: options?.hierarchyEntityId || null,
        hierarchyEntityType: options?.hierarchyEntityType || null,
    });
}

// ─── Log Access Denial (403) ────────────────────────────────────────

/**
 * Log an unauthorised access attempt and return a standardised 403 response.
 * This ensures that every RBAC violation is recorded in the audit trail.
 *
 * @param request      - The Next.js Request object
 * @param user         - Authenticated user (or null if not authenticated)
 * @param action       - The action that was denied
 * @param resource     - The resource that was denied
 * @param targetNodeId - The hierarchy node ID being accessed (optional)
 * @param reason       - Custom reason (default: "ليس لديك صلاحية للوصول")
 * @returns A standardised 403 Response object
 */
export async function auditAccessDenied(
    request: Request,
    user: AuthenticatedUser | { id: string; fullName?: string; username?: string } | null,
    action: string,
    resource: string,
    targetNodeId?: string | null,
    reason?: string,
): Promise<Response> {
    const meta = extractRequestMeta(request);

    await createAuditLog({
        action: 'VIEW' as AuditAction,
        entityType: resource as AuditEntityType,
        entityId: targetNodeId || 'N/A',
        userId: user?.id || 'unauthenticated',
        officerId: null,
        details: {
            action,
            resource,
            targetNodeId,
            reason: reason || 'ACCESS_DENIED - Insufficient permissions',
            userRole: (user as any)?.role || 'NONE',
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        hierarchyEntityId: targetNodeId || null,
    });

    return new Response(
        JSON.stringify({
            error: reason || 'ليس لديك صلاحية للوصول إلى هذا المورد',
        }),
        {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
        },
    );
}

// ─── Convenience: RBAC Check + Audit + 403 ─────────────────────────

/**
 * Perform an RBAC permission check, log denial on failure, return 403.
 * Returns `null` if the check passes, otherwise a 403 Response.
 *
 * Usage:
 *   const denied = await rbacGuard(request, user, 'READ', 'STATS', ctx, nodeId);
 *   if (denied) return denied;
 */
import { createRBACContext, withDualVerification, type Action, type Resource } from '@/lib/auth/rbac';
import type { RBACContext } from '@/lib/auth/rbac';

export async function rbacGuard(
    request: Request,
    user: AuthenticatedUser | { id: string; role: string; hierarchyEntityId?: string | null; hierarchyEntityType?: string | null } | null,
    action: Action,
    resource: Resource,
    targetNodeId?: string | null,
): Promise<Response | null> {
    if (!user) {
        return auditAccessDenied(request, null, action, resource, targetNodeId, 'غير مصرح بالدخول');
    }

    const ctx: RBACContext = createRBACContext(user);
    const result = await withDualVerification(ctx, action, resource, targetNodeId || undefined);

    if (!result.allowed) {
        return auditAccessDenied(request, user, action, resource, targetNodeId, result.reason);
    }

    return null; // Allowed
}