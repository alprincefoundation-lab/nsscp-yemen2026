export const dynamic = 'force-dynamic'

import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getHierarchyScope } from '@/lib/hierarchy/data-scope'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const ComplaintFormSchema = z.object({
  complaintNumber: z.string().optional(),
  submissionDate: z.string(),
  complainantName: z.string().min(1),
  identityNumber: z.string().min(1),
  birthDate: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  address: z.string().min(1),
  phoneNumber: z.string().min(1),
  complaintType: z.enum(['CRIMINAL', 'CIVIL', 'SERVICE', 'OTHER']),
  complaintDescription: z.string().min(10),
  incidentDate: z.string(),
  relatedEntity: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  complainantSignature: z.string().optional(),
  signatureDate: z.string().optional(),
  additionalNotes: z.string().optional(),
})

type DynamicFormRow = {
  id: string
  name: string
  code: string | null
  hierarchyEntityId: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

type FormSubmissionRow = {
  id: string
  templateId: string
  data: unknown
  submittedBy: string | null
  createdAt: Date
  updatedAt: Date
}

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'ذكر' },
  { value: 'FEMALE', label: 'أنثى' },
]

const COMPLAINT_TYPE_OPTIONS = [
  { value: 'CRIMINAL', label: 'شكوى جنائية' },
  { value: 'CIVIL', label: 'شكوى مدنية' },
  { value: 'SERVICE', label: 'شكوى خدمات' },
  { value: 'OTHER', label: 'أخرى' },
]

async function getComplaintTemplate(): Promise<DynamicFormRow | null> {
  const rows = await prisma.$queryRaw<DynamicFormRow[]>(Prisma.sql`
    SELECT
      "id",
      "name",
      "code",
      "hierarchyEntityId",
      "description",
      "createdAt",
      "updatedAt"
    FROM "DynamicForm"
    WHERE "code" = 'COMPLAINT' OR "name" = 'complaint_form'
    ORDER BY "createdAt" DESC
    LIMIT 1
  `)

  return rows[0] ?? null
}

async function createComplaintTemplate(hierarchyEntityId: string): Promise<DynamicFormRow> {
  const templateId = randomUUID()
  const now = new Date()

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "DynamicForm" (
      "id",
      "name",
      "code",
      "hierarchyEntityId",
      "description",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${templateId},
      'complaint_form',
      'COMPLAINT',
      ${hierarchyEntityId},
      'استمارة تقديم الشكاوى الجنائية والمدنية',
      ${now},
      ${now}
    )
  `)

  const fieldRows: Array<{
    name: string
    label: string
    type: string
    required: boolean
    sortOrder: number
    options?: Array<{ value: string; label: string }> | null
  }> = [
    { name: 'complaintNumber', label: 'رقم الشكوى', type: 'TEXT', required: false, sortOrder: 1 },
    { name: 'submissionDate', label: 'تاريخ تقديم الشكوى', type: 'DATE', required: true, sortOrder: 2 },
    { name: 'complainantName', label: 'اسم المشتكي', type: 'TEXT', required: true, sortOrder: 3 },
    { name: 'identityNumber', label: 'رقم الهوية', type: 'TEXT', required: true, sortOrder: 4 },
    { name: 'birthDate', label: 'تاريخ الميلاد', type: 'DATE', required: true, sortOrder: 5 },
    { name: 'gender', label: 'الجنس', type: 'SELECT', required: true, sortOrder: 6, options: GENDER_OPTIONS },
    { name: 'address', label: 'عنوان السكن', type: 'TEXT', required: true, sortOrder: 7 },
    { name: 'phoneNumber', label: 'رقم الهاتف', type: 'TEXT', required: true, sortOrder: 8 },
    { name: 'complaintType', label: 'نوع الشكوى', type: 'SELECT', required: true, sortOrder: 9, options: COMPLAINT_TYPE_OPTIONS },
    { name: 'complaintDescription', label: 'وصف الشكوى', type: 'TEXTAREA', required: true, sortOrder: 10 },
    { name: 'incidentDate', label: 'تاريخ وقوع الحادث', type: 'DATE', required: true, sortOrder: 11 },
    { name: 'relatedEntity', label: 'الجهة المعنية', type: 'TEXT', required: false, sortOrder: 12 },
    { name: 'attachments', label: 'المرفقات', type: 'FILE', required: false, sortOrder: 13 },
    { name: 'complainantSignature', label: 'توقيع المشتكي', type: 'SIGNATURE', required: false, sortOrder: 14 },
    { name: 'additionalNotes', label: 'ملاحظات إضافية', type: 'TEXTAREA', required: false, sortOrder: 15 },
  ]

  for (const field of fieldRows) {
    const optionsJson = field.options ? JSON.stringify(field.options) : null
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "DynamicField" (
        "id",
        "formId",
        "name",
        "label",
        "type",
        "required",
        "options",
        "sortOrder",
        "placeholder",
        "validationRules",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${randomUUID()},
        ${templateId},
        ${field.name},
        ${field.label},
        ${field.type},
        ${field.required},
        ${optionsJson ?? null}::jsonb,
        ${field.sortOrder},
        NULL,
        NULL,
        ${now},
        ${now}
      )
    `)
  }

  return {
    id: templateId,
    name: 'complaint_form',
    code: 'COMPLAINT',
    hierarchyEntityId,
    description: 'استمارة تقديم الشكاوى الجنائية والمدنية',
    createdAt: now,
    updatedAt: now,
  }
}

async function createSubmission(args: {
  templateId: string
  submittedBy: string
  departmentId: string
  formData: unknown
}): Promise<FormSubmissionRow> {
  const submissionId = randomUUID()
  const now = new Date()
  const dataJson = JSON.stringify({
    ...((args.formData as Record<string, unknown>) || {}),
    departmentId: args.departmentId,
  })

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "FormSubmission" (
      "id",
      "templateId",
      "data",
      "submittedBy",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${submissionId},
      ${args.templateId},
      ${dataJson}::jsonb,
      ${args.submittedBy},
      ${now},
      ${now}
    )
  `)

  const rows = await prisma.$queryRaw<FormSubmissionRow[]>(Prisma.sql`
    SELECT
      "id",
      "templateId",
      "data",
      "submittedBy",
      "createdAt",
      "updatedAt"
    FROM "FormSubmission"
    WHERE "id" = ${submissionId}
    LIMIT 1
  `)

  return rows[0] ?? {
    id: submissionId,
    templateId: args.templateId,
    data: {
      ...(args.formData as Record<string, unknown>),
      departmentId: args.departmentId,
    },
    submittedBy: args.submittedBy,
    createdAt: now,
    updatedAt: now,
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const scope = await getHierarchyScope(auth)

    if (!auth.hierarchyEntityId) {
      return NextResponse.json(
        { error: 'Hierarchy context is required' },
        { status: 400 }
      )
    }

    const departmentId = auth.hierarchyEntityId

    // Validate departmentId is within scope
    if (scope.allowedEntityIds.length > 0 && !scope.allowedEntityIds.includes(departmentId)) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذا النطاق' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = ComplaintFormSchema.parse(body)

    let template = await getComplaintTemplate()
    if (!template) {
      template = await createComplaintTemplate(departmentId)
    }

    const submission = await createSubmission({
      templateId: template.id,
      submittedBy: auth.id,
      departmentId,
      formData: validatedData,
    })

    return NextResponse.json(
      {
        success: true,
        data: submission,
        message: 'تم تقديم الشكوى بنجاح',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'فشل التحقق من صحة البيانات', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[v0] Complaint form error:', error)
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}