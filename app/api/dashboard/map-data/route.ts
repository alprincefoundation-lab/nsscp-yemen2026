/**
 * Tactical Map Data API
 * GET /api/dashboard/map-data?nodeId=xxx&layers=incidents,patrols
 *
 * Returns geo-located data for tactical map layers.
 * Hierarchy-scoped: nodeId=GLOBAL returns all; specific nodeId returns scoped data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiGuard } from '@/lib/hierarchy/guard'
import { Prisma } from '@prisma/client'

type IncidentRow = {
  id: string
  incidentNumber: string
  title: string
  description: string | null
  type: string
  status: string
  location: string | null
  createdAt: Date
  hierarchyEntityId: string | null
}

type PatrolRow = {
  id: string
  patrolNumber: string
  name: string
  type: string
  status: string
  startTime: Date
  endTime: Date | null
  location: string | null
  hierarchyEntityId: string | null
}

async function loadIncidents(scopedIds: string[] | null): Promise<IncidentRow[]> {
  return prisma.$queryRaw<IncidentRow[]>(Prisma.sql`
    SELECT
      "id",
      "incidentNumber",
      "title",
      "description",
      "type",
      "status",
      "location",
      "createdAt",
      "hierarchyEntityId"
    FROM "Incident"
    ${
      scopedIds && scopedIds.length > 0
        ? Prisma.sql`WHERE "hierarchyEntityId" IN (${Prisma.join(scopedIds)}) AND`
        : Prisma.sql`WHERE`
    } "status" IN ('REPORTED', 'UNDER_INVESTIGATION')
    ORDER BY "createdAt" DESC
    LIMIT 200
  `)
}

async function loadPatrols(scopedIds: string[] | null): Promise<PatrolRow[]> {
  return prisma.$queryRaw<PatrolRow[]>(Prisma.sql`
    SELECT
      "id",
      "patrolNumber",
      "name",
      "type",
      "status",
      "startTime",
      "endTime",
      "location",
      "hierarchyEntityId"
    FROM "Patrol"
    ${
      scopedIds && scopedIds.length > 0
        ? Prisma.sql`WHERE "hierarchyEntityId" IN (${Prisma.join(scopedIds)}) AND`
        : Prisma.sql`WHERE`
    } "status" = 'ACTIVE'
    ORDER BY "createdAt" DESC
    LIMIT 100
  `)
}

export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuard(request)
    if ('error' in guard) return guard.error

    const { searchParams } = new URL(request.url)
    const nodeId = searchParams.get('nodeId') || 'GLOBAL'
    const layers = (searchParams.get('layers') || 'incidents').split(',')

    let scopedIds: string[] | null = null
    if (nodeId !== 'GLOBAL') {
      const canAccess = guard.dataScope.allowedEntityIds.length === 0 || guard.dataScope.allowedEntityIds.includes(nodeId)
      if (!canAccess) {
        return NextResponse.json(
          { error: 'Not authorized for this hierarchy node' },
          { status: 403 }
        )
      }

      scopedIds = [nodeId, ...guard.dataScope.allowedEntityIds.filter((id) => id !== nodeId)]
    }

    const result: Record<string, unknown> = {}

    if (layers.includes('incidents')) {
      const incidents = await loadIncidents(scopedIds)
      result.incidents = incidents.map((incident) => ({
        id: incident.id,
        incidentNumber: incident.incidentNumber,
        title: incident.title,
        type: incident.type,
        status: incident.status,
        description: incident.description,
        location: incident.location,
        createdAt: incident.createdAt,
        dateTime: incident.createdAt,
        hierarchyEntityId: incident.hierarchyEntityId,
        hierarchyEntityName: 'Hierarchy Node',
      }))
    }

    if (layers.includes('patrols')) {
      const patrols = await loadPatrols(scopedIds)
      result.patrols = patrols.map((patrol) => ({
        id: patrol.id,
        patrolNumber: patrol.patrolNumber,
        name: patrol.name,
        type: patrol.type,
        status: patrol.status,
        startTime: patrol.startTime,
        endTime: patrol.endTime,
        location: patrol.location,
        badgeNumber: patrol.patrolNumber,
        hierarchyEntityId: patrol.hierarchyEntityId,
        hierarchyEntityName: 'Hierarchy Node',
      }))
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Map Data Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch map data' },
      { status: 500 }
    )
  }
}
