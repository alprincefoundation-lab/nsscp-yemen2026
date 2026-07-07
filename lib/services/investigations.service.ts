import { prisma } from '@/lib/prisma'
import { Investigation, Suspect, Witness } from '@prisma/client'

// ============================================================================
// INVESTIGATION OPERATIONS
// ============================================================================

export async function createInvestigation(data: {
  caseId: string
  assignedTo: string
  type: string
  priority?: string
  description?: string
  departmentId?: string
}) {
  const investigation = await prisma.investigation.create({
    data: {
      caseId: data.caseId,
      assignedTo: data.assignedTo,
      type: data.type,
      priority: data.priority || 'MEDIUM',
      description: data.description,
      departmentId: data.departmentId,
      status: 'ACTIVE',
    },
    include: {
      assignee: true,
      case: true,
      suspects: true,
      witnesses: true,
      evidence: true,
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: data.assignedTo,
      action: 'CREATE',
      resourceType: 'Investigation',
      resourceId: investigation.id,
    },
  })

  return investigation
}

export async function getInvestigation(investigationId: string) {
  const investigation = await prisma.investigation.findUnique({
    where: { id: investigationId },
    include: {
      assignee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          rank: true,
          department: true,
        },
      },
      case: true,
      suspects: true,
      witnesses: true,
      evidence: true,
      timeline: true,
    },
  })
  return investigation
}

export async function updateInvestigationStatus(
  investigationId: string,
  status: string,
  updatedBy: string
) {
  const investigation = await prisma.investigation.update({
    where: { id: investigationId },
    data: {
      status,
      updatedAt: new Date(),
    },
    include: {
      case: true,
      assignee: true,
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      resourceType: 'Investigation',
      resourceId: investigationId,
      newValue: JSON.stringify({ status }),
    },
  })

  return investigation
}

export async function listInvestigations(filters?: {
  caseId?: string
  assignedTo?: string
  status?: string
  departmentId?: string
  skip?: number
  take?: number
}) {
  const investigations = await prisma.investigation.findMany({
    where: {
      ...(filters?.caseId && { caseId: filters.caseId }),
      ...(filters?.assignedTo && { assignedTo: filters.assignedTo }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.departmentId && { departmentId: filters.departmentId }),
    },
    include: {
      assignee: true,
      case: true,
      suspects: { take: 5 },
      witnesses: { take: 5 },
      evidence: { take: 5 },
    },
    orderBy: { createdAt: 'desc' },
    skip: filters?.skip || 0,
    take: filters?.take || 50,
  })
  return investigations
}

// ============================================================================
// SUSPECT OPERATIONS
// ============================================================================

export async function addSuspect(data: {
  investigationId: string
  name: string
  identityNumber: string
  birthDate?: Date
  gender?: string
  address?: string
  phoneNumber?: string
}) {
  const suspect = await prisma.suspect.create({
    data: {
      investigationId: data.investigationId,
      name: data.name,
      identityNumber: data.identityNumber,
      birthDate: data.birthDate,
      gender: data.gender,
      address: data.address,
      phoneNumber: data.phoneNumber,
      status: 'PERSON_OF_INTEREST',
    },
  })
  return suspect
}

export async function updateSuspectStatus(
  suspectId: string,
  status: string,
  updatedBy: string
) {
  const suspect = await prisma.suspect.update({
    where: { id: suspectId },
    data: { status },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      resourceType: 'Suspect',
      resourceId: suspectId,
      newValue: JSON.stringify({ status }),
    },
  })

  return suspect
}

export async function getSuspect(suspectId: string) {
  const suspect = await prisma.suspect.findUnique({
    where: { id: suspectId },
    include: {
      investigation: true,
      interrogations: {
        include: { interrogator: true },
      },
    },
  })
  return suspect
}

export async function listSuspects(investigationId: string) {
  const suspects = await prisma.suspect.findMany({
    where: { investigationId },
    include: {
      interrogations: {
        orderBy: { date: 'desc' },
        take: 5,
      },
    },
  })
  return suspects
}

// ============================================================================
// WITNESS OPERATIONS
// ============================================================================

export async function addWitness(data: {
  investigationId: string
  name: string
  identityNumber?: string
  birthDate?: Date
  gender?: string
  address?: string
  phoneNumber?: string
  email?: string
  statement?: string
}) {
  const witness = await prisma.witness.create({
    data: {
      investigationId: data.investigationId,
      name: data.name,
      identityNumber: data.identityNumber,
      birthDate: data.birthDate,
      gender: data.gender,
      address: data.address,
      phoneNumber: data.phoneNumber,
      email: data.email,
      statement: data.statement,
      statementDate: data.statement ? new Date() : undefined,
      reliability: 'UNKNOWN',
    },
  })
  return witness
}

export async function updateWitnessReliability(
  witnessId: string,
  reliability: string,
  updatedBy: string
) {
  const witness = await prisma.witness.update({
    where: { id: witnessId },
    data: { reliability },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      resourceType: 'Witness',
      resourceId: witnessId,
      newValue: JSON.stringify({ reliability }),
    },
  })

  return witness
}

export async function getWitness(witnessId: string) {
  const witness = await prisma.witness.findUnique({
    where: { id: witnessId },
    include: {
      investigation: true,
    },
  })
  return witness
}

export async function listWitnesses(investigationId: string) {
  const witnesses = await prisma.witness.findMany({
    where: { investigationId },
    orderBy: { createdAt: 'desc' },
  })
  return witnesses
}

// ============================================================================
// INTERROGATION OPERATIONS
// ============================================================================

export async function createInterrogation(data: {
  suspectId: string
  interrogatorId: string
  date: Date
  location?: string
  duration?: number
  statement?: string
  outcome?: string
  recordingUrl?: string
  transcriptUrl?: string
}) {
  const interrogation = await prisma.interrogation.create({
    data: {
      suspectId: data.suspectId,
      interrogatorId: data.interrogatorId,
      date: data.date,
      location: data.location,
      duration: data.duration,
      statement: data.statement,
      outcome: data.outcome || 'ONGOING',
      recordingUrl: data.recordingUrl,
      transcriptUrl: data.transcriptUrl,
    },
    include: {
      suspect: true,
      interrogator: true,
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: data.interrogatorId,
      action: 'CREATE',
      resourceType: 'Interrogation',
      resourceId: interrogation.id,
    },
  })

  return interrogation
}

export async function getInterrogation(interrogationId: string) {
  const interrogation = await prisma.interrogation.findUnique({
    where: { id: interrogationId },
    include: {
      suspect: true,
      interrogator: true,
    },
  })
  return interrogation
}

export async function listSuspectInterrogations(suspectId: string) {
  const interrogations = await prisma.interrogation.findMany({
    where: { suspectId },
    include: {
      interrogator: true,
    },
    orderBy: { date: 'desc' },
  })
  return interrogations
}

export async function completeInterrogation(
  interrogationId: string,
  data: {
    outcome: string
    statement?: string
    recordingUrl?: string
    transcriptUrl?: string
  }
) {
  const interrogation = await prisma.interrogation.update({
    where: { id: interrogationId },
    data: {
      outcome: data.outcome,
      statement: data.statement,
      recordingUrl: data.recordingUrl,
      transcriptUrl: data.transcriptUrl,
    },
  })
  return interrogation
}

// ============================================================================
// INVESTIGATION TIMELINE OPERATIONS
// ============================================================================

export async function addInvestigationTimeline(data: {
  investigationId: string
  eventType: string
  description: string
  location?: string
  createdBy: string
}) {
  const timeline = await prisma.investigationTimeline.create({
    data: {
      investigationId: data.investigationId,
      eventType: data.eventType,
      description: data.description,
      location: data.location,
      createdBy: data.createdBy,
    },
  })
  return timeline
}

export async function getInvestigationTimeline(investigationId: string) {
  const timeline = await prisma.investigationTimeline.findMany({
    where: { investigationId },
    orderBy: { createdAt: 'asc' },
  })
  return timeline
}
