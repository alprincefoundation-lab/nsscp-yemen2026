/**
 * خدمة إدارة الهيكل الهرمي - Hierarchy Entity Service
 * Uses the unified HierarchyEntity model with self-referencing parent/children
 * Supports: MINISTRY → GOVERNORATE/DEPARTMENT → SECTION → UNIT
 */
import { prisma } from './prisma';
import type { HierarchyType } from '@prisma/client';

// ============================================
// Types & Interfaces
// ============================================

export interface HierarchyTreeNode {
    id: string;
    name: string;
    code: string;
    type: string;
    parentId: string | null;
    children?: HierarchyTreeNode[];
    _count?: { children: number };
}

export interface BreadcrumbItem {
    id: string;
    name: string;
    type: string;
    level: number;
}

// ============================================
// Core Hierarchy Service
// ============================================

/**
 * Get children of a hierarchy entity by type
 */
export async function getChildrenByType(parentId: string, type: string) {
    return prisma.hierarchyEntity.findMany({
        where: {
            parentId,
            type: type as HierarchyType,
        },
        orderBy: { name: 'asc' },
    });
}

/**
 * Get full hierarchy tree for a parent entity
 */
export async function getHierarchyTree(parentId: string, maxDepth: number = 3) {
    async function fetchChildren(entityId: string, depth: number): Promise<HierarchyTreeNode[]> {
        if (depth > maxDepth) return [];

        const children = await prisma.hierarchyEntity.findMany({
            where: { parentId: entityId },
            orderBy: { name: 'asc' },
        });

        const result: HierarchyTreeNode[] = [];
        for (const child of children) {
            const grandChildren = await fetchChildren(child.id, depth + 1);
            result.push({
                id: child.id,
                name: child.name,
                code: child.code,
                type: child.type,
                parentId: child.parentId,
                children: grandChildren.length > 0 ? grandChildren : undefined,
            });
        }
        return result;
    }

    return fetchChildren(parentId, 1);
}

/**
 * Get the full breadcrumb path from an entity to the root
 */
export async function getEntityBreadcrumb(entityId: string): Promise<BreadcrumbItem[]> {
    const breadcrumb: BreadcrumbItem[] = [];
    const levelMap: Record<string, number> = {
        MINISTRY: 1,
        GOVERNORATE: 2,
        DEPARTMENT: 3,
        SECTION: 4,
        UNIT: 5,
    };

    async function traverseUp(id: string) {
        const entity = await prisma.hierarchyEntity.findUnique({
            where: { id },
            include: { parent: true },
        });
        if (!entity) return;

        breadcrumb.unshift({
            id: entity.id,
            name: entity.name,
            type: entity.type,
            level: levelMap[entity.type] || 0,
        });

        if (entity.parent) {
            await traverseUp(entity.parent.id);
        }
    }

    await traverseUp(entityId);
    return breadcrumb;
}

/**
 * Get all governorates
 */
export async function getGovernorates() {
    return prisma.hierarchyEntity.findMany({
        where: { type: 'GOVERNORATE' },
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            code: true,
        },
    });
}

/**
 * Get hierarchy statistics for a given entity
 */
export async function getEntityStatistics(entityId: string) {
    const entity = await prisma.hierarchyEntity.findUnique({
        where: { id: entityId },
    });

    if (!entity) return null;

    const departmentsCount = await prisma.hierarchyEntity.count({
        where: { parentId: entityId, type: 'DEPARTMENT' },
    });

    const sectionsCount = await prisma.hierarchyEntity.count({
        where: { parentId: entityId, type: 'SECTION' },
    });

    const unitsCount = await prisma.hierarchyEntity.count({
        where: { parentId: entityId, type: 'UNIT' },
    });

    const departments = await prisma.hierarchyEntity.findMany({
        where: { parentId: entityId, type: 'DEPARTMENT' },
        select: { id: true },
    });

    const deptIds = departments.map(d => d.id);
    const deepSectionsCount = deptIds.length > 0
        ? await prisma.hierarchyEntity.count({
            where: { parentId: { in: deptIds }, type: 'SECTION' },
        })
        : 0;

    const sections = await prisma.hierarchyEntity.findMany({
        where: { parentId: { in: deptIds }, type: 'SECTION' },
        select: { id: true },
    });
    const sectionIds = sections.map(s => s.id);
    const deepUnitsCount = sectionIds.length > 0
        ? await prisma.hierarchyEntity.count({
            where: { parentId: { in: sectionIds }, type: 'UNIT' },
        })
        : 0;

    return {
        entityId,
        entityName: entity.name,
        entityType: entity.type,
        departmentsCount,
        sectionsCount,
        unitsCount,
        deepSectionsCount,
        deepUnitsCount,
    };
}

/**
 * Create a new hierarchy entity
 */
export async function createHierarchyEntity(data: {
    name: string;
    code: string;
    type: HierarchyType;
    parentId?: string;
}) {
    return prisma.hierarchyEntity.create({
        data: {
            name: data.name,
            code: data.code,
            type: data.type,
            parentId: data.parentId || null,
        },
    });
}

/**
 * Update a hierarchy entity
 */
export async function updateHierarchyEntity(id: string, data: { name?: string; parentId?: string }) {
    return prisma.hierarchyEntity.update({
        where: { id },
        data,
    });
}

/**
 * Delete a hierarchy entity
 */
export async function deleteHierarchyEntity(id: string) {
    return prisma.hierarchyEntity.delete({
        where: { id },
    });
}

export async function getDescendantIds(entityId: string): Promise<string[]> {
    const ids: string[] = [];
    async function collectDescendants(parentId: string) {
        const children = await prisma.hierarchyEntity.findMany({
            where: { parentId },
            select: { id: true },
        });
        for (const child of children) {
            ids.push(child.id);
            await collectDescendants(child.id);
        }
    }
    ids.push(entityId);
    await collectDescendants(entityId);
    return ids;
}

export async function checkUserHierarchyAccess(userId: string, targetEntityId: string): Promise<boolean> {
    const userHierarchies = await prisma.hierarchyUser.findMany({
        where: { userId },
        select: { hierarchyEntityId: true },
    });
    const userEntityIds = userHierarchies.map(h => h.hierarchyEntityId);
    for (const userEntityId of userEntityIds) {
        const descendantIds = await getDescendantIds(userEntityId);
        if (descendantIds.includes(targetEntityId)) return true;
    }
    return false;
}

export async function getScopeFilter(userId: string, role: string): Promise<{ parentId?: { in: string[] } } | {}> {
    if (role === 'SUPER_ADMIN' || role === 'MINISTRY_ADMIN') {
        return {};
    }
    const userHierarchies = await prisma.hierarchyUser.findMany({
        where: { userId, isPrimary: true },
        select: { hierarchyEntityId: true },
    });
    if (userHierarchies.length === 0) return {};
    const allScopeIds: string[] = [];
    for (const h of userHierarchies) {
        const ids = await getDescendantIds(h.hierarchyEntityId);
        allScopeIds.push(...ids);
    }
    return { parentId: { in: [...new Set(allScopeIds)] } };
}

// ============================================
// دالة التحقق المضافة حديثاً لتطابق الأنظمة السيادية
// ============================================
const HIERARCHY_ORDER: string[] = [
    'MINISTRY',
    'GOVERNORATE',
    'DEPARTMENT',
    'SECTION',
    'UNIT'
];

export async function validateHierarchyRelation(parentId: string | null, childType: HierarchyType): Promise<boolean> {
    if (!parentId) {
        return childType === 'MINISTRY';
    }
    const parentEntity = await prisma.hierarchyEntity.findUnique({
        where: { id: parentId }
    });
    if (!parentEntity) return false;

    let parentType = parentEntity.type;
    const normalizedChildType = childType;

    const parentIndex = HIERARCHY_ORDER.indexOf(parentType);
    const childIndex = HIERARCHY_ORDER.indexOf(normalizedChildType);

    return childIndex > parentIndex;
}
