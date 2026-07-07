import { prisma } from '@/lib/prisma'
import {
  FormTemplate,
  FormSubmission,
  FormField,
  FormAttachment,
} from '@prisma/client'
import { z } from 'zod'

// ============================================================================
// FORM TEMPLATE OPERATIONS
// ============================================================================

export async function createFormTemplate(data: {
  name: string
  displayName: string
  description?: string
  formType: string
  departmentId?: string
  fields: Array<{
    fieldName: string
    displayLabel: string
    fieldType: string
    required?: boolean
    order: number
    options?: string
    validation?: string
    placeholder?: string
  }>
}) {
  const template = await prisma.formTemplate.create({
    data: {
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      formType: data.formType,
      departmentId: data.departmentId,
      fields: {
        create: data.fields,
      },
    },
    include: { fields: { orderBy: { order: 'asc' } } },
  })
  return template
}

export async function getFormTemplate(templateId: string) {
  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
    include: {
      fields: {
        orderBy: { order: 'asc' },
      },
      department: true,
    },
  })
  return template
}

export async function getFormTemplateByType(formType: string) {
  const template = await prisma.formTemplate.findFirst({
    where: {
      formType,
      isActive: true,
    },
    include: {
      fields: {
        orderBy: { order: 'asc' },
      },
    },
  })
  return template
}

export async function listFormTemplates(filters?: {
  formType?: string
  departmentId?: string
  isActive?: boolean
}) {
  const templates = await prisma.formTemplate.findMany({
    where: {
      ...(filters?.formType && { formType: filters.formType }),
      ...(filters?.departmentId && { departmentId: filters.departmentId }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    },
    include: {
      fields: { orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return templates
}

// ============================================================================
// FORM SUBMISSION OPERATIONS
// ============================================================================

export async function createFormSubmission(data: {
  templateId: string
  submittedBy: string
  departmentId: string
  formData: Record<string, unknown>
  relatedEntityId?: string
  relatedEntityType?: string
}) {
  const submission = await prisma.formSubmission.create({
    data: {
      templateId: data.templateId,
      submittedBy: data.submittedBy,
      departmentId: data.departmentId,
      formData: data.formData,
      relatedEntityId: data.relatedEntityId,
      relatedEntityType: data.relatedEntityType,
    },
    include: {
      template: true,
      user: true,
      department: true,
      attachments: true,
      signatures: true,
      approvals: true,
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: data.submittedBy,
      action: 'CREATE',
      resourceType: 'FormSubmission',
      resourceId: submission.id,
      newValue: JSON.stringify(submission),
    },
  })

  return submission
}

export async function getFormSubmission(submissionId: string) {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
    include: {
      template: {
        include: { fields: { orderBy: { order: 'asc' } } },
      },
      user: true,
      department: true,
      attachments: true,
      signatures: {
        include: { user: true },
      },
      approvals: {
        include: { approvingUser: true },
      },
    },
  })
  return submission
}

export async function updateFormSubmission(
  submissionId: string,
  data: {
    formData?: Record<string, unknown>
    status?: string
    approvedBy?: string
    rejectionReason?: string
  }
) {
  const oldSubmission = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
  })

  const submission = await prisma.formSubmission.update({
    where: { id: submissionId },
    data: {
      ...(data.formData && { formData: data.formData }),
      ...(data.status && { status: data.status }),
      ...(data.approvedBy && {
        approvedBy: data.approvedBy,
        approvedAt: new Date(),
      }),
      ...(data.rejectionReason && { rejectionReason: data.rejectionReason }),
    },
    include: {
      template: true,
      user: true,
      department: true,
      attachments: true,
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: data.approvedBy || 'system',
      action: 'UPDATE',
      resourceType: 'FormSubmission',
      resourceId: submissionId,
      oldValue: JSON.stringify(oldSubmission),
      newValue: JSON.stringify(submission),
    },
  })

  return submission
}

export async function listFormSubmissions(filters?: {
  templateId?: string
  departmentId?: string
  submittedBy?: string
  status?: string
  relatedEntityId?: string
  skip?: number
  take?: number
}) {
  const submissions = await prisma.formSubmission.findMany({
    where: {
      ...(filters?.templateId && { templateId: filters.templateId }),
      ...(filters?.departmentId && { departmentId: filters.departmentId }),
      ...(filters?.submittedBy && { submittedBy: filters.submittedBy }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.relatedEntityId && {
        relatedEntityId: filters.relatedEntityId,
      }),
      isDeleted: false,
    },
    include: {
      template: true,
      user: true,
      department: true,
      attachments: true,
    },
    orderBy: { createdAt: 'desc' },
    skip: filters?.skip || 0,
    take: filters?.take || 50,
  })
  return submissions
}

// ============================================================================
// FORM ATTACHMENT OPERATIONS
// ============================================================================

export async function addFormAttachment(data: {
  submissionId: string
  fileName: string
  fileUrl: string
  fileSize: bigint
  mimeType: string
  uploadedBy: string
}) {
  const attachment = await prisma.formAttachment.create({
    data: {
      submissionId: data.submissionId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      uploadedBy: data.uploadedBy,
    },
  })
  return attachment
}

// ============================================================================
// FORM SIGNATURE OPERATIONS
// ============================================================================

export async function addFormSignature(data: {
  submissionId: string
  signedBy: string
  signatureData: string
  signatureRole: string
}) {
  const signature = await prisma.formSignature.create({
    data: {
      submissionId: data.submissionId,
      signedBy: data.signedBy,
      signatureData: data.signatureData,
      signatureRole: data.signatureRole,
      signedAt: new Date(),
    },
    include: { user: true },
  })
  return signature
}

// ============================================================================
// FORM APPROVAL OPERATIONS
// ============================================================================

export async function getPendingApprovals(filters?: {
  requiredRole?: string
  submissionId?: string
  skip?: number
  take?: number
}) {
  const approvals = await prisma.formApproval.findMany({
    where: {
      status: 'PENDING',
      ...(filters?.requiredRole && { requiredRole: filters.requiredRole }),
      ...(filters?.submissionId && { submissionId: filters.submissionId }),
    },
    include: {
      submission: {
        include: {
          template: true,
          user: true,
          department: true,
        },
      },
      approvingUser: true,
    },
    orderBy: { createdAt: 'asc' },
    skip: filters?.skip || 0,
    take: filters?.take || 50,
  })
  return approvals
}

export async function approveFormSubmission(
  submissionId: string,
  approvalData: {
    approvedBy: string
    approvalDate?: Date
    comments?: string
  }
) {
  const submission = await prisma.formSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'APPROVED',
      approvedBy: approvalData.approvedBy,
      approvedAt: approvalData.approvalDate || new Date(),
    },
  })

  // Update all related approvals to approved
  await prisma.formApproval.updateMany({
    where: { submissionId, status: 'PENDING' },
    data: {
      status: 'APPROVED',
      approvedBy: approvalData.approvedBy,
      approvalDate: new Date(),
      comments: approvalData.comments,
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: approvalData.approvedBy,
      action: 'WORKFLOW_APPROVAL',
      resourceType: 'FormSubmission',
      resourceId: submissionId,
      newValue: JSON.stringify({
        status: 'APPROVED',
        approvedBy: approvalData.approvedBy,
      }),
    },
  })

  return submission
}

export async function rejectFormSubmission(
  submissionId: string,
  rejectData: {
    rejectedBy: string
    rejectionReason: string
    comments?: string
  }
) {
  const submission = await prisma.formSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'REJECTED',
      rejectionReason: rejectData.rejectionReason,
    },
  })

  // Update related approvals to rejected
  await prisma.formApproval.updateMany({
    where: { submissionId, status: 'PENDING' },
    data: {
      status: 'REJECTED',
      approvedBy: rejectData.rejectedBy,
      approvalDate: new Date(),
      rejectionReason: rejectData.rejectionReason,
      comments: rejectData.comments,
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: rejectData.rejectedBy,
      action: 'WORKFLOW_APPROVAL',
      resourceType: 'FormSubmission',
      resourceId: submissionId,
      newValue: JSON.stringify({
        status: 'REJECTED',
        rejectedBy: rejectData.rejectedBy,
        rejectionReason: rejectData.rejectionReason,
      }),
    },
  })

  return submission
}
