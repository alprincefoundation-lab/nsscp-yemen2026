import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/core/audit-engine'

type FormFieldRecord = {
  id: string
  formTemplateId: string
  fieldName: string
  displayLabel: string
  fieldType: string
  required: boolean
  order: number
  options?: string | null
  validation?: string | null
  placeholder?: string | null
}

type FormTemplateRecord = {
  id: string
  name: string
  displayName: string
  description?: string | null
  formType: string
  departmentId?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  fields: FormFieldRecord[]
}

type FormAttachmentRecord = {
  id: string
  submissionId: string
  fileName: string
  fileUrl: string
  fileSize: bigint
  mimeType: string
  uploadedBy: string
}

type FormSignatureRecord = {
  id: string
  submissionId: string
  signedBy: string
  signatureData: string
  signatureRole: string
  signedAt: Date
}

type FormApprovalRecord = {
  id: string
  submissionId: string
  requiredRole: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedBy?: string
  approvalDate?: Date
  rejectionReason?: string
  comments?: string
  createdAt: Date
}

type FormSubmissionRecord = {
  id: string
  templateId: string
  submittedBy: string
  departmentId: string
  formData: Record<string, unknown>
  relatedEntityId?: string | null
  relatedEntityType?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT'
  approvedBy?: string | null
  approvedAt?: Date | null
  rejectionReason?: string | null
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
  attachments: FormAttachmentRecord[]
  signatures: FormSignatureRecord[]
  approvals: FormApprovalRecord[]
}

function now(): Date {
  return new Date()
}

function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

function normalizeFileSize(fileSize: bigint | number): number {
  return Number(fileSize)
}

function buildTemplateView(template: { fields: FormFieldRecord[] } & Omit<FormTemplateRecord, 'fields'>) {
  return {
    ...template,
    fields: template.fields.slice().sort((a, b) => a.order - b.order),
    department: null,
  }
}

async function buildSubmissionView(submission: {
  id: string
  templateId: string
  submittedBy: string
  departmentId: string
  formData: Prisma.JsonValue
  relatedEntityId?: string | null
  relatedEntityType?: string | null
  status: string
  approvedBy?: string | null
  approvedAt?: Date | null
  rejectionReason?: string | null
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
  attachments: Array<{
    id: string
    submissionId: string
    fileName: string
    fileUrl: string
    fileSize: bigint
    mimeType: string
    uploadedBy: string
  }>
  signatures: Array<{
    id: string
    submissionId: string
    signedBy: string
    signatureData: string
    signatureRole: string
    signedAt: Date
  }>
  approvals: Array<{
    id: string
    submissionId: string
    requiredRole: string
    status: string
    approvedBy?: string | null
    approvalDate?: Date | null
    rejectionReason?: string | null
    comments?: string | null
    createdAt: Date
  }>
}) {
  const template = await prisma.formTemplate.findUnique({
    where: { id: submission.templateId },
    include: { fields: true },
  })

  return {
    ...submission,
    template: template ? buildTemplateView(template) : null,
    user: {
      id: submission.submittedBy,
      username: submission.submittedBy,
      fullName: submission.submittedBy,
    },
    department: { id: submission.departmentId, name: submission.departmentId },
    attachments: submission.attachments.map((attachment) => ({
      ...attachment,
      fileSize: normalizeFileSize(attachment.fileSize),
    })),
    signatures: submission.signatures.map((signature) => ({
      ...signature,
      user: {
        id: signature.signedBy,
        username: signature.signedBy,
        fullName: signature.signedBy,
      },
    })),
    approvals: submission.approvals.map((approval) => ({
      ...approval,
      approvingUser: approval.approvedBy
        ? {
            id: approval.approvedBy,
            username: approval.approvedBy,
            fullName: approval.approvedBy,
          }
        : null,
    })),
  }
}

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
  const template = await prisma.$transaction(async (tx) => {
    const created = await tx.formTemplate.create({
      data: {
        id: createId('ft'),
        name: data.name,
        displayName: data.displayName,
        description: data.description ?? null,
        formType: data.formType,
        departmentId: data.departmentId ?? null,
        isActive: true,
      },
      include: { fields: true },
    })

    if (data.fields.length > 0) {
      await tx.formField.createMany({
        data: data.fields.map((field) => ({
          id: createId('ff'),
          formTemplateId: created.id,
          fieldName: field.fieldName,
          displayLabel: field.displayLabel,
          fieldType: field.fieldType,
          required: field.required ?? false,
          order: field.order,
          options: field.options ?? null,
          validation: field.validation ?? null,
          placeholder: field.placeholder ?? null,
        })),
      })
    }

    await tx.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'FORM_TEMPLATE',
        entityId: created.id,
        officerId: null,
        details: {
          name: data.name,
          formType: data.formType,
        } as Prisma.InputJsonValue,
      },
    })

    return tx.formTemplate.findUniqueOrThrow({
      where: { id: created.id },
      include: { fields: true },
    })
  })

  return buildTemplateView(template)
}

export async function getFormTemplate(templateId: string) {
  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
    include: { fields: true },
  })
  return template ? buildTemplateView(template) : null
}

export async function getFormTemplateByType(formType: string) {
  const template = await prisma.formTemplate.findFirst({
    where: { formType, isActive: true },
    include: { fields: true },
  })
  return template ? buildTemplateView(template) : null
}

export async function listFormTemplates(filters?: {
  formType?: string
  departmentId?: string
  isActive?: boolean
}) {
  const templates = await prisma.formTemplate.findMany({
    where: {
      ...(filters?.formType ? { formType: filters.formType } : {}),
      ...(filters?.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
    include: { fields: true },
    orderBy: { createdAt: 'desc' },
  })

  return templates.map(buildTemplateView)
}

export async function createFormSubmission(data: {
  templateId: string
  submittedBy: string
  departmentId: string
  formData: Record<string, unknown>
  relatedEntityId?: string
  relatedEntityType?: string
}) {
  const template = await prisma.formTemplate.findUnique({ where: { id: data.templateId } })
  if (!template) {
    throw new Error('Form template not found')
  }

  const submission = await prisma.formSubmission.create({
    data: {
      id: createId('fs'),
      templateId: data.templateId,
      submittedBy: data.submittedBy,
      departmentId: data.departmentId,
      formData: data.formData as Prisma.InputJsonValue,
      relatedEntityId: data.relatedEntityId ?? null,
      relatedEntityType: data.relatedEntityType ?? null,
      status: 'PENDING',
      isDeleted: false,
    },
    include: {
      attachments: true,
      signatures: true,
      approvals: true,
    },
  })

  await createAuditLog({
    action: 'CREATE',
    entityType: 'FORM_SUBMISSION',
    entityId: submission.id,
    userId: data.submittedBy,
    details: { templateId: data.templateId, departmentId: data.departmentId },
  })

  return buildSubmissionView(submission)
}

export async function getFormSubmission(submissionId: string) {
  const submission = await prisma.formSubmission.findFirst({
    where: { id: submissionId, isDeleted: false },
    include: {
      attachments: true,
      signatures: true,
      approvals: true,
    },
  })
  return submission ? buildSubmissionView(submission) : null
}

export async function updateFormSubmission(
  submissionId: string,
  data: {
    formData?: Record<string, unknown>
    status?: string
    approvedBy?: string
    rejectionReason?: string
  },
) {
  const submission = await prisma.formSubmission.findFirst({
    where: { id: submissionId, isDeleted: false },
    include: {
      attachments: true,
      signatures: true,
      approvals: true,
    },
  })
  if (!submission) {
    throw new Error('Form submission not found')
  }

  const oldSnapshot = await buildSubmissionView(submission)

  const updated = await prisma.formSubmission.update({
    where: { id: submissionId },
    data: {
      ...(data.formData ? { formData: data.formData as Prisma.InputJsonValue } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.approvedBy ? { approvedBy: data.approvedBy, approvedAt: now() } : {}),
      ...(data.rejectionReason ? { rejectionReason: data.rejectionReason } : {}),
    },
    include: {
      attachments: true,
      signatures: true,
      approvals: true,
    },
  })

  await createAuditLog({
    action: 'UPDATE',
    entityType: 'FORM_SUBMISSION',
    entityId: submissionId,
    userId: data.approvedBy || 'system',
    details: {
      oldValue: oldSnapshot,
      newValue: await buildSubmissionView(updated),
    },
  })

  return buildSubmissionView(updated)
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
      isDeleted: false,
      ...(filters?.templateId ? { templateId: filters.templateId } : {}),
      ...(filters?.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters?.submittedBy ? { submittedBy: filters.submittedBy } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.relatedEntityId ? { relatedEntityId: filters.relatedEntityId } : {}),
    },
    include: {
      attachments: true,
      signatures: true,
      approvals: true,
    },
    orderBy: { createdAt: 'desc' },
    skip: filters?.skip || 0,
    take: filters?.take || 50,
  })

  return Promise.all(submissions.map(buildSubmissionView))
}

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
      id: createId('fa'),
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

export async function addFormSignature(data: {
  submissionId: string
  signedBy: string
  signatureData: string
  signatureRole: string
}) {
  const signature = await prisma.formSignature.create({
    data: {
      id: createId('fsig'),
      submissionId: data.submissionId,
      signedBy: data.signedBy,
      signatureData: data.signatureData,
      signatureRole: data.signatureRole,
      signedAt: now(),
    },
  })

  return {
    ...signature,
    user: {
      id: data.signedBy,
      username: data.signedBy,
      fullName: data.signedBy,
    },
  }
}

export async function getPendingApprovals(filters?: {
  requiredRole?: string
  submissionId?: string
  skip?: number
  take?: number
}) {
  const approvals = await prisma.formApproval.findMany({
    where: {
      status: 'PENDING',
      ...(filters?.requiredRole ? { requiredRole: filters.requiredRole } : {}),
      ...(filters?.submissionId ? { submissionId: filters.submissionId } : {}),
    },
    include: {
      submission: {
        include: {
          attachments: true,
          signatures: true,
          approvals: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    skip: filters?.skip || 0,
    take: filters?.take || 50,
  })

  return Promise.all(
    approvals.map(async (approval) => ({
      ...approval,
      submission: approval.submission ? await buildSubmissionView(approval.submission) : null,
      approvingUser: approval.approvedBy
        ? {
            id: approval.approvedBy,
            username: approval.approvedBy,
            fullName: approval.approvedBy,
          }
        : null,
    })),
  )
}

export async function approveFormSubmission(
  submissionId: string,
  approvalData: {
    approvedBy: string
    approvalDate?: Date
    comments?: string
  },
) {
  const submission = await prisma.formSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'APPROVED',
      approvedBy: approvalData.approvedBy,
      approvedAt: approvalData.approvalDate || now(),
    },
    include: {
      attachments: true,
      signatures: true,
      approvals: true,
    },
  })

  await prisma.formApproval.updateMany({
    where: { submissionId, status: 'PENDING' },
    data: {
      status: 'APPROVED',
      approvedBy: approvalData.approvedBy,
      approvalDate: approvalData.approvalDate || now(),
      comments: approvalData.comments ?? null,
    },
  })

  await createAuditLog({
    action: 'WORKFLOW_APPROVAL',
    entityType: 'FORM_SUBMISSION',
    entityId: submissionId,
    userId: approvalData.approvedBy,
    details: {
      status: 'APPROVED',
      approvedBy: approvalData.approvedBy,
    },
  })

  return buildSubmissionView(submission)
}

export async function rejectFormSubmission(
  submissionId: string,
  rejectData: {
    rejectedBy: string
    rejectionReason: string
    comments?: string
  },
) {
  const submission = await prisma.formSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'REJECTED',
      rejectionReason: rejectData.rejectionReason,
    },
    include: {
      attachments: true,
      signatures: true,
      approvals: true,
    },
  })

  await prisma.formApproval.updateMany({
    where: { submissionId, status: 'PENDING' },
    data: {
      status: 'REJECTED',
      approvedBy: rejectData.rejectedBy,
      approvalDate: now(),
      rejectionReason: rejectData.rejectionReason,
      comments: rejectData.comments ?? null,
    },
  })

  await createAuditLog({
    action: 'WORKFLOW_APPROVAL',
    entityType: 'FORM_SUBMISSION',
    entityId: submissionId,
    userId: rejectData.rejectedBy,
    details: {
      status: 'REJECTED',
      rejectedBy: rejectData.rejectedBy,
      rejectionReason: rejectData.rejectionReason,
    },
  })

  return buildSubmissionView(submission)
}
