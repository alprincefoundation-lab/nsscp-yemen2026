/**
 * API endpoints for Hierarchy Statistics (إحصائيات الهيكل)
 * Provides aggregated statistics for the hierarchical structure using HierarchyEntity
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/hierarchy/statistics?parentId=xxx
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const parentId = searchParams.get('parentId');

        if (!parentId) {
            return NextResponse.json(
                { error: 'parentId parameter is required' },
                { status: 400 }
            );
        }

        // First get the parent entity to determine what we're counting
        const parent = await prisma.hierarchyEntity.findUnique({
            where: { id: parentId },
        });

        if (!parent) {
            return NextResponse.json({ error: 'Parent entity not found' }, { status: 404 });
        }

        // Count children at different levels recursively
        async function countByType(entityId: string, type: string): Promise<number> {
            return prisma.hierarchyEntity.count({
                where: {
                    parentId: entityId,
                    type: type as any,
                },
            });
        }

        async function countGrandchildrenByType(entityId: string, childType: string, grandchildType: string): Promise<number> {
            // Get all children of childType under this entity
            const children = await prisma.hierarchyEntity.findMany({
                where: {
                    parentId: entityId,
                    type: childType as any,
                },
                select: { id: true },
            });

            if (children.length === 0) return 0;

            return prisma.hierarchyEntity.count({
                where: {
                    parentId: { in: children.map(c => c.id) },
                    type: grandchildType as any,
                },
            });
        }

        const stats = {
            id: parent.id,
            name: parent.name,
            type: parent.type,
            departmentsCount: await countByType(parentId, 'DEPARTMENT'),
            sectionsCount: await countByType(parentId, 'SECTION'),
            unitsCount: await countByType(parentId, 'UNIT'),
            // For governorates, count departments then sections under those
            deepDepartmentsCount: parent.type === 'GOVERNORATE'
                ? await countGrandchildrenByType(parentId, 'DEPARTMENT', 'SECTION')
                : 0,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching hierarchy statistics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch hierarchy statistics' },
            { status: 500 }
        );
    }
}