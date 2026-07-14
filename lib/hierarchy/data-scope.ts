/**
 * Data Scope Engine — NSSCP National Hierarchical Security Architecture
 * 
 * Implements multi-level data isolation based on the organizational hierarchy:
 * 
 *   SUPER_ADMIN / MINISTRY_ADMIN → National scope (all data)
 *   GOVERNORATE_ADMIN → Province scope (one governorate + children)
 *   DEPARTMENT_HEAD    → Level3Unit scope (one department + children)
 *   SECTION_HEAD       → Level4Department scope (one section + children)
 *   UNIT_HEAD          → Level5Section scope (one unit + children)
 *   OFFICER            → Self scope (own unit only)
 *   VIEWER             → Self scope (read-only)
 * 
 * Each scope resolves to a set of hierarchy entity IDs that the user can access.
 */

import { prisma } from '@/lib/prisma';
import { Role, Role as RoleEnum } from '@/lib/permissions';
import type { AuthenticatedUser } from '@/lib/auth/auth.types';

// ─── Types ──────────────────────────────────────────────────────────────

export type ScopeLevel =
  | 'national'
  | 'province'
  | 'department'
  | 'section'
  | 'unit'
  | 'self';

export interface DataScope {
  level: ScopeLevel;
  labelAr: string;
  labelEn: string;
  /** Hierarchy entity IDs the user can access (empty = all) */
  allowedEntityIds: string[];
  /** Prisma where clause keys to apply */
  filterKeys: string[];
  /** Foreign key paths to apply scope to */
  scopePaths: string[];
}

export interface ScopeContext {
  userId: string;
  role: string;
  hierarchyEntityId: string | null;
  hierarchyEntityType: string | null;
}

// ─── Hebrew labels ─────────────────────────────────────────────────────

const SCOPE_LABELS: Record<ScopeLevel, { ar: string; en: string }> = {
  national: { ar: 'الجمهورية اليمنية', en: 'Republic of Yemen' },
  province: { ar: 'المحافظة', en: 'Governorate' },
  department: { ar: 'الإدارة', en: 'Department' },
  section: { ar: 'القسم', en: 'Section' },
  unit: { ar: 'الوحدة', en: 'Unit' },
  self: { ar: 'نطاقي الشخصي', en: 'Personal Scope' },
};

// ─── Role → Scope Level ─────────────────────────────────────────────────

export function getScopeLevel(role: string): ScopeLevel {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'MINISTRY_ADMIN':
      return 'national';
    case 'GOVERNORATE_ADMIN':
      return 'province';
    case 'DEPARTMENT_HEAD':
    case 'DEPARTMENT_MANAGER':
      return 'department';
    case 'SECTION_HEAD':
    case 'SECTION_MANAGER':
      return 'section';
    case 'UNIT_HEAD':
      return 'unit';
    default:
      return 'self';
  }
}

// ─── Descendant resolution ─────────────────────────────────────────────

/**
 * Resolves ALL descendent IDs from a given hierarchy entity.
 * Uses the existing 6-level model: CentralCommand → Province → Level3 → Level4 → Level5 → Level6
 */
export async function getDescendantEntityIds(entityId: string): Promise<string[]> {
  const ids: string[] = [entityId];

  // Province children
  const provinces = await prisma.province.findMany({
    where: { centralCommandId: entityId },
    select: { id: true },
  });
  for (const p of provinces) {
    ids.push(p.id);
    ids.push(...(await getDescendantEntityIds(p.id)));
  }

  // Level3 children
  const level3s = await prisma.level3Unit.findMany({
    where: { provinceId: entityId },
    select: { id: true },
  });
  for (const l3 of level3s) {
    ids.push(l3.id);
    ids.push(...(await getDescendantEntityIds(l3.id)));
  }

  // Level4 children
  const level4s = await prisma.level4Department.findMany({
    where: { level3UnitId: entityId },
    select: { id: true },
  });
  for (const l4 of level4s) {
    ids.push(l4.id);
    ids.push(...(await getDescendantEntityIds(l4.id)));
  }

  // Level5 children
  const level5s = await prisma.level5Section.findMany({
    where: { level4DepartmentId: entityId },
    select: { id: true },
  });
  for (const l5 of level5s) {
    ids.push(l5.id);
    ids.push(...(await getDescendantEntityIds(l5.id)));
  }

  // Level6 children
  const level6s = await prisma.level6Unit.findMany({
    where: { level5SectionId: entityId },
    select: { id: true },
  });
  for (const l6 of level6s) {
    ids.push(l6.id);
  }

  return ids;
}

/**
 * Resolve which hierarchy entity the user belongs to.
 */
async function resolveUserEntity(ctx: ScopeContext): Promise<string | null> {
  if (ctx.hierarchyEntityId) return ctx.hierarchyEntityId;

  // Try to find from LevelAssignment
  const assignment = await prisma.levelAssignment.findFirst({
    where: { officerId: ctx.userId },
    select: { unitId: true },
    orderBy: { createdAt: 'asc' },
  });
  if (assignment) return assignment.unitId;

  // Try AuthSession
  const session = await prisma.authSession.findFirst({
    where: { officerId: ctx.userId, isValid: true },
    select: { hierarchyEntityId: true },
    orderBy: { lastActive: 'desc' },
  });
  return session?.hierarchyEntityId || null;
}

/**
 * Find the entity at the appropriate scope level for the user.
 * E.g., a GOVERNORATE_ADMIN assigned to a Level5 unit should still get
 * the Province-level ancestor.
 */
async function resolveEntityAtScopeLevel(
  entityId: string,
  targetLevel: ScopeLevel,
): Promise<string | null> {
  // Walk up the hierarchy until we find the right level
  let current = entityId;
  let depth = 0;
  const MAX_DEPTH = 10;

  while (depth < MAX_DEPTH) {
    const node = await fetchEntityById(current);
    if (!node) break;

    const nodeLevel = getEntityScopeLevel(node);
    if (nodeLevel === targetLevel) return current;

    // Walk up to parent
    if (node.parentId) {
      current = node.parentId;
      depth++;
    } else {
      break;
    }
  }

  return entityId; // Fallback
}

async function fetchEntityById(
  id: string,
): Promise<{ id: string; type: string; parentId: string | null } | null> {
  // Try each model
  const cc = await prisma.centralCommand.findUnique({ where: { id }, select: { id: true } });
  if (cc) return { id: cc.id, type: 'MINISTRY', parentId: null };

  const p = await prisma.province.findUnique({ where: { id }, select: { id: true, centralCommandId: true } });
  if (p) return { id: p.id, type: 'PROVINCE', parentId: p.centralCommandId };

  const l3 = await prisma.level3Unit.findUnique({ where: { id }, select: { id: true, provinceId: true } });
  if (l3) return { id: l3.id, type: 'DEPARTMENT', parentId: l3.provinceId };

  const l4 = await prisma.level4Department.findUnique({ where: { id }, select: { id: true, level3UnitId: true } });
  if (l4) return { id: l4.id, type: 'SECTION', parentId: l4.level3UnitId };

  const l5 = await prisma.level5Section.findUnique({ where: { id }, select: { id: true, level4DepartmentId: true } });
  if (l5) return { id: l5.id, type: 'UNIT', parentId: l5.level4DepartmentId };

  const l6 = await prisma.level6Unit.findUnique({ where: { id }, select: { id: true, level5SectionId: true } });
  if (l6) return { id: l6.id, type: 'POLICE_STATION', parentId: l6.level5SectionId };

  return null;
}

function getEntityScopeLevel(entity: { type: string }): ScopeLevel {
  switch (entity.type) {
    case 'MINISTRY': return 'national';
    case 'PROVINCE': return 'province';
    case 'DEPARTMENT': return 'department';
    case 'SECTION': return 'section';
    case 'UNIT':
    case 'POLICE_STATION':
      return 'unit';
    default:
      return 'self';
  }
}

// ─── Main Data Scope Resolution ────────────────────────────────────────

export async function resolveDataScope(ctx: ScopeContext): Promise<DataScope> {
  const scopeLevel = getScopeLevel(ctx.role);

  // National scope
  if (scopeLevel === 'national') {
    return {
      level: 'national',
      labelAr: SCOPE_LABELS.national.ar,
      labelEn: SCOPE_LABELS.national.en,
      allowedEntityIds: [],
      filterKeys: [],
      scopePaths: [],
    };
  }

  // Resolve user's entity
  let entityId = await resolveUserEntity(ctx);
  if (!entityId) {
    // No hierarchy assignment — self scope only
    return {
      level: 'self',
      labelAr: SCOPE_LABELS.self.ar,
      labelEn: SCOPE_LABELS.self.en,
      allowedEntityIds: [ctx.userId],
      filterKeys: ['createdById'],
      scopePaths: ['createdById'],
    };
  }

  // Resolve to the correct scope level
  const resolvedId = await resolveEntityAtScopeLevel(entityId, scopeLevel);
  if (!resolvedId) {
    return {
      level: 'self',
      labelAr: SCOPE_LABELS.self.ar,
      labelEn: SCOPE_LABELS.self.en,
      allowedEntityIds: [ctx.userId],
      filterKeys: ['createdById'],
      scopePaths: ['createdById'],
    };
  }
  entityId = resolvedId;

  // Get all descendants
  const ids = await getDescendantEntityIds(entityId);

  return {
    level: scopeLevel,
    labelAr: SCOPE_LABELS[scopeLevel].ar,
    labelEn: SCOPE_LABELS[scopeLevel].en,
    allowedEntityIds: ids,
    filterKeys: getFilterKeysForLevel(scopeLevel),
    scopePaths: getScopePathsForLevel(scopeLevel),
  };
}

// ─── Filter key resolution ─────────────────────────────────────────────

function getFilterKeysForLevel(level: ScopeLevel): string[] {
  switch (level) {
    case 'national':
      return [];
    case 'province':
      return ['provinceId'];
    case 'department':
      return ['departmentId', 'provinceId'];
    case 'section':
      return ['departmentId'];
    case 'unit':
      return ['unitId', 'departmentId'];
    case 'self':
      return ['createdById'];
  }
}

function getScopePathsForLevel(level: ScopeLevel): string[] {
  switch (level) {
    case 'national':
      return [];
    case 'province':
      return ['provinceId', 'province', 'governorateId'];
    case 'department':
      return ['departmentId', 'level3UnitId', 'provinceId'];
    case 'section':
      return ['departmentId', 'level4DepartmentId'];
    case 'unit':
      return ['unitId', 'level5SectionId', 'level6UnitId'];
    case 'self':
      return ['createdById', 'officerId'];
  }
}

// ─── Prisma Where Builder ──────────────────────────────────────────────

/**
 * Build a Prisma where clause that enforces data scope.
 * 
 * Usage:
 * ```
 * const scope = await resolveDataScope(ctx);
 * const where = applyDataScope({}, scope);
 * const cases = await prisma.case.findMany({ where });
 * ```
 */
export function applyDataScope<T extends Record<string, unknown>>(
  baseWhere: T,
  scope: DataScope,
  modelFieldMapping?: Record<string, string>,
): T & { OR?: Record<string, unknown>[] } {
  if (scope.level === 'national' || scope.allowedEntityIds.length === 0) {
    return baseWhere as T & { OR?: Record<string, unknown>[] };
  }

  const OR: Record<string, unknown>[] = [];

  for (const key of scope.scopePaths) {
    const mappedKey = modelFieldMapping?.[key] || key;
    OR.push({ [mappedKey]: { in: scope.allowedEntityIds } });
  }

  // For self scope
  if (scope.level === 'self') {
    OR.push({ createdById: scope.allowedEntityIds[0] });
  }

  return { ...baseWhere, OR } as T & { OR?: Record<string, unknown>[] };
}

// ─── Helper: Build scope for API queries ────────────────────────────────

export async function getApiScope(
  userId: string,
  role: string,
  hierarchyEntityId?: string | null,
): Promise<DataScope> {
  return resolveDataScope({
    userId,
    role,
    hierarchyEntityId: hierarchyEntityId || null,
    hierarchyEntityType: null,
  });
}

export async function getHierarchyScope(user: AuthenticatedUser): Promise<DataScope> {
  return resolveDataScope({
    userId: user.id,
    role: user.role,
    hierarchyEntityId: user.hierarchyEntityId ?? null,
    hierarchyEntityType: user.hierarchyEntityType ?? null,
  });
}

// ─── Check if user can access a specific entity ─────────────────────────

export async function canAccessEntity(
  userId: string,
  role: string,
  targetEntityId: string,
  hierarchyEntityId?: string | null,
): Promise<boolean> {
  if (role === 'SUPER_ADMIN' || role === 'MINISTRY_ADMIN') return true;

  const scope = await resolveDataScope({
    userId,
    role,
    hierarchyEntityId: hierarchyEntityId || null,
    hierarchyEntityType: null,
  });

  if (scope.allowedEntityIds.length === 0) return true;
  return scope.allowedEntityIds.includes(targetEntityId);
}
