/**
 * Unified RBAC Engine — NSSCP Platform
 *
 * Central authorization layer combining:
 *  - Role-based permission checks (hasPermission)
 *  - Hierarchy scope verification (canAccessHierarchyNode)
 *  - Dual verification for API guards (withDualVerification)
 */

import { prisma } from '@/lib/prisma';
import { Role, Permission, hasPermission as checkPerm, isSuperAdmin, getDataScope } from '@/lib/permissions';

// ─── Types ──────────────────────────────────────────────────────────

export interface RBACContext {
  userId: string;
  role: string;
  hierarchyEntityId?: string | null;
  hierarchyEntityType?: string | null;
}

export interface PermissionCheck {
  granted: boolean;
  reason?: string;
}

export interface DualVerificationResult {
  allowed: boolean;
  reason?: string;
  scope?: { hierarchyEntityId?: string | { in: string[] }; createdById?: string; };
}

// ─── Action & Resource Definitions ──────────────────────────────────

export type Action = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT';

export type Resource =
  | 'INCIDENTS' | 'CASES' | 'STATS' | 'USERS' | 'SETTINGS'
  | 'EVIDENCE' | 'REPORTS' | 'OFFICERS' | 'WANTED'
  | 'VEHICLES' | 'WEAPONS' | 'HIERARCHY' | 'ROLES' | 'AUDIT_LOGS' | 'NOTIFICATIONS';

const ACTION_RESOURCE_MAP: Record<string, Record<string, Permission>> = {
  CREATE: {
    INCIDENTS: Permission.CREATE_CASE, CASES: Permission.CREATE_CASE,
    EVIDENCE: Permission.CREATE_EVIDENCE, REPORTS: Permission.CREATE_REPORT,
    OFFICERS: Permission.CREATE_OFFICER, WANTED: Permission.CREATE_WANTED,
    VEHICLES: Permission.CREATE_VEHICLE, WEAPONS: Permission.CREATE_WEAPON,
    USERS: Permission.CREATE_USER, HIERARCHY: Permission.MANAGE_HIERARCHY,
    SETTINGS: Permission.MANAGE_SETTINGS,
  },
  READ: {
    INCIDENTS: Permission.READ_CASE, CASES: Permission.READ_CASE,
    STATS: Permission.VIEW_STATISTICS, USERS: Permission.READ_USER,
    EVIDENCE: Permission.READ_EVIDENCE, REPORTS: Permission.READ_REPORT,
    OFFICERS: Permission.READ_OFFICER, WANTED: Permission.READ_WANTED,
    VEHICLES: Permission.READ_VEHICLE, WEAPONS: Permission.READ_WEAPON,
    HIERARCHY: Permission.VIEW_HIERARCHY, ROLES: Permission.MANAGE_ROLES,
    AUDIT_LOGS: Permission.VIEW_AUDIT_LOGS, NOTIFICATIONS: Permission.MANAGE_NOTIFICATIONS,
    SETTINGS: Permission.MANAGE_SETTINGS,
  },
  UPDATE: {
    INCIDENTS: Permission.UPDATE_CASE, CASES: Permission.UPDATE_CASE,
    EVIDENCE: Permission.UPDATE_EVIDENCE, REPORTS: Permission.UPDATE_REPORT,
    OFFICERS: Permission.UPDATE_OFFICER, WANTED: Permission.UPDATE_WANTED,
    VEHICLES: Permission.UPDATE_VEHICLE, WEAPONS: Permission.UPDATE_WEAPON,
    USERS: Permission.UPDATE_USER, HIERARCHY: Permission.MANAGE_HIERARCHY,
    SETTINGS: Permission.MANAGE_SETTINGS,
  },
  DELETE: {
    CASES: Permission.DELETE_CASE, EVIDENCE: Permission.DELETE_EVIDENCE,
    REPORTS: Permission.DELETE_REPORT, OFFICERS: Permission.DELETE_OFFICER,
    WANTED: Permission.DELETE_WANTED, USERS: Permission.DELETE_USER,
    SETTINGS: Permission.MANAGE_SETTINGS,
  },
  EXPORT: {
    INCIDENTS: Permission.EXPORT_DATA, CASES: Permission.EXPORT_DATA,
    STATS: Permission.EXPORT_DATA, REPORTS: Permission.EXPORT_DATA,
    USERS: Permission.EXPORT_DATA, WANTED: Permission.EXPORT_DATA,
  },
};

// ─── Core Permission Check ──────────────────────────────────────────

export function hasPermission(ctx: RBACContext, action: Action, resource: Resource): PermissionCheck {
  if (isSuperAdmin(ctx.role)) return { granted: true };
  const requiredPerm = ACTION_RESOURCE_MAP[action]?.[resource];
  if (!requiredPerm) return { granted: false, reason: `No mapping for ${action}:${resource}` };
  if (checkPerm(ctx.role, requiredPerm)) return { granted: true };
  return { granted: false, reason: `Role ${ctx.role} lacks ${requiredPerm}` };
}

// ─── Hierarchy Scope Verification ───────────────────────────────────

export async function canAccessHierarchyNode(ctx: RBACContext, targetNodeId: string): Promise<PermissionCheck> {
  if (isSuperAdmin(ctx.role)) return { granted: true };
  if (!ctx.hierarchyEntityId) return { granted: false, reason: 'No hierarchy assignment' };
  if (ctx.hierarchyEntityId === targetNodeId) return { granted: true };
  const descendants = await getDescendantIds(ctx.hierarchyEntityId);
  if (descendants.includes(targetNodeId)) return { granted: true };
  return { granted: false, reason: `Node ${targetNodeId} outside user scope` };
}

// ─── Dual Verification (Permission + Hierarchy) ─────────────────────

export async function withDualVerification(
  ctx: RBACContext, action: Action, resource: Resource, targetNodeId?: string,
): Promise<DualVerificationResult> {
  const perm = hasPermission(ctx, action, resource);
  if (!perm.granted) return { allowed: false, reason: perm.reason };

  const scope = getDataScope(ctx.role as Role);
  if (scope === 'system') return { allowed: true, scope: {} };

  if (scope === 'hierarchy') {
    if (!ctx.hierarchyEntityId) return { allowed: false, reason: 'No hierarchy context' };
    const descendants = await getDescendantIds(ctx.hierarchyEntityId);
    if (targetNodeId) {
      const inScope = [ctx.hierarchyEntityId, ...descendants];
      if (!inScope.includes(targetNodeId)) return { allowed: false, reason: 'Node outside scope' };
      return { allowed: true, scope: { hierarchyEntityId: targetNodeId } };
    }
    return { allowed: true, scope: { hierarchyEntityId: { in: [ctx.hierarchyEntityId, ...descendants] } } };
  }

  return { allowed: true, scope: { createdById: ctx.userId } };
}

// ─── Helpers ────────────────────────────────────────────────────────

async function getDescendantIds(entityId: string): Promise<string[]> {
  const ids: string[] = [];
  const children = await prisma.hierarchyEntity.findMany({ where: { parentId: entityId }, select: { id: true } });
  for (const child of children) {
    ids.push(child.id);
    ids.push(...(await getDescendantIds(child.id)));
  }
  return ids;
}

export function createRBACContext(user: { id: string; role: string; hierarchyEntityId?: string | null; hierarchyEntityType?: string | null }): RBACContext {
  return { userId: user.id, role: user.role, hierarchyEntityId: user.hierarchyEntityId, hierarchyEntityType: user.hierarchyEntityType };
}

export function resolvePermission(action: Action, resource: Resource): Permission | null {
  return ACTION_RESOURCE_MAP[action]?.[resource] ?? null;
}
