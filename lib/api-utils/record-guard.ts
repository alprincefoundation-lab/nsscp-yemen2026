// ============================================================================
// NSSCP Record Guard — RBAC scope filter for DataRecords
// ============================================================================
// Ensures officers can only see records within their assigned hierarchy scope.
// Uses LevelAssignment to determine which Level6Unit IDs an officer can access.
// ============================================================================

import { prisma } from '@/lib/prisma'

interface ScopedOfficer {
  id: string
  name: string
  role: string
  accessLevel: number
  allowedLevel6UnitIds?: string[]
}

/**
 * Get the list of Level6Unit IDs that an officer can access
 * based on their LevelAssignment records.
 *
 * An officer assigned at level=N to unit X can see all Level6Units
 * that are descendants of unit X in the hierarchy chain.
 */
export async function getOfficerScope(officerId: string): Promise<string[]> {
  // Get all level assignments for this officer
  const assignments = await prisma.levelAssignment.findMany({
    where: { officerId },
  })

  if (assignments.length === 0) return []

  const level6Ids: Set<string> = new Set()

  for (const assignment of assignments) {
    if (assignment.level === 6) {
      // Direct assignment to a Level6Unit
      level6Ids.add(assignment.unitId)
    } else {
      // Find all descendant Level6Units under this assignment unit
      const descendantIds = await getDescendantLevel6Ids(assignment.unitId, assignment.level)
      descendantIds.forEach(id => level6Ids.add(id))
    }
  }

  return Array.from(level6Ids)
}

/**
 * Walk down the hierarchy chain from a unit to find all Level6Units under it
 */
async function getDescendantLevel6Ids(unitId: string, level: number): Promise<string[]> {
  if (level === 6) return [unitId]

  const ids: string[] = []

  if (level === 3) {
    const depts = await prisma.level4Department.findMany({
      where: { level3UnitId: unitId },
      select: { id: true },
    })
    for (const dept of depts) {
      const sectionIds = await getDescendantLevel6Ids(dept.id, 4)
      ids.push(...sectionIds)
    }
  } else if (level === 4) {
    const sections = await prisma.level5Section.findMany({
      where: { level4DepartmentId: unitId },
      select: { id: true },
    })
    for (const section of sections) {
      const unitIds = await getDescendantLevel6Ids(section.id, 5)
      ids.push(...unitIds)
    }
  } else if (level === 5) {
    const units = await prisma.level6Unit.findMany({
      where: { level5SectionId: unitId },
      select: { id: true },
    })
    ids.push(...units.map(u => u.id))
  }

  return ids
}

/**
 * Build Prisma where clause for DataRecord queries
 * based on officer's scope
 */
export async function getDataRecordWhereClause(officerId: string): Promise<Record<string, unknown>> {
  const allowedIds = await getOfficerScope(officerId)

  // SUPER_ADMIN sees everything
  const officer = await prisma.officer.findUnique({ where: { id: officerId } })
  if (officer?.role === 'SUPER_ADMIN' || officer?.accessLevel === 1) {
    return {}
  }

  if (allowedIds.length === 0) {
    // No scope — return nothing
    return { level6UnitId: '__NO_MATCH__' }
  }

  return { level6UnitId: { in: allowedIds } }
}

/**
 * Verify an officer can access a specific DataRecord
 */
export async function canAccessRecord(officerId: string, recordId: string): Promise<boolean> {
  const record = await prisma.dataRecord.findUnique({
    where: { id: recordId },
    select: { level6UnitId: true },
  })
  if (!record) return false

  const allowedIds = await getOfficerScope(officerId)
  const officer = await prisma.officer.findUnique({ where: { id: officerId } })

  if (officer?.role === 'SUPER_ADMIN' || officer?.accessLevel === 1) return true

  return allowedIds.includes(record.level6UnitId)
}

/**
 * Verify edit/delete permission from LevelAssignment
 */
export async function canEditRecord(officerId: string, recordId: string): Promise<boolean> {
  const canAccess = await canAccessRecord(officerId, recordId)
  if (!canAccess) return false

  const record = await prisma.dataRecord.findUnique({
    where: { id: recordId },
    select: { level6UnitId: true },
  })
  if (!record) return false

  // Check LevelAssignment for edit permission
  const assignments = await prisma.levelAssignment.findMany({
    where: { officerId },
  })

  for (const a of assignments) {
    if (a.canEdit) {
      const descendants = await getDescendantLevel6Ids(a.unitId, a.level)
      if (descendants.includes(record.level6UnitId)) return true
    }
  }

  return false
}

/**
 * Verify delete permission
 */
export async function canDeleteRecord(officerId: string, recordId: string): Promise<boolean> {
  const record = await prisma.dataRecord.findUnique({
    where: { id: recordId },
    select: { level6UnitId: true },
  })
  if (!record) return false

  const assignments = await prisma.levelAssignment.findMany({
    where: { officerId },
  })

  for (const a of assignments) {
    if (a.canDelete) {
      const descendants = await getDescendantLevel6Ids(a.unitId, a.level)
      if (descendants.includes(record.level6UnitId)) return true
    }
  }

  return false
}