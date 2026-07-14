import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/core/audit-engine'

type PrisonerView = Awaited<ReturnType<typeof buildPrisonerView>>
type CellView = Awaited<ReturnType<typeof buildCellView>>

function now(): Date {
  return new Date()
}

function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

async function getCellPrisoners(cellId: string) {
  return prisma.prisoner.findMany({
    where: { currentCellId: cellId },
    select: {
      id: true,
      prisonerId: true,
      fullName: true,
      status: true,
    },
  })
}

async function buildCellView(cell: {
  id: string
  cellNumber: string
  block: string
  capacity: number
  cellType: string
  departmentId?: string | null
  status: string
  occupancy: number
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...cell,
    prisoners: await getCellPrisoners(cell.id),
  }
}

async function buildPrisonerView(prisoner: {
  id: string
  prisonerId: string
  fullName: string
  dateOfBirth: Date
  gender: string
  nationality: string
  idNumber: string
  crimeType: string
  sentenceLength?: number | null
  sentenceStartDate: Date
  estimatedReleaseDate?: Date | null
  currentCellId?: string | null
  bookingDate: Date
  arrestReason: string
  departmentId?: string | null
  status: string
  actualReleaseDate?: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  const currentCell = prisoner.currentCellId
    ? await prisma.cell.findUnique({
        where: { id: prisoner.currentCellId },
        include: {
          prisoners: {
            select: {
              id: true,
              prisonerId: true,
              fullName: true,
              status: true,
            },
          },
        },
      })
    : null

  const disciplinaryRecords = await prisma.disciplinaryRecord.findMany({
    where: { prisonerId: prisoner.id },
    orderBy: { recordDate: 'desc' },
    take: 10,
  })

  const medicalRecords = await prisma.medicalRecord.findMany({
    where: { prisonerId: prisoner.id },
    orderBy: { examinationDate: 'desc' },
    take: 10,
  })

  const visitorLogs = await prisma.visitorLog.findMany({
    where: { prisonerId: prisoner.id },
    orderBy: { visitDate: 'desc' },
    take: 10,
  })

  return {
    ...prisoner,
    currentCell: currentCell
      ? {
          ...currentCell,
          prisoners: currentCell.prisoners,
        }
      : null,
    disciplinaryRecords,
    medicalRecords,
    visitorLogs,
  }
}

export async function registerPrisoner(data: {
  prisonerId: string
  fullName: string
  dateOfBirth: Date
  gender: string
  nationality: string
  idNumber: string
  crimeType: string
  sentenceLength?: number
  sentenceStartDate: Date
  estimatedReleaseDate?: Date
  currentCellId?: string
  bookingDate: Date
  arrestReason: string
  departmentId?: string
}) {
  const prisoner = await prisma.$transaction(async (tx) => {
    const created = await tx.prisoner.create({
      data: {
        id: createId('prisoner'),
        prisonerId: data.prisonerId,
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        nationality: data.nationality,
        idNumber: data.idNumber,
        crimeType: data.crimeType,
        sentenceLength: data.sentenceLength ?? null,
        sentenceStartDate: data.sentenceStartDate,
        estimatedReleaseDate: data.estimatedReleaseDate ?? null,
        currentCellId: data.currentCellId ?? null,
        bookingDate: data.bookingDate,
        arrestReason: data.arrestReason,
        departmentId: data.departmentId ?? null,
        status: 'ACTIVE',
      },
    })

    if (created.currentCellId) {
      const occupancy = await tx.prisoner.count({ where: { currentCellId: created.currentCellId } })
      await tx.cell.update({
        where: { id: created.currentCellId },
        data: {
          occupancy,
        },
      })
    }

    await tx.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'PRISONER',
        entityId: created.id,
        officerId: 'system',
        details: {
          prisonerId: data.prisonerId,
          fullName: data.fullName,
          crimeType: data.crimeType,
        } as never,
      },
    })

    return created
  })

  return buildPrisonerView(prisoner)
}

export async function getPrisoner(prisonerId: string) {
  const prisoner = await prisma.prisoner.findUnique({ where: { id: prisonerId } })
  return prisoner ? buildPrisonerView(prisoner) : null
}

export async function listPrisoners(filters?: {
  status?: string
  crimeType?: string
  departmentId?: string
  departmentIds?: string[]
  currentCellId?: string
  currentCellIds?: string[]
  skip?: number
  take?: number
}) {
  const prisoners = await prisma.prisoner.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.crimeType ? { crimeType: filters.crimeType } : {}),
      ...(filters?.departmentIds?.length
        ? { departmentId: { in: filters.departmentIds } }
        : filters?.departmentId
          ? { departmentId: filters.departmentId }
          : {}),
      ...(filters?.currentCellIds?.length
        ? { currentCellId: { in: filters.currentCellIds } }
        : filters?.currentCellId
          ? { currentCellId: filters.currentCellId }
          : {}),
    },
    orderBy: { bookingDate: 'desc' },
    skip: filters?.skip || 0,
    take: filters?.take || 50,
  })

  return Promise.all(prisoners.map(buildPrisonerView))
}

export async function updatePrisonerStatus(
  prisonerId: string,
  status: string,
  updatedBy: string,
  releaseDate?: Date
) {
  const prisoner = await prisma.$transaction(async (tx) => {
    const updated = await tx.prisoner.update({
      where: { id: prisonerId },
      data: {
        status,
        ...(releaseDate ? { actualReleaseDate: releaseDate } : {}),
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'PRISONER',
        entityId: prisonerId,
        officerId: updatedBy,
        details: {
          status,
          releaseDate: releaseDate || null,
        } as never,
      },
    })

    return updated
  })

  return buildPrisonerView(prisoner)
}

export async function createCell(data: {
  cellNumber: string
  block: string
  capacity: number
  cellType: string
  departmentId?: string
}) {
  const cell = await prisma.cell.create({
    data: {
      id: createId('cell'),
      cellNumber: data.cellNumber,
      block: data.block,
      capacity: data.capacity,
      cellType: data.cellType,
      departmentId: data.departmentId ?? null,
      status: 'OPERATIONAL',
      occupancy: 0,
    },
  })

  return buildCellView(cell)
}

export async function getCell(cellId: string) {
  const cell = await prisma.cell.findUnique({
    where: { id: cellId },
  })
  return cell ? buildCellView(cell) : null
}

export async function listCells(filters?: {
  block?: string
  status?: string
  departmentId?: string
  departmentIds?: string[]
}) {
  const cells = await prisma.cell.findMany({
    where: {
      ...(filters?.block ? { block: filters.block } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.departmentIds?.length
        ? { departmentId: { in: filters.departmentIds } }
        : filters?.departmentId
          ? { departmentId: filters.departmentId }
          : {}),
    },
  })

  return Promise.all(cells.map(buildCellView))
}

export async function transferPrisonerToCell(
  prisonerId: string,
  cellId: string,
  transferredBy: string
) {
  const prisoner = await prisma.prisoner.findUnique({
    where: { id: prisonerId },
    select: { currentCellId: true },
  })

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.prisoner.update({
      where: { id: prisonerId },
      data: { currentCellId: cellId },
    })

    if (prisoner?.currentCellId) {
      const previousOccupancy = await tx.prisoner.count({ where: { currentCellId: prisoner.currentCellId } })
      await tx.cell.update({
        where: { id: prisoner.currentCellId },
        data: { occupancy: previousOccupancy },
      })
    }

    const newOccupancy = await tx.prisoner.count({ where: { currentCellId: cellId } })
    await tx.cell.update({
      where: { id: cellId },
      data: { occupancy: newOccupancy },
    })

    await tx.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'PRISONER',
        entityId: prisonerId,
        officerId: transferredBy,
        details: {
          previousCellId: prisoner?.currentCellId,
          newCellId: cellId,
        } as never,
      },
    })

    return result
  })

  return buildPrisonerView(updated)
}

export async function addDisciplinaryRecord(data: {
  prisonerId: string
  violationType: string
  description: string
  severity: string
  recordedBy: string
  actionTaken?: string
}) {
  const record = await prisma.disciplinaryRecord.create({
    data: {
      prisonerId: data.prisonerId,
      violationType: data.violationType,
      description: data.description,
      severity: data.severity,
      recordedBy: data.recordedBy,
      actionTaken: data.actionTaken ?? null,
      recordDate: now(),
    },
  })

  await createAuditLog({
    action: 'CREATE',
    entityType: 'PRISONER',
    entityId: data.prisonerId,
    userId: data.recordedBy,
    details: {
      recordType: 'DisciplinaryRecord',
      violationType: data.violationType,
      severity: data.severity,
    },
  })

  return record
}

export async function addMedicalRecord(data: {
  prisonerId: string
  description: string
  medicalStaff: string
  treatment?: string
  followUpRequired?: boolean
}) {
  return prisma.medicalRecord.create({
    data: {
      prisonerId: data.prisonerId,
      description: data.description,
      medicalStaff: data.medicalStaff,
      treatment: data.treatment ?? null,
      followUpRequired: data.followUpRequired || false,
      examinationDate: now(),
    },
  })
}

export async function logVisitor(data: {
  prisonerId: string
  visitorName: string
  visitorRelation: string
  visitDate: Date
  duration?: number
  purpose?: string
}) {
  return prisma.visitorLog.create({
    data: {
      prisonerId: data.prisonerId,
      visitorName: data.visitorName,
      visitorRelation: data.visitorRelation,
      visitDate: data.visitDate,
      duration: data.duration ?? null,
      purpose: data.purpose ?? null,
    },
  })
}

export async function getPrisonerVisitors(prisonerId: string, limit = 20) {
  return prisma.visitorLog.findMany({
    where: { prisonerId },
    orderBy: { visitDate: 'desc' },
    take: limit,
  })
}
