/**
 * Unified Hierarchy Types — Schema-Aligned (v3.0)
 *
 * All types reflect ONLY what exists in prisma/schema.prisma:
 *   - User: id, email, militaryId, fullName, rank, departmentId, isActive
 *   - Department: id, code, nameAr, nameEn, parentDepartmentId
 *
 * The Department tree handles all organizational levels.
 */

// ── Raw schema types ──────────────────────────────────────────

export interface HierarchyNode {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  parentDepartmentId: string | null;
  parent?: HierarchyNode | null;
  children?: HierarchyNode[];
  _count?: {
    users: number;
    childDepartments: number;
  };
}

export interface UserRecord {
  id: string;
  email: string;
  militaryId: string;
  fullName: string;
  rank: string;
  departmentId: string;
  isActive: boolean;
  createdAt?: Date;
}

// ── Runtime context (resolved from schema) ────────────────────

export interface HierarchyContext {
  userId: string;
  role: string;
  hierarchyNodeId: string | null;
  hierarchyNodeName: string | null;
  hierarchyNodeType: string | null;
  parentNodeId: string | null;
  clearance: string;
}

// ── Scope filter (applied to Prisma where clauses) ────────────

/**
 * Data isolation filter.
 * ALL current data models (Case, Incident, etc.) use `departmentId`.
 */
export interface ScopeFilter {
  departmentId?: string | { in: string[] };
  createdById?: string;
}

// ── Dashboard scope ──────────────────────────────────────────

export type DashboardLevel = 'republic' | 'governorate' | 'department' | 'section' | 'self';

export interface DashboardScope {
  level: DashboardLevel;
  departmentIds: string[];
  label: string;
  labelAr: string;
}

// ── Factory / helper input types ─────────────────────────────

export interface EngineUserInput {
  id: string;
  role: string;
  departmentId?: string | null;
  // Legacy support for guard
  hierarchyNodeId?: string | null;
}

// ── Sidebar ──────────────────────────────────────────────────

export interface SidebarMenuItem {
  label: string;
  labelAr: string;
  href: string;
  icon: string;
  permission?: string;
  children?: SidebarMenuItem[];
  badge?: string;
}

export interface DashboardRedirect {
  url: string;
  label: string;
  labelAr: string;
}
