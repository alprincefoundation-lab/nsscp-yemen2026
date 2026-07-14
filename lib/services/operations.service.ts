import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

type OfficerRef = { id: string; fullName?: string | null; rank?: string | null; department?: string | null }

type OperationTimelineRecord = {
  id: string
  operationId: string
  eventType: string
  description: string
  location?: string | null
  createdBy: string
  createdAt: Date
}

type IncidentTimelineRecord = {
  id: string
  incidentId: string
  eventType: string
  description: string
  createdBy: string
  createdAt: Date
}

async function getOfficerRef(id: string): Promise<OfficerRef | null> {
  const officer = await prisma.officer.findUnique({
    where: { id },
    select: { id: true, name: true, rank: true, department: true },
  })

  return officer
    ? { id: officer.id, fullName: officer.name, rank: officer.rank, department: officer.department }
    : null
}

function sortTimeline<T extends { createdAt: Date }>(items: T[]) {
  return items.slice().sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
}

function buildOperationView(record: Prisma.OperationGetPayload<{ include: { timelines: true } }>) {
  return {
    ...record,
    commander: { id: record.commanderId, fullName: record.commanderId },
    department: { id: record.departmentId, name: record.departmentId },
    timeline: sortTimeline(record.timelines),
  }
}

function buildIncidentView(record: Prisma.IncidentGetPayload<{ include: { timelines: true } }>) {
  return {
    ...record,
    department: { id: record.departmentId, name: record.departmentId },
    timeline: sortTimeline(record.timelines),
  }
}

export async function createOperation(data: {
  name: string
  code: string
  type: string
  commanderId: string
  startDate: Date
  endDate?: Date
  objectives: string
  departmentId: string
  location?: string
  province?: string
  district?: string
  priority: string
}) {
  const operation = await prisma.$transaction(async (tx) => {
    const created = await tx.operation.create({
      data: {
        id: `op_${randomUUID()}`,
        name: data.name,
        code: data.code,
        type: data.type,
        commanderId: data.commanderId,
        createdById: data.commanderId,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        objectives: data.objectives,
        departmentId: data.departmentId,
        location: data.location ?? null,
        province: data.province ?? null,
        district: data.district ?? null,
        priority: data.priority,
        status: 'ACTIVE',
      },
      include: { timelines: true },
    })

    await tx.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'OPERATION',
        entityId: created.id,
        officerId: data.commanderId,
        details: {
          name: data.name,
          code: data.code,
          type: data.type,
        } as Prisma.InputJsonValue,
      },
    })

    return created
  })

  return buildOperationView(operation)
}

export async function getOperation(operationId: string) {
  const operation = await prisma.operation.findUnique({
    where: { id: operationId },
    include: { timelines: true },
  })
  if (!operation) return null

  const commander = await getOfficerRef(operation.commanderId)
  return {
    ...buildOperationView(operation),
    commander: commander || { id: operation.commanderId, fullName: operation.commanderId },
    createdByUser: await getOfficerRef(operation.createdById),
    updatedByUser: operation.updatedById ? await getOfficerRef(operation.updatedById) : null,
  }
}

export async function listOperations(filters?: {
  departmentId?: string
  departmentIds?: string[]
  commanderId?: string
  status?: string
  type?: string
  skip?: number
  take?: number
}) {
  const operations = await prisma.operation.findMany({
    where: {
      ...(filters?.departmentIds?.length
        ? { departmentId: { in: filters.departmentIds } }
        : filters?.departmentId
          ? { departmentId: filters.departmentId }
          : {}),
      ...(filters?.commanderId ? { commanderId: filters.commanderId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
    },
    include: { timelines: true },
    orderBy: { startDate: 'desc' },
    skip: filters?.skip || 0,
    take: filters?.take || 50,
  })

  return Promise.all(operations.map(buildOperationView))
}

export async function updateOperationStatus(
  operationId: string,
  status: string,
  updatedBy: string,
  endDate?: Date,
) {
  const operation = await prisma.$transaction(async (tx) => {
    const updated = await tx.operation.update({
      where: { id: operationId },
      data: {
        status,
        updatedById: updatedBy,
        ...(endDate ? { endDate } : {}),
      },
      include: { timelines: true },
    })

    await tx.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'OPERATION',
        entityId: operationId,
        officerId: updatedBy,
        details: {
          status,
          endDate: endDate || null,
        } as Prisma.InputJsonValue,
      },
    })

    return updated
  })

  return buildOperationView(operation)
}

export async function addOperationTimeline(data: {
  operationId: string
  eventType: string
  description: string
  location?: string
  createdBy: string
}) {
  return prisma.$transaction(async (tx) => {
    const timeline = await tx.operationTimeline.create({
      data: {
        id: `opt_${randomUUID()}`,
        operationId: data.operationId,
        eventType: data.eventType,
        description: data.description,
        location: data.location ?? null,
        createdBy: data.createdBy,
      },
    })

    await tx.operation.update({
      where: { id: data.operationId },
      data: { updatedAt: new Date() },
    })

    return timeline as OperationTimelineRecord
  })
}

export async function getOperationTimeline(operationId: string) {
  const timelines = await prisma.operationTimeline.findMany({
    where: { operationId },
    orderBy: { createdAt: 'asc' },
  })

  return timelines as OperationTimelineRecord[]
}

export async function reportIncident(data: {
  incidentNumber: string
  type: string
  severity: string
  reportedBy: string
  departmentId: string
  location: string
  province: string
  district: string
  description: string
  respondingTeam?: string
}) {
  const incident = await prisma.$transaction(async (tx) => {
    const created = await tx.incident.create({
      data: {
        id: `inc_${randomUUID()}`,
        incidentNumber: data.incidentNumber,
        type: data.type,
        severity: data.severity,
        reportedBy: data.reportedBy,
        departmentId: data.departmentId,
        location: data.location,
        province: data.province,
        district: data.district,
        description: data.description,
        respondingTeam: data.respondingTeam ?? null,
        status: 'REPORTED',
        reportTime: new Date(),
      },
      include: { timelines: true },
    })

    await tx.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'INCIDENT',
        entityId: created.id,
        officerId: data.reportedBy,
        details: {
          incidentNumber: data.incidentNumber,
          type: data.type,
          severity: data.severity,
        } as Prisma.InputJsonValue,
      },
    })

    return created
  })

  return buildIncidentView(incident)
}

export async function getIncident(incidentId: string) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: { timelines: true },
  })
  return incident ? buildIncidentView(incident) : null
}

export async function listIncidents(filters?: {
  departmentId?: string
  departmentIds?: string[]
  status?: string
  severity?: string
  type?: string
  skip?: number
  take?: number
}) {
  const incidents = await prisma.incident.findMany({
    where: {
      ...(filters?.departmentIds?.length
        ? { departmentId: { in: filters.departmentIds } }
        : filters?.departmentId
          ? { departmentId: filters.departmentId }
          : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.severity ? { severity: filters.severity } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
    },
    include: { timelines: true },
    orderBy: { reportTime: 'desc' },
    skip: filters?.skip || 0,
    take: filters?.take || 50,
  })

  return Promise.all(incidents.map(buildIncidentView))
}

export async function updateIncidentStatus(
  incidentId: string,
  status: string,
  resolvedTime?: Date,
) {
  const incident = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      status,
      ...(resolvedTime ? { resolvedTime } : {}),
    },
    include: { timelines: true },
  })
  return buildIncidentView(incident)
}

export async function addIncidentTimeline(data: {
  incidentId: string
  eventType: string
  description: string
  createdBy: string
}) {
  return prisma.incidentTimeline.create({
    data: {
      id: `inct_${randomUUID()}`,
      incidentId: data.incidentId,
      eventType: data.eventType,
      description: data.description,
      createdBy: data.createdBy,
    },
  }) as unknown as IncidentTimelineRecord
}

export async function getIncidentTimeline(incidentId: string) {
  const timelines = await prisma.incidentTimeline.findMany({
    where: { incidentId },
    orderBy: { createdAt: 'asc' },
  })

  return timelines as IncidentTimelineRecord[]
}
