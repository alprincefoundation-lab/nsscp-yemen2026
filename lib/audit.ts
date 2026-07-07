import { prisma } from '@/lib/prisma'

interface AuditLogInput {
  userId: string
  userRole: string
  action: string
  resourceType: string
  resourceId: string
  changes?: any
}

export async function logAudit(data: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        userRole: data.userRole,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        changes: data.changes,
      },
    })
  } catch (error) {
    console.error('Failed to log audit:', error)
  }
}
