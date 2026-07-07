/**
 * Tactical Map Data API
 * GET /api/dashboard/map-data?nodeId=xxx&layers=incidents,patrols
 *
 * Returns geo-located data for tactical map layers.
 * Hierarchy-scoped: nodeId=GLOBAL returns all; specific nodeId returns scoped data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiGuard } from '@/lib/hierarchy/guard';

export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuard(request);
    if ('error' in guard) return guard.error;

    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId') || 'GLOBAL';
    const layers = (searchParams.get('layers') || 'incidents').split(',');

    // Build hierarchy scope
    let hierarchyWhere: Record<string, unknown> = {};
    if (nodeId !== 'GLOBAL') {
      const canAccess = await guard.engine.canAccessHierarchy(nodeId);
      if (!canAccess) {
        return NextResponse.json(
          { error: 'Not authorized for this hierarchy node' },
          { status: 403 },
        );
      }
      const descendantIds = await guard.engine.getDescendantIds();
      hierarchyWhere = { departmentId: { in: descendantIds } };
    }

    const result: Record<string, unknown> = {};

    // Layer: incidents
    if (layers.includes('incidents')) {
      const incidents = await prisma.incident.findMany({
        where: {
          ...hierarchyWhere,
          status: { in: ['OPEN', 'RESPONDING'] },
        } as any,
        select: {
          id: true,
          incidentNumber: true,
          type: true,
          status: true,
          description: true,
          location: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      result.incidents = incidents.map((inc: any) => ({
        ...inc,
        title: inc.type,
        dateTime: inc.createdAt,
        hierarchyEntityName: 'Department',
      }));
    }

    // Layer: patrols (User model with location data)
    if (layers.includes('patrols')) {
      const patrols = await prisma.user.findMany({
        where: {
          ...hierarchyWhere,
          isActive: true,
        } as any,
        select: {
          id: true,
          fullName: true,
          militaryId: true,
          rank: true,
          department: { select: { id: true, nameAr: true } },
        },
        take: 100,
      });
      result.patrols = patrols.map((p: any) => ({
        ...p,
        badgeNumber: p.militaryId,
        hierarchyEntityName: p.department?.nameAr || 'Unknown',
      }));
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Map Data Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map data' },
      { status: 500 },
    );
  }
}


