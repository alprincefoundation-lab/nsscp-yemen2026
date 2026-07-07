import { prisma } from '@/lib/prisma'
import { Prisoner, Cell } from '@prisma/client'

// ============================================================================
// PRISONER OPERATIONS
// ============================================================================

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
  const prisoner = await prisma.prisoner.create({
    data: {
      prisonerId: data.prisonerId,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      nationality: data.nationality,
      idNumber: data.idNumber,
      crimeType: data.crimeType,
      sentenceLength: data.sentenceLength,
      sentenceStartDate: data.sentenceStartDate,
      estimatedReleaseDate: data.estimatedReleaseDate,
      currentCellId: data.currentCellId,
      bookingDate: data.bookingDate,
      arrestReason: data.arrestReason,
      departmentId: data.departmentId,
      status: 'ACTIVE',
    },
    include: {
      currentCell: true,
      disciplinaryRecords: true,
      medicalRecords: true,
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: 'system',
      action: 'CREATE',
      resourceType: 'Prisoner',
      resourceId: prisoner.id,
    },
  })

  return prisoner
}

export async function getPrisoner(prisonerId: string) {
  const prisoner = await prisma.prisoner.findUnique({
    where: { id: prisonerId },
    include: {
      currentCell: {
        include: {
          prisoners: true,
        },
      },
      disciplinaryRecords: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      medicalRecords: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      visitorLogs: {
        orderBy: { visitDate: 'desc' },
        take: 10,
      },
    },
  })
  return prisoner
}

export async function listPrisoners(filters?: {
  status?: string
  crimeType?: string
  departmentId?: string
  currentCellId?: string
  skip?: number
  take?: number
}) {
  const prisoners = await prisma.prisoner.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.crimeType && { crimeType: filters.crimeType }),
      ...(filters?.departmentId && { departmentId: filters.departmentId }),
      ...(filters?.currentCellId && { currentCellId: filters.currentCellId }),
    },
    include: {
      currentCell: true,
    },
    orderBy: { bookingDate: 'desc' },
    skip: filters?.skip || 0,
    take: filters?.take || 50,
  })
  return prisoners
}

export async function updatePrisonerStatus(
  prisonerId: string,
  status: string,
  updatedBy: string,
  releaseDate?: Date
) {
  const prisoner = await prisma.prisoner.update({
    where: { id: prisonerId },
    data: {
      status,
      ...(releaseDate && { actualReleaseDate: releaseDate }),
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      resourceType: 'Prisoner',
      resourceId: prisonerId,
      newValue: JSON.stringify({ status, releaseDate }),
    },
  })

  return prisoner
}

// ============================================================================
// CELL OPERATIONS
// ============================================================================

export async function createCell(data: {
  cellNumber: string
  block: string
  capacity: number
  cellType: string
  departmentId?: string
}) {
  const cell = await prisma.cell.create({
    data: {
      cellNumber: data.cellNumber,
      block: data.block,
      capacity: data.capacity,
      cellType: data.cellType,
      departmentId: data.departmentId,
      status: 'OPERATIONAL',
      occupancy: 0,
    },
    include: {
      prisoners: true,
    },
  })
  return cell
}

export async function getCell(cellId: string) {
  const cell = await prisma.cell.findUnique({
    where: { id: cellId },
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
  return cell
}

export async function listCells(filters?: {
  block?: string
  status?: string
  departmentId?: string
}) {
  const cells = await prisma.cell.findMany({
    where: {
      ...(filters?.block && { block: filters.block }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.departmentId && { departmentId: filters.departmentId }),
    },
    include: {
      prisoners: {
        select: { id: true, fullName: true, status: true },
      },
    },
  })
  return cells
}

export async function transferPrisonerToCell(
  prisonerId: string,
  cellId: string,
  transferredBy: string
) {
  // Get prisoner and new cell
  const prisoner = await prisma.prisoner.findUnique({
    where: { id: prisonerId },
    select: { currentCellId: true },
  })

  // Update prisoner cell
  const updated = await prisma.prisoner.update({
    where: { id: prisonerId },
    data: { currentCellId: cellId },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: transferredBy,
      action: 'UPDATE',
      resourceType: 'Prisoner',
      resourceId: prisonerId,
      newValue: JSON.stringify({
        previousCellId: prisoner?.currentCellId,
        newCellId: cellId,
      }),
    },
  })

  return updated
}

// ============================================================================
// DISCIPLINARY RECORD OPERATIONS
// ============================================================================

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
      actionTaken: data.actionTaken,
      recordDate: new Date(),
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: data.recordedBy,
      action: 'CREATE',
      resourceType: 'DisciplinaryRecord',
      resourceId: record.id,
    },
  })

  return record
}

// ============================================================================
// MEDICAL RECORD OPERATIONS
// ============================================================================

export async function addMedicalRecord(data: {
  prisonerId: string
  description: string
  medicalStaff: string
  treatment?: string
  followUpRequired?: boolean
}) {
  const record = await prisma.medicalRecord.create({
    data: {
      prisonerId: data.prisonerId,
      description: data.description,
      medicalStaff: data.medicalStaff,
      treatment: data.treatment,
      followUpRequired: data.followUpRequired || false,
      examinationDate: new Date(),
    },
  })

  return record
}

// ============================================================================
// VISITOR LOG OPERATIONS
// ============================================================================

export async function logVisitor(data: {
  prisonerId: string
  visitorName: string
  visitorRelation: string
  visitDate: Date
  duration?: number
  purpose?: string
}) {
  const log = await prisma.visitorLog.create({
    data: {
      prisonerId: data.prisonerId,
      visitorName: data.visitorName,
      visitorRelation: data.visitorRelation,
      visitDate: data.visitDate,
      duration: data.duration,
      purpose: data.purpose,
    },
  })
  return log
}

export async function getPrisonerVisitors(prisonerId: string, limit = 20) {
  const visitors = await prisma.visitorLog.findMany({
    where: { prisonerId },
    orderBy: { visitDate: 'desc' },
    take: limit,
  })
  return visitors
}
