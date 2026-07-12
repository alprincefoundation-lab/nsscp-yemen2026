/**
 * HierarchyEngine v3.0 — Department-Aligned
 *
 * USES ONLY MODELS THAT ACTUALLY EXIST:
 *   - Department (unified tree)
 *   - User (belongs to department)
 */

import { prisma } from '@/lib/prisma';
import { createAuditLog, type AuditAction } from '@/lib/core/audit-engine';
import { getEntityBreadcrumb, getDescendantIds as getHierarchyDescendantIds } from '@/lib/hierarchy-service';
import type {
  HierarchyContext,
  ScopeFilter,
  DashboardScope,
  SidebarMenuItem,
  DashboardRedirect,
  EngineUserInput,
} from './types';

// ── Constants ────────────────────────────────────────────────

const ROLE_LEVEL_MAP: Record<string, number> = {
  SUPER_ADMIN: 1,
  GOVERNORATE_ADMIN: 2,
  DEPARTMENT_MANAGER: 3,
  SECTION_MANAGER: 4,
  OFFICER: 5,
  DATA_ENTRY: 6,
  VIEW_ONLY: 7,
};

const SCOPE_LABELS: Record<string, { en: string; ar: string }> = {
  republic: { en: 'Entire Republic', ar: 'الجمهورية بأكملها' },
  governorate: { en: 'Governorate', ar: 'المحافظة' },
  department: { en: 'Department', ar: 'الإدارة' },
  section: { en: 'Section', ar: 'القسم' },
  self: { en: 'Self', ar: 'الشخصي' },
};

async function resolveHierarchyNodeId(userId: string, fallbackNodeId: string | null): Promise<string | null> {
  if (fallbackNodeId) return fallbackNodeId;

  const assignment = await prisma.levelAssignment.findFirst({
    where: { officerId: userId },
    select: { unitId: true },
    orderBy: { createdAt: 'asc' },
  });

  return assignment?.unitId || null;
}

// ── HierarchyEngine ──────────────────────────────────────────

export class HierarchyEngine {
  private userId: string;
  private role: string;
  private departmentId: string | null;

  constructor(input: EngineUserInput) {
    this.userId = input.id;
    this.role = input.role;
    this.departmentId = input.departmentId || input.hierarchyNodeId || null;
  }

  // ── Context resolution ──────────────────────────────────────

  async getContext(): Promise<HierarchyContext> {
    const nodeId = await resolveHierarchyNodeId(this.userId, this.departmentId);
    const breadcrumb = nodeId ? await getEntityBreadcrumb(nodeId) : [];
    const currentNode = breadcrumb.at(-1) || null;
    const parentNode = breadcrumb.at(-2) || null;

    return {
      userId: this.userId,
      role: this.role,
      hierarchyNodeId: nodeId,
      hierarchyNodeName: currentNode?.name || null,
      hierarchyNodeType: currentNode?.type || null,
      parentNodeId: parentNode?.id || null,
      clearance: this.getClearance(this.role),
    };
  }

  private getClearance(role: string): string {
    const level = ROLE_LEVEL_MAP[role] || 99;
    if (level <= 1) return 'TOP_SECRET';
    if (level <= 2) return 'SECRET';
    if (level <= 3) return 'CONFIDENTIAL';
    if (level <= 4) return 'RESTRICTED';
    return 'UNCLASSIFIED';
  }

  // ── Scope (data isolation) ──────────────────────────────────

  async getScope(): Promise<ScopeFilter> {
    if (this.role === 'SUPER_ADMIN') return {};
    const ids = await this.getDescendantIds();
    if (ids.length > 0) {
      return { departmentId: { in: ids } };
    }
    if (['OFFICER', 'DATA_ENTRY', 'VIEW_ONLY'].includes(this.role)) {
      return { createdById: this.userId };
    }
    return {};
  }

  async getDescendantIds(): Promise<string[]> {
    const nodeId = await resolveHierarchyNodeId(this.userId, this.departmentId);
    if (!nodeId) return [];
    this.departmentId = nodeId;
    return getHierarchyDescendantIds(nodeId);
  }

  // ── Access checks ───────────────────────────────────────────

  async canAccessEntity(departmentId: string): Promise<boolean> {
    if (this.role === 'SUPER_ADMIN') return true;
    const ids = await this.getDescendantIds();
    return ids.includes(departmentId);
  }

  async canAccessHierarchy(targetNodeId: string): Promise<boolean> {
    return this.canAccessEntity(targetNodeId);
  }

  // ── Dashboard scope ─────────────────────────────────────────

  async getDashboardScope(): Promise<DashboardScope> {
    const ids = await this.getDescendantIds();
    const level = this._getDashboardLevel();
    const labels = SCOPE_LABELS[level] || SCOPE_LABELS.self;

    return {
      level: level as DashboardScope['level'],
      departmentIds: ids,
      label: labels.en,
      labelAr: labels.ar,
    };
  }

  private _getDashboardLevel(): string {
    switch (this.role) {
      case 'SUPER_ADMIN': return 'republic';
      case 'GOVERNORATE_ADMIN': return 'governorate';
      case 'DEPARTMENT_MANAGER': return 'department';
      case 'SECTION_MANAGER': return 'section';
      default: return 'self';
    }
  }

  // ── Navigation ──────────────────────────────────────────────

  getDashboardRedirect(): DashboardRedirect {
    const map: Record<string, { en: string; ar: string }> = {
      SUPER_ADMIN: { en: 'National Command Center', ar: 'مركز القيادة الوطني' },
      GOVERNORATE_ADMIN: { en: 'Governorate Dashboard', ar: 'لوحة محافظة' },
      DEPARTMENT_MANAGER: { en: 'Department Dashboard', ar: 'لوحة إدارة' },
      SECTION_MANAGER: { en: 'Section Dashboard', ar: 'لوحة قسم' },
    };
    const d = map[this.role] || { en: 'Personal Dashboard', ar: 'لوحتي الشخصية' };
    return { url: '/dashboard', label: d.en, labelAr: d.ar };
  }

  getSidebarMenu(): SidebarMenuItem[] {
    const items: SidebarMenuItem[] = [
      { label: 'الرئيسية', labelAr: 'الرئيسية', href: '/dashboard', icon: 'LayoutDashboard' },
      { label: 'لوحة القيادة', labelAr: 'لوحة القيادة', href: '/dashboard/command-center', icon: 'Radio' },
      { label: 'العمليات', labelAr: 'العمليات', href: '/dashboard/operations', icon: 'Activity' },
      { label: 'القضايا', labelAr: 'القضايا', href: '/dashboard/cases', icon: 'FileText' },
      { label: 'المطلوبون', labelAr: 'المطلوبون', href: '/dashboard/wanted-persons', icon: 'Shield' },
      { label: 'التقارير', labelAr: 'التقارير', href: '/dashboard/reports', icon: 'ClipboardList' },
      { label: 'الأرشيف', labelAr: 'الأرشيف', href: '/dashboard/archive', icon: 'Archive' },
      { label: 'الإدارات', labelAr: 'الإدارات', href: '/dashboard/departments', icon: 'Building2' },
      { label: 'الأقسام', labelAr: 'الأقسام', href: '/dashboard/sections', icon: 'Layers' },
      { label: 'المستخدمون', labelAr: 'المستخدمون', href: '/dashboard/users', icon: 'Users' },
      {
        label: 'الأدوار والصلاحيات',
        labelAr: 'الأدوار والصلاحيات',
        href: '/dashboard/roles',
        icon: 'Key',
        children: [
          { label: 'الأدوار', labelAr: 'الأدوار', href: '/dashboard/roles', icon: 'Key' },
          { label: 'الصلاحيات', labelAr: 'الصلاحيات', href: '/dashboard/permissions', icon: 'Shield' },
        ],
      },
      { label: 'الإعدادات', labelAr: 'الإعدادات', href: '/dashboard/settings', icon: 'Settings' },
    ];

    if (this.role === 'SUPER_ADMIN') {
      return items;
    }

    return items.filter((item) => !['/dashboard/users', '/dashboard/roles', '/dashboard/settings'].includes(item.href));
  }

  // ── Users in scope ──────────────────────────────────────────

  async getUsersInScope(page = 1, pageSize = 50) {
    const ids = await this.getDescendantIds();
    const skip = (page - 1) * pageSize;
    const where = ids.length > 0 ? { unitId: { in: ids } } : {};
    const [assignments, total] = await Promise.all([
      prisma.levelAssignment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { Officer: true },
      }),
      prisma.levelAssignment.count({ where }),
    ]);

    const users = assignments.map((assignment) => assignment.Officer).filter(Boolean);
    return { users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  // ── Audit ───────────────────────────────────────────────────

  async audit(action: string, entityType: string, entityId: string, details?: Record<string, unknown> | null) {
    const ctx = await this.getContext();
    return createAuditLog({
      action: action as any,
      entityType: entityType as any,
      entityId,
      userId: this.userId,
      details: details || null,
      hierarchyEntityId: ctx.hierarchyNodeId,
      hierarchyEntityType: 'DEPARTMENT',
    });
  }
}

// ── Factory helpers ───────────────────────────────────────────

export function createEngine(
  userId: string,
  role: string,
  departmentId?: string | null,
): HierarchyEngine {
  return new HierarchyEngine({ id: userId, role, departmentId });
}

export function createEngineFromAuth(user: EngineUserInput): HierarchyEngine {
  return new HierarchyEngine(user);
}

export type { SidebarMenuItem } from './types';
