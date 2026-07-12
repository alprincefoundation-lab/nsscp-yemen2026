import { prisma } from '@/lib/prisma'

interface AuditLogInput {
  officerId: string
  action: string
  entityType: string
  entityId: string
  changes?: any
  ipAddress?: string
  userAgent?: string
}

export async function logAudit(data: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        officerId: data.officerId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.changes,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to log audit:', error)
  }
}
