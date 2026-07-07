import { prisma } from '@/lib/prisma'
import { Operation, Incident } from '@prisma/client'

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
  const operation = await prisma.operation.create({
    data: {
      name: data.name,
      code: data.code,
      type: data.type,
      commanderId: data.commanderId,
      createdById: data.commanderId,
      startDate: data.startDate,
      endDate: data.endDate,
      objectives: data.objectives,
      departmentId: data.departmentId,
      location: data.location,
      province: data.province,
      district: data.district,
      priority: data.priority,
      status: 'ACTIVE',
    },
    include: {
      commander: true,
      department: true,
      timeline: true,
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: data.commanderId,
      action: 'CREATE',
      resourceType: 'Operation',
      resourceId: operation.id,
    },
  })

  return operation
}

export async function getOperation(operationId: string) {
  const operation = await prisma.operation.findUnique({
    where: { id: operationId },
    include: {
      commander: true,
      department: true,
      createdByUser: true,
      updatedByUser: true,
      timeline: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  return operation
}

export async function listOperations(filters?: {
  departmentId?: string
  commanderId?: string
  status?: string
  type?: string
  skip?: number
  take?: number
}) {
  const operations = await prisma.operation.findMany({
    where: {
      ...(filters?.departmentId && { departmentId: filters.departmentId }),
      ...(filters?.commanderId && { commanderId: filters.commanderId }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.type && { type: filters.type }),
    },
    include: {
      commander: true,
      department: true,
    },
    orderBy: { startDate: 'desc' },
    skip: filters?.skip || 0,
    take: filters?.take || 50,
  })
  return operations
}

export async function updateOperationStatus(
  operationId: string,
  status: string,
  updatedBy: string,
  endDate?: Date
) {
  const operation = await prisma.operation.update({
    where: { id: operationId },
    data: {
      status,
      ...(endDate && { endDate }),
      updatedById: updatedBy,
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      resourceType: 'Operation',
      resourceId: operationId,
      newValue: JSON.stringify({ status, endDate }),
    },
  })

  return operation
}

export async function addOperationTimeline(data: {
  operationId: string
  eventType: string
  description: string
  location?: string
  createdBy: string
}) {
  const timeline = await prisma.operationTimeline.create({
    data: {
      operationId: data.operationId,
      eventType: data.eventType,
      description: data.description,
      location: data.location,
      createdBy: data.createdBy,
    },
  })
  return timeline
}

export async function getOperationTimeline(operationId: string) {
  const timeline = await prisma.operationTimeline.findMany({
    where: { operationId },
    orderBy: { createdAt: 'asc' },
  })
  return timeline
}

// ============================================================================
// INCIDENT OPERATIONS
// ============================================================================

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
  const incident = await prisma.incident.create({
    data: {
      incidentNumber: data.incidentNumber,
      type: data.type,
      severity: data.severity,
      reportedBy: data.reportedBy,
      departmentId: data.departmentId,
      location: data.location,
      province: data.province,
      district: data.district,
      description: data.description,
      respondingTeam: data.respondingTeam,
      status: 'REPORTED',
      reportTime: new Date(),
    },
    include: {
      department: true,
      timeline: true,
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: data.reportedBy,
      action: 'CREATE',
      resourceType: 'Incident',
      resourceId: incident.id,
    },
  })

  return incident
}

export async function getIncident(incidentId: string) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      department: true,
      timeline: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  return incident
}

export async function listIncidents(filters?: {
  departmentId?: string
  status?: string
  severity?: string
  type?: string
  skip?: number
  take?: number
}) {
  const incidents = await prisma.incident.findMany({
    where: {
      ...(filters?.departmentId && { departmentId: filters.departmentId }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.severity && { severity: filters.severity }),
      ...(filters?.type && { type: filters.type }),
    },
    include: {
      department: true,
    },
    orderBy: { reportTime: 'desc' },
    skip: filters?.skip || 0,
    take: filters?.take || 50,
  })
  return incidents
}

export async function updateIncidentStatus(
  incidentId: string,
  status: string,
  resolvedTime?: Date
) {
  const incident = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      status,
      ...(resolvedTime && { resolvedTime }),
    },
  })
  return incident
}

export async function addIncidentTimeline(data: {
  incidentId: string
  eventType: string
  description: string
  createdBy: string
}) {
  const timeline = await prisma.incidentTimeline.create({
    data: {
      incidentId: data.incidentId,
      eventType: data.eventType,
      description: data.description,
      createdBy: data.createdBy,
    },
  })
  return timeline
}

export async function getIncidentTimeline(incidentId: string) {
  const timeline = await prisma.incidentTimeline.findMany({
    where: { incidentId },
    orderBy: { createdAt: 'asc' },
  })
  return timeline
}
