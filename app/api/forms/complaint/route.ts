export const dynamic = 'force-dynamic'

import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''")
}

function sqlValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'NULL'
  }

  return `'${escapeSqlLiteral(value)}'`
}

function sqlJson(value: unknown): string {
  return `'${escapeSqlLiteral(JSON.stringify(value))}'::jsonb`
}

async function getComplaintTemplate(): Promise<DynamicFormRow | null> {
  const rows = await prisma.$queryRawUnsafe<DynamicFormRow[]>(`
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
  const now = new Date().toISOString()

  await prisma.$executeRawUnsafe(`
    INSERT INTO "DynamicForm" (
      "id",
      "name",
      "code",
      "hierarchyEntityId",
      "description",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${sqlValue(templateId)},
      'complaint_form',
      'COMPLAINT',
      ${sqlValue(hierarchyEntityId)},
      ${sqlValue('استمارة تقديم الشكاوى الجنائية والمدنية')},
      ${sqlValue(now)},
      ${sqlValue(now)}
    )
  `)

  const fieldRows = [
    ['complaintNumber', 'رقم الشكوى', 'TEXT', false, 1],
    ['submissionDate', 'تاريخ تقديم الشكوى', 'DATE', true, 2],
    ['complainantName', 'اسم المشتكي', 'TEXT', true, 3],
    ['identityNumber', 'رقم الهوية', 'TEXT', true, 4],
    ['birthDate', 'تاريخ الميلاد', 'DATE', true, 5],
    ['gender', 'الجنس', 'SELECT', true, 6],
    ['address', 'عنوان السكن', 'TEXT', true, 7],
    ['phoneNumber', 'رقم الهاتف', 'TEXT', true, 8],
    ['complaintType', 'نوع الشكوى', 'SELECT', true, 9],
    ['complaintDescription', 'وصف الشكوى', 'TEXTAREA', true, 10],
    ['incidentDate', 'تاريخ وقوع الحادث', 'DATE', true, 11],
    ['relatedEntity', 'الجهة المعنية', 'TEXT', false, 12],
    ['attachments', 'المرفقات', 'FILE', false, 13],
    ['complainantSignature', 'توقيع المشتكي', 'SIGNATURE', false, 14],
    ['additionalNotes', 'ملاحظات إضافية', 'TEXTAREA', false, 15],
  ] as const

  for (const [name, label, type, required, sortOrder] of fieldRows) {
    const options =
      name === 'gender'
        ? [{ value: 'MALE', label: 'ذكر' }, { value: 'FEMALE', label: 'أنثى' }]
        : name === 'complaintType'
          ? [
              { value: 'CRIMINAL', label: 'شكوى جنائية' },
              { value: 'CIVIL', label: 'شكوى مدنية' },
              { value: 'SERVICE', label: 'شكوى خدمات' },
              { value: 'OTHER', label: 'أخرى' },
            ]
          : null

    await prisma.$executeRawUnsafe(`
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
        ${sqlValue(randomUUID())},
        ${sqlValue(templateId)},
        ${sqlValue(name)},
        ${sqlValue(label)},
        ${sqlValue(type)},
        ${required ? 'TRUE' : 'FALSE'},
        ${options ? sqlJson(options) : 'NULL'},
        ${sortOrder},
        NULL,
        NULL,
        ${sqlValue(now)},
        ${sqlValue(now)}
      )
    `)
  }

  return {
    id: templateId,
    name: 'complaint_form',
    code: 'COMPLAINT',
    hierarchyEntityId,
    description: 'استمارة تقديم الشكاوى الجنائية والمدنية',
    createdAt: new Date(now),
    updatedAt: new Date(now),
  }
}

async function createSubmission(args: {
  templateId: string
  submittedBy: string
  departmentId: string
  formData: unknown
}): Promise<FormSubmissionRow> {
  const submissionId = randomUUID()
  const now = new Date().toISOString()

  await prisma.$executeRawUnsafe(`
    INSERT INTO "FormSubmission" (
      "id",
      "templateId",
      "data",
      "submittedBy",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${sqlValue(submissionId)},
      ${sqlValue(args.templateId)},
      ${sqlJson({
        ...((args.formData as Record<string, unknown>) || {}),
        departmentId: args.departmentId,
      })},
      ${sqlValue(args.submittedBy)},
      ${sqlValue(now)},
      ${sqlValue(now)}
    )
  `)

  const rows = await prisma.$queryRawUnsafe<FormSubmissionRow[]>(`
    SELECT
      "id",
      "templateId",
      "data",
      "submittedBy",
      "createdAt",
      "updatedAt"
    FROM "FormSubmission"
    WHERE "id" = ${sqlValue(submissionId)}
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
    createdAt: new Date(now),
    updatedAt: new Date(now),
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const departmentId = request.headers.get('x-department-id') || 'police'

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - missing user ID' },
        { status: 401 }
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
      submittedBy: userId,
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
