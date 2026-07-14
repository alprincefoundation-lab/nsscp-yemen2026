/**
 * Permission system for NSSCP Platform
 * Role-based access control with multi-level RBAC
 * National Organizational Hierarchy
 * 
 * LEVEL 0: SUPER_ADMIN     — Ministry of Interior (Full System)
 * LEVEL 1: MINISTRY_ADMIN   — Ministry Admin (National View)
 * LEVEL 2: GOVERNORATE_ADMIN — Governorate Admin (Province Scope)
 * LEVEL 3: DEPARTMENT_HEAD   — Department Head (Department Scope)
 * LEVEL 4: SECTION_HEAD      — Section Head (Section Scope)
 * LEVEL 5: UNIT_HEAD         — Unit Head (Unit Scope)
 * LEVEL 6: OFFICER          — Officer (Unit Scope, Limited)
 * LEVEL 7: VIEWER           — Read-Only (Assigned Scope)
 * 
 * Legacy roles (DEPARTMENT_MANAGER, SECTION_MANAGER, DATA_ENTRY, VIEW_ONLY)
 * are kept for backward compatibility.
 * 
 * All entity-level access is managed through HierarchyEntity + HierarchyUser.
 */

export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    MINISTRY_ADMIN = 'MINISTRY_ADMIN',
    GOVERNORATE_ADMIN = 'GOVERNORATE_ADMIN',
    DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
    SECTION_HEAD = 'SECTION_HEAD',
    UNIT_HEAD = 'UNIT_HEAD',
    OFFICER = 'OFFICER',
    VIEWER = 'VIEWER',
    // Legacy aliases — kept for backward compatibility
    DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER',
    SECTION_MANAGER = 'SECTION_MANAGER',
    DATA_ENTRY = 'DATA_ENTRY',
    VIEW_ONLY = 'VIEW_ONLY',
}

export enum Permission {
    MANAGE_SYSTEM = 'MANAGE_SYSTEM',
    VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
    MANAGE_ROLES = 'MANAGE_ROLES',
    CREATE_USER = 'CREATE_USER',
    READ_USER = 'READ_USER',
    UPDATE_USER = 'UPDATE_USER',
    DELETE_USER = 'DELETE_USER',
    MANAGE_HIERARCHY = 'MANAGE_HIERARCHY',
    VIEW_HIERARCHY = 'VIEW_HIERARCHY',
    CREATE_CASE = 'CREATE_CASE',
    READ_CASE = 'READ_CASE',
    UPDATE_CASE = 'UPDATE_CASE',
    DELETE_CASE = 'DELETE_CASE',
    CREATE_REPORT = 'CREATE_REPORT',
    READ_REPORT = 'READ_REPORT',
    UPDATE_REPORT = 'UPDATE_REPORT',
    DELETE_REPORT = 'DELETE_REPORT',
    CREATE_VEHICLE = 'CREATE_VEHICLE',
    READ_VEHICLE = 'READ_VEHICLE',
    UPDATE_VEHICLE = 'UPDATE_VEHICLE',
    DELETE_VEHICLE = 'DELETE_VEHICLE',
    CREATE_WEAPON = 'CREATE_WEAPON',
    READ_WEAPON = 'READ_WEAPON',
    UPDATE_WEAPON = 'UPDATE_WEAPON',
    CREATE_EVIDENCE = 'CREATE_EVIDENCE',
    READ_EVIDENCE = 'READ_EVIDENCE',
    UPDATE_EVIDENCE = 'UPDATE_EVIDENCE',
    DELETE_EVIDENCE = 'DELETE_EVIDENCE',
    CREATE_OFFICER = 'CREATE_OFFICER',
    READ_OFFICER = 'READ_OFFICER',
    UPDATE_OFFICER = 'UPDATE_OFFICER',
    DELETE_OFFICER = 'DELETE_OFFICER',
    CREATE_WANTED = 'CREATE_WANTED',
    READ_WANTED = 'READ_WANTED',
    UPDATE_WANTED = 'UPDATE_WANTED',
    DELETE_WANTED = 'DELETE_WANTED',
    MANAGE_SETTINGS = 'MANAGE_SETTINGS',
    VIEW_STATISTICS = 'VIEW_STATISTICS',
    MANAGE_NOTIFICATIONS = 'MANAGE_NOTIFICATIONS',
    EXPORT_DATA = 'EXPORT_DATA',
}

export const ROLE_LEVELS: Record<Role, number> = {
    [Role.SUPER_ADMIN]: 0,
    [Role.MINISTRY_ADMIN]: 1,
    [Role.GOVERNORATE_ADMIN]: 2,
    [Role.DEPARTMENT_HEAD]: 3,
    [Role.SECTION_HEAD]: 4,
    [Role.UNIT_HEAD]: 5,
    [Role.OFFICER]: 6,
    [Role.VIEWER]: 7,
    // Legacy
    [Role.DEPARTMENT_MANAGER]: 3,
    [Role.SECTION_MANAGER]: 4,
    [Role.DATA_ENTRY]: 6,
    [Role.VIEW_ONLY]: 7,
};

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.SUPER_ADMIN]: Object.values(Permission),
    [Role.MINISTRY_ADMIN]: Object.values(Permission),
    [Role.GOVERNORATE_ADMIN]: [
        Permission.MANAGE_HIERARCHY, Permission.VIEW_HIERARCHY,
        Permission.CREATE_USER, Permission.READ_USER, Permission.UPDATE_USER, Permission.DELETE_USER,
        Permission.CREATE_CASE, Permission.READ_CASE, Permission.UPDATE_CASE, Permission.DELETE_CASE,
        Permission.CREATE_REPORT, Permission.READ_REPORT, Permission.UPDATE_REPORT, Permission.DELETE_REPORT,
        Permission.CREATE_VEHICLE, Permission.READ_VEHICLE, Permission.UPDATE_VEHICLE, Permission.DELETE_VEHICLE,
        Permission.CREATE_WEAPON, Permission.READ_WEAPON, Permission.UPDATE_WEAPON,
        Permission.CREATE_EVIDENCE, Permission.READ_EVIDENCE, Permission.UPDATE_EVIDENCE, Permission.DELETE_EVIDENCE,
        Permission.CREATE_OFFICER, Permission.READ_OFFICER, Permission.UPDATE_OFFICER, Permission.DELETE_OFFICER,
        Permission.CREATE_WANTED, Permission.READ_WANTED, Permission.UPDATE_WANTED, Permission.DELETE_WANTED,
        Permission.MANAGE_SETTINGS, Permission.VIEW_STATISTICS, Permission.MANAGE_NOTIFICATIONS,
        Permission.EXPORT_DATA, Permission.VIEW_AUDIT_LOGS,
    ],
    [Role.DEPARTMENT_MANAGER]: [
        Permission.VIEW_HIERARCHY,
        Permission.CREATE_USER, Permission.READ_USER, Permission.UPDATE_USER,
        Permission.CREATE_CASE, Permission.READ_CASE, Permission.UPDATE_CASE, Permission.DELETE_CASE,
        Permission.CREATE_REPORT, Permission.READ_REPORT, Permission.UPDATE_REPORT, Permission.DELETE_REPORT,
        Permission.CREATE_VEHICLE, Permission.READ_VEHICLE, Permission.UPDATE_VEHICLE,
        Permission.CREATE_WEAPON, Permission.READ_WEAPON,
        Permission.CREATE_EVIDENCE, Permission.READ_EVIDENCE, Permission.UPDATE_EVIDENCE,
        Permission.CREATE_OFFICER, Permission.READ_OFFICER, Permission.UPDATE_OFFICER,
        Permission.CREATE_WANTED, Permission.READ_WANTED, Permission.UPDATE_WANTED,
        Permission.VIEW_STATISTICS, Permission.MANAGE_NOTIFICATIONS,
    ],
    [Role.DEPARTMENT_HEAD]: [
        Permission.MANAGE_HIERARCHY, Permission.VIEW_HIERARCHY,
        Permission.CREATE_USER, Permission.READ_USER, Permission.UPDATE_USER,
        Permission.CREATE_CASE, Permission.READ_CASE, Permission.UPDATE_CASE, Permission.DELETE_CASE,
        Permission.CREATE_REPORT, Permission.READ_REPORT, Permission.UPDATE_REPORT, Permission.DELETE_REPORT,
        Permission.CREATE_VEHICLE, Permission.READ_VEHICLE, Permission.UPDATE_VEHICLE,
        Permission.CREATE_WEAPON, Permission.READ_WEAPON,
        Permission.CREATE_EVIDENCE, Permission.READ_EVIDENCE, Permission.UPDATE_EVIDENCE,
        Permission.CREATE_OFFICER, Permission.READ_OFFICER, Permission.UPDATE_OFFICER,
        Permission.CREATE_WANTED, Permission.READ_WANTED, Permission.UPDATE_WANTED,
        Permission.VIEW_STATISTICS, Permission.MANAGE_NOTIFICATIONS,
    ],
    [Role.SECTION_HEAD]: [
        Permission.VIEW_HIERARCHY,
        Permission.CREATE_USER, Permission.READ_USER, Permission.UPDATE_USER,
        Permission.CREATE_CASE, Permission.READ_CASE, Permission.UPDATE_CASE,
        Permission.CREATE_REPORT, Permission.READ_REPORT, Permission.UPDATE_REPORT,
        Permission.CREATE_VEHICLE, Permission.READ_VEHICLE, Permission.UPDATE_VEHICLE,
        Permission.CREATE_WEAPON, Permission.READ_WEAPON,
        Permission.CREATE_EVIDENCE, Permission.READ_EVIDENCE, Permission.UPDATE_EVIDENCE,
        Permission.CREATE_OFFICER, Permission.READ_OFFICER, Permission.UPDATE_OFFICER,
        Permission.CREATE_WANTED, Permission.READ_WANTED, Permission.UPDATE_WANTED,
        Permission.VIEW_STATISTICS,
    ],
    [Role.UNIT_HEAD]: [
        Permission.VIEW_HIERARCHY,
        Permission.CREATE_CASE, Permission.READ_CASE, Permission.UPDATE_CASE,
        Permission.CREATE_REPORT, Permission.READ_REPORT,
        Permission.CREATE_EVIDENCE, Permission.READ_EVIDENCE, Permission.UPDATE_EVIDENCE,
        Permission.READ_OFFICER, Permission.READ_WANTED, Permission.CREATE_WANTED,
        Permission.READ_VEHICLE, Permission.CREATE_VEHICLE,
        Permission.READ_WEAPON, Permission.CREATE_WEAPON,
        Permission.VIEW_STATISTICS,
    ],
    [Role.VIEWER]: [
        Permission.VIEW_HIERARCHY,
        Permission.READ_CASE, Permission.READ_REPORT, Permission.READ_VEHICLE,
        Permission.READ_WEAPON, Permission.READ_EVIDENCE, Permission.READ_OFFICER,
        Permission.READ_WANTED, Permission.VIEW_STATISTICS,
    ],
    // Legacy
    [Role.SECTION_MANAGER]: [
        Permission.VIEW_HIERARCHY,
        Permission.CREATE_USER, Permission.READ_USER, Permission.UPDATE_USER,
        Permission.CREATE_CASE, Permission.READ_CASE, Permission.UPDATE_CASE,
        Permission.CREATE_REPORT, Permission.READ_REPORT, Permission.UPDATE_REPORT,
        Permission.CREATE_VEHICLE, Permission.READ_VEHICLE, Permission.UPDATE_VEHICLE,
        Permission.CREATE_WEAPON, Permission.READ_WEAPON,
        Permission.CREATE_EVIDENCE, Permission.READ_EVIDENCE, Permission.UPDATE_EVIDENCE,
        Permission.CREATE_OFFICER, Permission.READ_OFFICER, Permission.UPDATE_OFFICER,
        Permission.CREATE_WANTED, Permission.READ_WANTED, Permission.UPDATE_WANTED,
        Permission.VIEW_STATISTICS,
    ],
    [Role.OFFICER]: [
        Permission.VIEW_HIERARCHY,
        Permission.CREATE_CASE, Permission.READ_CASE, Permission.UPDATE_CASE,
        Permission.CREATE_REPORT, Permission.READ_REPORT,
        Permission.CREATE_EVIDENCE, Permission.READ_EVIDENCE, Permission.UPDATE_EVIDENCE,
        Permission.READ_OFFICER, Permission.READ_WANTED, Permission.CREATE_WANTED,
        Permission.READ_VEHICLE, Permission.CREATE_VEHICLE,
        Permission.READ_WEAPON, Permission.CREATE_WEAPON,
    ],
    [Role.DATA_ENTRY]: [
        Permission.VIEW_HIERARCHY,
        Permission.CREATE_CASE, Permission.READ_CASE, Permission.UPDATE_CASE,
        Permission.CREATE_REPORT, Permission.READ_REPORT,
        Permission.CREATE_EVIDENCE, Permission.READ_EVIDENCE,
        Permission.READ_OFFICER, Permission.READ_WANTED, Permission.CREATE_WANTED,
        Permission.READ_VEHICLE, Permission.CREATE_VEHICLE,
        Permission.READ_WEAPON, Permission.CREATE_WEAPON,
    ],
    [Role.VIEW_ONLY]: [
        Permission.VIEW_HIERARCHY,
        Permission.READ_CASE, Permission.READ_REPORT, Permission.READ_VEHICLE,
        Permission.READ_WEAPON, Permission.READ_EVIDENCE, Permission.READ_OFFICER,
        Permission.READ_WANTED, Permission.VIEW_STATISTICS,
    ],
};

export function hasPermission(role: Role | string, permission: Permission): boolean {
    return (ROLE_PERMISSIONS[role as Role] || []).includes(permission);
}

export function hasAllPermissions(role: Role | string, permissions: Permission[]): boolean {
    return permissions.every((p) => hasPermission(role, p));
}

export function hasAnyPermission(role: Role | string, permissions: Permission[]): boolean {
    return permissions.some((p) => hasPermission(role, p));
}

export function getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
}

export function hasSufficientLevel(userRole: Role, requiredLevel: number): boolean {
    const userLevel = ROLE_LEVELS[userRole];
    if (userLevel === undefined) return false;
    return userLevel <= requiredLevel;
}

export function isSuperAdmin(role: Role | string): boolean {
    return role === Role.SUPER_ADMIN;
}

export function canManageHierarchy(role: Role | string): boolean {
    return role === Role.SUPER_ADMIN || role === Role.GOVERNORATE_ADMIN;
}

export function getDataScope(role: Role): 'system' | 'hierarchy' | 'self' {
    switch (role) {
        case Role.SUPER_ADMIN: return 'system';
        case Role.GOVERNORATE_ADMIN:
        case Role.DEPARTMENT_MANAGER:
        case Role.SECTION_MANAGER: return 'hierarchy';
        default: return 'self';
    }
}

export const ROLE_ARABIC_NAMES: Record<Role, string> = {
    [Role.SUPER_ADMIN]: 'مدير النظام العام',
    [Role.MINISTRY_ADMIN]: 'مدير الوزارة',
    [Role.GOVERNORATE_ADMIN]: 'مدير المحافظة',
    [Role.DEPARTMENT_HEAD]: 'مدير الإدارة',
    [Role.SECTION_HEAD]: 'مدير القسم',
    [Role.UNIT_HEAD]: 'مدير الوحدة',
    [Role.OFFICER]: 'ضابط',
    [Role.VIEWER]: 'مشاهد فقط',
    // Legacy
    [Role.DEPARTMENT_MANAGER]: 'مدير الإدارة',
    [Role.SECTION_MANAGER]: 'مدير القسم',
    [Role.DATA_ENTRY]: 'إدخال بيانات',
    [Role.VIEW_ONLY]: 'عرض فقط',
};
