/**
 * Hierarchy service aligned with the current Prisma schema.
 * Tree order:
 * CentralCommand -> Province -> Level3Unit -> Level4Department -> Level5Section -> Level6Unit
 */
import { randomUUID } from 'crypto';
import { prisma } from './prisma';

export type HierarchyType =
    | 'MINISTRY'
    | 'GOVERNORATE'
    | 'DEPARTMENT'
    | 'SECTION'
    | 'UNIT'
    | 'PROVINCE'
    | 'DISTRICT'
    | 'POLICE_STATION';

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

type NormalizedNode = HierarchyTreeNode & { source: 'CENTRAL_COMMAND' | 'PROVINCE' | 'LEVEL3_UNIT' | 'LEVEL4_DEPARTMENT' | 'LEVEL5_SECTION' | 'LEVEL6_UNIT' };

const HIERARCHY_ORDER: HierarchyType[] = [
    'MINISTRY',
    'PROVINCE',
    'GOVERNORATE',
    'DEPARTMENT',
    'SECTION',
    'UNIT',
    'DISTRICT',
    'POLICE_STATION',
];

function canonicalType(type: string): HierarchyType {
    return type === 'GOVERNORATE' ? 'PROVINCE' : type as HierarchyType;
}

function nextTypeForParent(source: NormalizedNode['source']): HierarchyType | null {
    switch (source) {
        case 'CENTRAL_COMMAND':
            return 'PROVINCE';
        case 'PROVINCE':
            return 'DEPARTMENT';
        case 'LEVEL3_UNIT':
            return 'SECTION';
        case 'LEVEL4_DEPARTMENT':
            return 'UNIT';
        case 'LEVEL5_SECTION':
            return 'POLICE_STATION';
        default:
            return null;
    }
}

async function fetchNodeById(id: string): Promise<NormalizedNode | null> {
    const centralCommand = await prisma.centralCommand.findUnique({ where: { id }, select: { id: true, name: true, code: true } });
    if (centralCommand) {
        return { ...centralCommand, type: 'MINISTRY', parentId: null, source: 'CENTRAL_COMMAND' };
    }

    const province = await prisma.province.findUnique({ where: { id }, select: { id: true, name: true, code: true, centralCommandId: true } });
    if (province) {
        return { id: province.id, name: province.name, code: province.code, type: 'PROVINCE', parentId: province.centralCommandId, source: 'PROVINCE' };
    }

    const level3Unit = await prisma.level3Unit.findUnique({ where: { id }, select: { id: true, name: true, code: true, provinceId: true } });
    if (level3Unit) {
        return { id: level3Unit.id, name: level3Unit.name, code: level3Unit.code, type: 'DEPARTMENT', parentId: level3Unit.provinceId, source: 'LEVEL3_UNIT' };
    }

    const level4Department = await prisma.level4Department.findUnique({ where: { id }, select: { id: true, name: true, code: true, level3UnitId: true } });
    if (level4Department) {
        return { id: level4Department.id, name: level4Department.name, code: level4Department.code, type: 'SECTION', parentId: level4Department.level3UnitId, source: 'LEVEL4_DEPARTMENT' };
    }

    const level5Section = await prisma.level5Section.findUnique({ where: { id }, select: { id: true, name: true, code: true, level4DepartmentId: true } });
    if (level5Section) {
        return { id: level5Section.id, name: level5Section.name, code: level5Section.code, type: 'UNIT', parentId: level5Section.level4DepartmentId, source: 'LEVEL5_SECTION' };
    }

    const level6Unit = await prisma.level6Unit.findUnique({ where: { id }, select: { id: true, name: true, code: true, level5SectionId: true } });
    if (level6Unit) {
        return { id: level6Unit.id, name: level6Unit.name, code: level6Unit.code, type: 'POLICE_STATION', parentId: level6Unit.level5SectionId, source: 'LEVEL6_UNIT' };
    }

    return null;
}

async function getDirectChildren(parentId: string): Promise<NormalizedNode[]> {
    const [provinces, level3Units, level4Departments, level5Sections, level6Units] = await Promise.all([
        prisma.province.findMany({ where: { centralCommandId: parentId }, orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, centralCommandId: true } }),
        prisma.level3Unit.findMany({ where: { provinceId: parentId }, orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, provinceId: true } }),
        prisma.level4Department.findMany({ where: { level3UnitId: parentId }, orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, level3UnitId: true } }),
        prisma.level5Section.findMany({ where: { level4DepartmentId: parentId }, orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, level4DepartmentId: true } }),
        prisma.level6Unit.findMany({ where: { level5SectionId: parentId }, orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, level5SectionId: true } }),
    ]);

    return [
        ...provinces.map((item) => ({ id: item.id, name: item.name, code: item.code, type: 'PROVINCE', parentId: item.centralCommandId, source: 'PROVINCE' as const })),
        ...level3Units.map((item) => ({ id: item.id, name: item.name, code: item.code, type: 'DEPARTMENT', parentId: item.provinceId, source: 'LEVEL3_UNIT' as const })),
        ...level4Departments.map((item) => ({ id: item.id, name: item.name, code: item.code, type: 'SECTION', parentId: item.level3UnitId, source: 'LEVEL4_DEPARTMENT' as const })),
        ...level5Sections.map((item) => ({ id: item.id, name: item.name, code: item.code, type: 'UNIT', parentId: item.level4DepartmentId, source: 'LEVEL5_SECTION' as const })),
        ...level6Units.map((item) => ({ id: item.id, name: item.name, code: item.code, type: 'POLICE_STATION', parentId: item.level5SectionId, source: 'LEVEL6_UNIT' as const })),
    ];
}

async function getNodeChildren(nodeId: string): Promise<NormalizedNode[]> {
    return getDirectChildren(nodeId);
}

export async function getChildrenByType(parentId: string, type: string) {
    const children = await getDirectChildren(parentId);
    const targetType = canonicalType(type);
    return children.filter((child) => canonicalType(child.type) === targetType);
}

export async function getHierarchyTree(parentId: string, maxDepth: number = 3) {
    async function fetchChildren(entityId: string, depth: number): Promise<HierarchyTreeNode[]> {
        if (depth > maxDepth) return [];

        const children = await getNodeChildren(entityId);
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

export async function getEntityBreadcrumb(entityId: string): Promise<BreadcrumbItem[]> {
    const breadcrumb: BreadcrumbItem[] = [];

    async function traverseUp(id: string) {
        const entity = await fetchNodeById(id);
        if (!entity) return;

        breadcrumb.unshift({
            id: entity.id,
            name: entity.name,
            type: entity.type,
            level: Math.max(1, HIERARCHY_ORDER.indexOf(canonicalType(entity.type)) + 1),
        });

        if (entity.parentId) {
            await traverseUp(entity.parentId);
        }
    }

    await traverseUp(entityId);
    return breadcrumb;
}

export async function getGovernorates() {
    return prisma.province.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            code: true,
        },
    });
}

export async function getEntityStatistics(entityId: string) {
    const entity = await fetchNodeById(entityId);
    if (!entity) return null;

    const descendants = await getDescendantIds(entityId);
    const descendantNodes = await Promise.all(descendants.map((id) => fetchNodeById(id)));
    const nodes = descendantNodes.filter((node): node is NormalizedNode => Boolean(node));

    return {
        entityId,
        entityName: entity.name,
        entityType: entity.type,
        departmentsCount: nodes.filter((node) => canonicalType(node.type) === 'DEPARTMENT').length,
        sectionsCount: nodes.filter((node) => canonicalType(node.type) === 'SECTION').length,
        unitsCount: nodes.filter((node) => canonicalType(node.type) === 'UNIT').length,
        deepSectionsCount: nodes.filter((node) => canonicalType(node.type) === 'SECTION').length,
        deepUnitsCount: nodes.filter((node) => canonicalType(node.type) === 'UNIT' || canonicalType(node.type) === 'DISTRICT' || canonicalType(node.type) === 'POLICE_STATION').length,
    };
}

export async function createHierarchyEntity(data: {
    name: string;
    code: string;
    type: HierarchyType;
    parentId?: string;
}) {
    const type = canonicalType(data.type);
    const id = randomUUID();

    if (type !== 'MINISTRY' && !data.parentId) {
        throw new Error('Parent entity is required for non-root hierarchy nodes');
    }

    switch (type) {
        case 'MINISTRY':
            return prisma.centralCommand.create({
                data: {
                    id,
                    name: data.name,
                    code: data.code,
                    description: null,
                    updatedAt: new Date(),
                },
            });
        case 'PROVINCE':
            return prisma.province.create({
                data: {
                    id,
                    name: data.name,
                    code: data.code,
                    centralCommandId: data.parentId!,
                    updatedAt: new Date(),
                },
            });
        case 'DEPARTMENT':
            return prisma.level3Unit.create({
                data: {
                    id,
                    name: data.name,
                    code: data.code,
                    unitType: 'DEPARTMENT',
                    provinceId: data.parentId!,
                    updatedAt: new Date(),
                },
            });
        case 'SECTION':
            return prisma.level4Department.create({
                data: {
                    id,
                    name: data.name,
                    code: data.code,
                    departmentType: 'SECTION',
                    level3UnitId: data.parentId!,
                    updatedAt: new Date(),
                },
            });
        case 'UNIT':
            return prisma.level5Section.create({
                data: {
                    id,
                    name: data.name,
                    code: data.code,
                    sectionType: 'UNIT',
                    level4DepartmentId: data.parentId!,
                    updatedAt: new Date(),
                },
            });
        case 'DISTRICT':
        case 'POLICE_STATION':
            return prisma.level6Unit.create({
                data: {
                    id,
                    name: data.name,
                    code: data.code,
                    unitType: type,
                    level5SectionId: data.parentId!,
                    updatedAt: new Date(),
                },
            });
        default:
            throw new Error(`Unsupported hierarchy type: ${data.type}`);
    }
}

export async function updateHierarchyEntity(id: string, data: { name?: string; parentId?: string }) {
    const entity = await fetchNodeById(id);
    if (!entity) {
        throw new Error('Hierarchy entity not found');
    }

    switch (entity.source) {
        case 'CENTRAL_COMMAND':
            return prisma.centralCommand.update({
                where: { id },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    updatedAt: new Date(),
                },
            });
        case 'PROVINCE':
            return prisma.province.update({
                where: { id },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    ...(data.parentId !== undefined ? { centralCommandId: data.parentId } : {}),
                    updatedAt: new Date(),
                },
            });
        case 'LEVEL3_UNIT':
            return prisma.level3Unit.update({
                where: { id },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    ...(data.parentId !== undefined ? { provinceId: data.parentId } : {}),
                    updatedAt: new Date(),
                },
            });
        case 'LEVEL4_DEPARTMENT':
            return prisma.level4Department.update({
                where: { id },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    ...(data.parentId !== undefined ? { level3UnitId: data.parentId } : {}),
                    updatedAt: new Date(),
                },
            });
        case 'LEVEL5_SECTION':
            return prisma.level5Section.update({
                where: { id },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    ...(data.parentId !== undefined ? { level4DepartmentId: data.parentId } : {}),
                    updatedAt: new Date(),
                },
            });
        case 'LEVEL6_UNIT':
            return prisma.level6Unit.update({
                where: { id },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    ...(data.parentId !== undefined ? { level5SectionId: data.parentId } : {}),
                    updatedAt: new Date(),
                },
            });
    }
}

export async function deleteHierarchyEntity(id: string) {
    const children = await getNodeChildren(id);
    if (children.length > 0) {
        throw new Error('Cannot delete a hierarchy node with children.');
    }

    const entity = await fetchNodeById(id);
    if (!entity) {
        throw new Error('Hierarchy entity not found');
    }

    switch (entity.source) {
        case 'CENTRAL_COMMAND':
            return prisma.centralCommand.delete({ where: { id } });
        case 'PROVINCE':
            return prisma.province.delete({ where: { id } });
        case 'LEVEL3_UNIT':
            return prisma.level3Unit.delete({ where: { id } });
        case 'LEVEL4_DEPARTMENT':
            return prisma.level4Department.delete({ where: { id } });
        case 'LEVEL5_SECTION':
            return prisma.level5Section.delete({ where: { id } });
        case 'LEVEL6_UNIT':
            return prisma.level6Unit.delete({ where: { id } });
    }
}

export async function getDescendantIds(entityId: string): Promise<string[]> {
    const ids = new Set<string>();

    async function collect(parentId: string) {
        const children = await getNodeChildren(parentId);
        for (const child of children) {
            if (!ids.has(child.id)) {
                ids.add(child.id);
                await collect(child.id);
            }
        }
    }

    ids.add(entityId);
    await collect(entityId);
    return [...ids];
}

export async function checkUserHierarchyAccess(userId: string, targetEntityId: string): Promise<boolean> {
    const officer = await prisma.officer.findUnique({
        where: { id: userId },
        select: { id: true, role: true, accessLevel: true },
    });

    if (officer?.role === 'SUPER_ADMIN' || officer?.accessLevel === 1) {
        return true;
    }

    const userHierarchies = await prisma.levelAssignment.findMany({
        where: { officerId: userId },
        select: { unitId: true },
    });

    for (const assignment of userHierarchies) {
        const descendantIds = await getDescendantIds(assignment.unitId);
        if (descendantIds.includes(targetEntityId)) return true;
    }

    return false;
}

export async function getScopeFilter(userId: string, role: string): Promise<{ parentId?: { in: string[] } } | {}> {
    if (role === 'SUPER_ADMIN' || role === 'MINISTRY_ADMIN') {
        return {};
    }

    const userHierarchies = await prisma.levelAssignment.findMany({
        where: { officerId: userId },
        select: { unitId: true },
    });

    if (userHierarchies.length === 0) return {};

    const allScopeIds = new Set<string>();
    for (const hierarchy of userHierarchies) {
        const ids = await getDescendantIds(hierarchy.unitId);
        for (const id of ids) {
            allScopeIds.add(id);
        }
    }

    return { parentId: { in: [...allScopeIds] } };
}

export async function validateHierarchyRelation(parentId: string | null, childType: HierarchyType): Promise<boolean> {
    const normalizedChildType = canonicalType(childType);

    if (!parentId) {
        return normalizedChildType === 'MINISTRY';
    }

    const parentEntity = await fetchNodeById(parentId);
    if (!parentEntity) return false;

    const parentIndex = HIERARCHY_ORDER.indexOf(canonicalType(parentEntity.type));
    const childIndex = HIERARCHY_ORDER.indexOf(normalizedChildType);

    return childIndex > parentIndex;
}
