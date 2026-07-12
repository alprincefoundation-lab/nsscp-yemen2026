import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/core/audit-engine'

type OfficerRef = {
  id: string
  fullName?: string | null
  email?: string | null
  rank?: string | null
  department?: string | null
}

function now(): Date {
  return new Date()
}

function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

async function getOfficerRef(id: string): Promise<OfficerRef | null> {
  const officer = await prisma.officer.findUnique({
    where: { id },
    select: { id: true, name: true, rank: true, department: true },
  })

  return officer
    ? {
        id: officer.id,
        fullName: officer.name,
        rank: officer.rank,
        department: officer.department,
      }
    : null
}

async function getSuspectInterrogations(suspectId: string) {
  return prisma.interrogation.findMany({
    where: { suspectId },
    orderBy: { date: 'desc' },
  })
}

async function buildInvestigationView(record: Prisma.InvestigationGetPayload<{}>) {
  return {
    ...record,
    assignee: { id: record.assignedTo, fullName: record.assignedTo },
    case: { id: record.caseId },
  }
}

async function buildSuspectView(record: Prisma.SuspectGetPayload<{}>) {
  return {
    ...record,
    investigation: { id: record.investigationId },
  }
}

async function buildWitnessView(record: Prisma.WitnessGetPayload<{}>) {
  return {
    ...record,
    investigation: { id: record.investigationId },
  }
}

async function buildInterrogationView(record: Prisma.InterrogationGetPayload<{}>) {
  const suspect = await prisma.suspect.findUnique({
    where: { id: record.suspectId },
  })

  return {
    ...record,
    suspect: suspect ? await buildSuspectView(suspect) : null,
    interrogator: { id: record.interrogatorId, fullName: record.interrogatorId },
  }
}

export async function createInvestigation(data: {
  caseId: string
  assignedTo: string
  type: string
  priority?: string
  description?: string
  departmentId?: string
}) {
  const investigation = await prisma.$transaction(async (tx) => {
    const created = await tx.investigation.create({
      data: {
        id: createId('inv'),
        caseId: data.caseId,
        assignedTo: data.assignedTo,
        type: data.type,
        priority: data.priority || 'MEDIUM',
        description: data.description ?? null,
        departmentId: data.departmentId ?? null,
        status: 'ACTIVE',
        evidence: [] as Prisma.InputJsonValue,
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'INVESTIGATION',
        entityId: created.id,
        officerId: data.assignedTo,
        details: {
          caseId: data.caseId,
          type: data.type,
          priority: data.priority || 'MEDIUM',
        } as Prisma.InputJsonValue,
      },
    })

    return created
  })

  return buildInvestigationView(investigation)
}

export async function getInvestigation(investigationId: string) {
  const investigation = await prisma.investigation.findUnique({
    where: { id: investigationId },
  })
  if (!investigation) return null

  const assignee = await getOfficerRef(investigation.assignedTo)
  const suspects = await listSuspects(investigationId)
  const witnesses = await listWitnesses(investigationId)
  const timeline = await getInvestigationTimeline(investigationId)

  return {
    ...await buildInvestigationView(investigation),
    assignee: assignee || { id: investigation.assignedTo, fullName: investigation.assignedTo },
    suspects,
    witnesses,
    evidence: Array.isArray(investigation.evidence) ? investigation.evidence : [],
    timeline,
  }
}

export async function updateInvestigationStatus(
  investigationId: string,
  status: string,
  updatedBy: string,
) {
  const investigation = await prisma.investigation.update({
    where: { id: investigationId },
    data: { status },
  })

  await createAuditLog({
    action: 'UPDATE',
    entityType: 'INVESTIGATION',
    entityId: investigationId,
    userId: updatedBy,
    details: { status },
  })

  return buildInvestigationView(investigation)
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
      ...(filters?.caseId ? { caseId: filters.caseId } : {}),
      ...(filters?.assignedTo ? { assignedTo: filters.assignedTo } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.departmentId ? { departmentId: filters.departmentId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    skip: filters?.skip || 0,
    take: filters?.take || 50,
  })

  return Promise.all(investigations.map(buildInvestigationView))
}

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
      id: createId('sus'),
      investigationId: data.investigationId,
      name: data.name,
      identityNumber: data.identityNumber,
      birthDate: data.birthDate ?? null,
      gender: data.gender ?? null,
      address: data.address ?? null,
      phoneNumber: data.phoneNumber ?? null,
      status: 'PERSON_OF_INTEREST',
    },
  })

  return buildSuspectView(suspect)
}

export async function updateSuspectStatus(
  suspectId: string,
  status: string,
  updatedBy: string,
) {
  const suspect = await prisma.suspect.update({
    where: { id: suspectId },
    data: { status },
  })

  await createAuditLog({
    action: 'UPDATE',
    entityType: 'SUSPECT',
    entityId: suspectId,
    userId: updatedBy,
    details: { status },
  })

  return buildSuspectView(suspect)
}

export async function getSuspect(suspectId: string) {
  const suspect = await prisma.suspect.findUnique({
    where: { id: suspectId },
  })
  if (!suspect) return null

  const interrogations = await listSuspectInterrogations(suspectId)
  return {
    ...(await buildSuspectView(suspect)),
    interrogations,
  }
}

export async function listSuspects(investigationId: string) {
  const suspects = await prisma.suspect.findMany({
    where: { investigationId },
    orderBy: { createdAt: 'desc' },
  })

  return Promise.all(
    suspects.map(async (suspect) => ({
      ...(await buildSuspectView(suspect)),
      interrogations: await listSuspectInterrogations(suspect.id),
    })),
  )
}

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
      id: createId('wit'),
      investigationId: data.investigationId,
      name: data.name,
      identityNumber: data.identityNumber ?? null,
      birthDate: data.birthDate ?? null,
      gender: data.gender ?? null,
      address: data.address ?? null,
      phoneNumber: data.phoneNumber ?? null,
      email: data.email ?? null,
      statement: data.statement ?? null,
      statementDate: data.statement ? now() : null,
      reliability: 'UNKNOWN',
    },
  })

  return buildWitnessView(witness)
}

export async function updateWitnessReliability(
  witnessId: string,
  reliability: string,
  updatedBy: string,
) {
  const witness = await prisma.witness.update({
    where: { id: witnessId },
    data: { reliability },
  })

  await createAuditLog({
    action: 'UPDATE',
    entityType: 'WITNESS',
    entityId: witnessId,
    userId: updatedBy,
    details: { reliability },
  })

  return buildWitnessView(witness)
}

export async function getWitness(witnessId: string) {
  const witness = await prisma.witness.findUnique({
    where: { id: witnessId },
  })
  return witness ? buildWitnessView(witness) : null
}

export async function listWitnesses(investigationId: string) {
  const witnesses = await prisma.witness.findMany({
    where: { investigationId },
    orderBy: { createdAt: 'desc' },
  })

  return Promise.all(witnesses.map(buildWitnessView))
}

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
      id: createId('int'),
      suspectId: data.suspectId,
      interrogatorId: data.interrogatorId,
      date: data.date,
      location: data.location ?? null,
      duration: data.duration ?? null,
      statement: data.statement ?? null,
      outcome: data.outcome || 'ONGOING',
      recordingUrl: data.recordingUrl ?? null,
      transcriptUrl: data.transcriptUrl ?? null,
    },
  })

  await createAuditLog({
    action: 'CREATE',
    entityType: 'INTERROGATION',
    entityId: interrogation.id,
    userId: data.interrogatorId,
    details: { suspectId: data.suspectId, outcome: interrogation.outcome },
  })

  return buildInterrogationView(interrogation)
}

export async function getInterrogation(interrogationId: string) {
  const interrogation = await prisma.interrogation.findUnique({
    where: { id: interrogationId },
  })
  return interrogation ? buildInterrogationView(interrogation) : null
}

export async function listSuspectInterrogations(suspectId: string) {
  const interrogations = await getSuspectInterrogations(suspectId)
  return Promise.all(interrogations.map(buildInterrogationView))
}

export async function completeInterrogation(
  interrogationId: string,
  data: {
    outcome: string
    statement?: string
    recordingUrl?: string
    transcriptUrl?: string
  },
) {
  const interrogation = await prisma.interrogation.update({
    where: { id: interrogationId },
    data: {
      outcome: data.outcome,
      ...(data.statement !== undefined ? { statement: data.statement } : {}),
      ...(data.recordingUrl !== undefined ? { recordingUrl: data.recordingUrl } : {}),
      ...(data.transcriptUrl !== undefined ? { transcriptUrl: data.transcriptUrl } : {}),
    },
  })

  return buildInterrogationView(interrogation)
}

export async function addInvestigationTimeline(data: {
  investigationId: string
  eventType: string
  description: string
  location?: string
  createdBy: string
}) {
  return prisma.investigationTimeline.create({
    data: {
      id: createId('itl'),
      investigationId: data.investigationId,
      eventType: data.eventType,
      description: data.description,
      location: data.location ?? null,
      createdBy: data.createdBy,
    },
  })
}

export async function getInvestigationTimeline(investigationId: string) {
  return prisma.investigationTimeline.findMany({
    where: { investigationId },
    orderBy: { createdAt: 'asc' },
  })
}
