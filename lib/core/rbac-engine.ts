/**
 * RBAC Engine – Role-Based Access Control for NSSCP
 * 7 RBAC levels: SUPER_ADMIN → GOVERNORATE_ADMIN → DEPARTMENT_MANAGER → SECTION_MANAGER → OFFICER → DATA_ENTRY → VIEW_ONLY
 * Integrates with Audit Engine for permission check logging and Hierarchy for scope isolation.
 */
import { prisma } from '@/lib/prisma';
import { createAuditLog, extractRequestMeta, type AuditEntryInput } from './audit-engine';
import { Role, Permission, ROLE_LEVELS, hasPermission, getDataScope } from '@/lib/permissions';
// Local type definition for HierarchyType (used before Prisma generation)
type HierarchyType = 'MINISTRY' | 'GOVERNORATE' | 'DEPARTMENT' | 'SECTION' | 'UNIT';

// ============================================
// Types
// ============================================

export interface RBACUser {
    id: string;
    username: string;
    role: string;
    fullName?: string;
    hierarchyEntityIds?: string[];
}

export interface PermissionCheckResult {
    granted: boolean;
    reason?: string;
    requiredPermission?: string;
    userRole?: string;
}

export interface ScopeFilter {
    parentId?: { in: string[] };
    hierarchyEntityId?: { in: string[] };
}

// ============================================
// Permission Checking
// ============================================

/**
 * Check if a user has a specific permission
 * Returns detailed result with reason if denied
 */
export async function checkPermission(
    user: RBACUser,
    permission: Permission | string,
    options?: {
        resourceOwnerId?: string;
        hierarchyEntityId?: string;
        logDenied?: boolean;
        request?: Request;
    }
): Promise<PermissionCheckResult> {
    const isGranted = hasPermission(user.role, permission as Permission);

    if (!isGranted) {
        if (options?.logDenied) {
            try {
                const meta = options.request ? extractRequestMeta(options.request) : { ipAddress: '127.0.0.1', userAgent: 'System' };
                await createAuditLog({
                    action: 'VIEW',
                    entityType: 'PERMISSION',
                    entityId: 'DENIED',
                    userId: user.id,
                    details: {
                        permission,
                        userRole: user.role,
                        reason: 'Insufficient permissions',
                        resourceOwnerId: options.resourceOwnerId,
                        hierarchyEntityId: options.hierarchyEntityId,
                    },
                    ipAddress: meta.ipAddress,
                    userAgent: meta.userAgent,
                    hierarchyEntityId: options.hierarchyEntityId || null,
                    hierarchyEntityType: options.hierarchyEntityId ? 'DENIED_ACCESS' : null,
                });
            } catch {
                // Silent fail on audit log
            }
        }
        return {
            granted: false,
            reason: `ليس لديك صلاحية: ${permission}`,
            requiredPermission: permission,
            userRole: user.role,
        };
    }

    return { granted: true, userRole: user.role };
}

/**
 * Require a permission – throws if not granted
 */
export async function requirePermission(
    user: RBACUser,
    permission: Permission | string,
    options?: {
        resourceOwnerId?: string;
        hierarchyEntityId?: string;
        request?: Request;
    }
): Promise<void> {
    const result = await checkPermission(user, permission, { ...options, logDenied: true });
    if (!result.granted) {
        throw new Error(result.reason || 'Permission denied');
    }
}

// ============================================
// Scope-based Data Isolation
// ============================================

const HIERARCHY_TYPE_MAP: Record<string, HierarchyType> = {
    SUPER_ADMIN: 'MINISTRY',
    GOVERNORATE_ADMIN: 'GOVERNORATE',
    DEPARTMENT_MANAGER: 'DEPARTMENT',
    SECTION_MANAGER: 'SECTION',
    OFFICER: 'SECTION',
    DATA_ENTRY: 'SECTION',
    VIEW_ONLY: 'UNIT',
};

/**
 * Get Prisma where filter for data isolation based on user's role and hierarchy
 */
export async function getDataScopeFilter(user: RBACUser): Promise<ScopeFilter | Record<string, never>> {
    if (user.role === 'SUPER_ADMIN' || user.role === 'MINISTRY_ADMIN') {
        return {};
    }

    const scope = getDataScope(user.role as Role);

    // If user has direct hierarchy entity IDs, scope by those
    if (user.hierarchyEntityIds && user.hierarchyEntityIds.length > 0) {
        const allDescendantIds = await getDescendantEntityIds(user.hierarchyEntityIds);
        return { parentId: { in: allDescendantIds } };
    }

    // Fallback: no hierarchy scope available, return empty filter
    return {};
}

/**
 * Get descendant entity IDs for a set of parent entity IDs
 */
async function getDescendantEntityIds(parentIds: string[]): Promise<string[]> {
    const ids: string[] = [...parentIds];

    async function collectChildren(pIds: string[]) {
        const children = await prisma.hierarchyEntity.findMany({
            where: { parentId: { in: pIds } },
            select: { id: true },
        });
        if (children.length > 0) {
            const childIds = children.map(c => c.id);
            ids.push(...childIds);
            await collectChildren(childIds);
        }
    }

    await collectChildren(parentIds);
    return [...new Set(ids)];
}

// ============================================
// Role Management
// ============================================

/**
 * Get all roles from the database (RBAC Role model)
 */
export async function getRoles() {
    return prisma.role.findMany({
        include: {
            rolePermissions: {
                include: {
                    permission: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    });
}

/**
 * Get a role by ID with its permissions
 */
export async function getRoleById(id: string) {
    return prisma.role.findUnique({
        where: { id },
        include: {
            rolePermissions: {
                include: {
                    permission: true,
                },
            },
        },
    });
}

/**
 * Create a new role
 */
export async function createRole(data: {
    name: string;
    description?: string;
    isSystem?: boolean;
    permissionIds?: string[];
}, userId?: string) {
    const role = await prisma.role.create({
        data: {
            name: data.name,
            description: data.description,
            isSystem: data.isSystem || false,
            rolePermissions: data.permissionIds
                ? {
                    create: data.permissionIds.map(permissionId => ({
                        permissionId,
                        granted: true,
                    })),
                }
                : undefined,
        },
        include: {
            rolePermissions: {
                include: { permission: true },
            },
        },
    });

    if (userId) {
        await createAuditLog({
            action: 'CREATE_ROLE',
            entityType: 'ROLE',
            entityId: role.id,
            userId,
            details: `تم إنشاء دور جديد: ${data.name}`,
        });
    }

    return role;
}

/**
 * Assign permissions to a role
 */
export async function assignRolePermissions(
    roleId: string,
    permissionIds: string[],
    userId?: string
) {
    // Remove existing permissions
    await prisma.rolePermission.deleteMany({ where: { roleId } });

    // Assign new permissions
    const result = await prisma.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
            roleId,
            permissionId,
            granted: true,
        })),
    });

    if (userId) {
        const role = await prisma.role.findUnique({ where: { id: roleId } });
        await createAuditLog({
            action: 'ASSIGN_PERMISSION',
            entityType: 'ROLE',
            entityId: roleId,
            userId,
            details: {
                action: 'تحديث صلاحيات الدور',
                roleName: role?.name,
                permissionCount: permissionIds.length,
            },
        });
    }

    return result;
}

/**
 * Get all permissions (from DB)
 */
export async function getPermissions() {
    return prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { name: 'asc' }],
    });
}

/**
 * Check if user has hierarchy scope access to a target entity
 */
export async function hasHierarchyScopeAccess(
    user: RBACUser,
    targetHierarchyEntityId: string
): Promise<boolean> {
    if (user.role === 'SUPER_ADMIN') return true;

    const userEntityIds = user.hierarchyEntityIds || [];

    // Check each user entity
    for (const entityId of userEntityIds) {
        const descendantIds = await getDescendantEntityIds([entityId]);
        if (descendantIds.includes(targetHierarchyEntityId)) return true;
    }

    return false;
}