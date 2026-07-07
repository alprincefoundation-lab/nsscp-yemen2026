/**
 * HierarchyEngine v3.0 — Department-Aligned
 *
 * USES ONLY MODELS THAT ACTUALLY EXIST:
 *   - Department (unified tree)
 *   - User (belongs to department)
 */

import { prisma } from '@/lib/prisma';
import { createAuditLog, type AuditAction } from '@/lib/core/audit-engine';
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

// ── Tree-walking helpers (Department only) ──────────────

async function collectDescendantDepartments(departmentId: string): Promise<string[]> {
  const ids: string[] = [departmentId];
  const children = await prisma.department.findMany({
    where: { parentDepartmentId: departmentId },
    select: { id: true },
  });
  for (const child of children) {
    const childIds = await collectDescendantDepartments(child.id);
    ids.push(...childIds);
  }
  return ids;
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
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      include: { department: true },
    });
    
    const department = user?.department ?? null;
    const nodeId = department?.id || this.departmentId || null;

    return {
      userId: this.userId,
      role: this.role,
      hierarchyNodeId: nodeId,
      hierarchyNodeName: department?.nameAr || null,
      hierarchyNodeType: 'DEPARTMENT',
      parentNodeId: department?.parentDepartmentId || null,
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
    if (!this.departmentId) {
      const user = await prisma.user.findUnique({
        where: { id: this.userId },
        select: { departmentId: true }
      });
      if (user?.departmentId) {
        this.departmentId = user.departmentId;
      }
    }
    
    if (this.departmentId) {
      return collectDescendantDepartments(this.departmentId);
    }
    return [];
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
      { label: 'Dashboard', labelAr: 'لوحة القيادة', href: '/dashboard', icon: 'LayoutDashboard' },
    ];
    if (this.role === 'SUPER_ADMIN') {
      items.push({ label: 'Command Center', labelAr: 'مركز القيادة', href: '/', icon: 'Radio' });
    }
    items.push({ label: 'Cases', labelAr: 'القضايا', href: '/dashboard/cases', icon: 'FileText' });
    items.push({ label: 'Reports', labelAr: 'التقارير', href: '/dashboard/reports', icon: 'FileText' });
    items.push({ label: 'Archive', labelAr: 'الأرشيف', href: '/dashboard/archive', icon: 'Archive' });
    if (this.role === 'SUPER_ADMIN') {
      items.push({ label: 'Audit Logs', labelAr: 'سجل التدقيق', href: '/dashboard/audit', icon: 'ClipboardList' });
      items.push({ label: 'Settings', labelAr: 'الإعدادات', href: '/dashboard/settings', icon: 'Settings' });
    }
    return items;
  }

  // ── Users in scope ──────────────────────────────────────────

  async getUsersInScope(page = 1, pageSize = 50) {
    const ids = await this.getDescendantIds();
    const where: any = {};

    if (ids.length > 0) {
      where.departmentId = { in: ids };
    }

    const skip = (page - 1) * pageSize;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { department: true, roles: true }
      }),
      prisma.user.count({ where }),
    ]);

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
