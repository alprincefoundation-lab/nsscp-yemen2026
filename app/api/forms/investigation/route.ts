export const dynamic = 'force-dynamic'

import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const InvestigationFormSchema = z.object({
  investigationNumber: z.string().optional(),
  startDate: z.string(),
  investigatorName: z.string().min(1),
  investigatorId: z.string().min(1),
  suspectName: z.string().min(1),
  suspectIdentity: z.string().min(1),
  suspectBirthDate: z.string(),
  suspectAddress: z.string().min(1),
  suspectPhone: z.string().optional(),
  crimeType: z.string().min(1),
  crimeDescription: z.string().min(10),
  crimeLocation: z.string().min(1),
  crimeDate: z.string(),
  crimeTime: z.string().optional(),
  availableEvidence: z.string().optional(),
  witnesses: z.string().optional(),
  actionsTaken: z.string().optional(),
  notes: z.string().optional(),
  investigatorSignature: z.string().optional(),
  signatureDate: z.string().optional(),
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

async function getInvestigationTemplate(): Promise<DynamicFormRow | null> {
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
    WHERE "code" = 'INVESTIGATION' OR "name" = 'investigation_form'
    ORDER BY "createdAt" DESC
    LIMIT 1
  `)

  return rows[0] ?? null
}

async function createInvestigationTemplate(hierarchyEntityId: string): Promise<DynamicFormRow> {
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
      'investigation_form',
      'INVESTIGATION',
      ${sqlValue(hierarchyEntityId)},
      ${sqlValue('استمارة توثيق التحقيقات في الشكاوى والجرائم')},
      ${sqlValue(now)},
      ${sqlValue(now)}
    )
  `)

  const fieldRows = [
    ['investigationNumber', 'رقم التحقيق', 'TEXT', false, 1],
    ['startDate', 'تاريخ بدء التحقيق', 'DATE', true, 2],
    ['investigatorName', 'اسم المحقق المسؤول', 'TEXT', true, 3],
    ['investigatorId', 'رقم الهوية للمحقق', 'TEXT', true, 4],
    ['suspectName', 'اسم المشتبه به', 'TEXT', true, 5],
    ['suspectIdentity', 'رقم الهوية (أو جواز السفر) للمشتبه به', 'TEXT', true, 6],
    ['suspectBirthDate', 'تاريخ الميلاد للمشتبه به', 'DATE', true, 7],
    ['suspectAddress', 'عنوان المشتبه به', 'TEXT', true, 8],
    ['suspectPhone', 'رقم الهاتف للمشتبه به', 'TEXT', false, 9],
    ['crimeType', 'نوع الشكوى أو الجريمة', 'SELECT', true, 10],
    ['crimeDescription', 'تفاصيل الشكوى أو الجريمة', 'TEXTAREA', true, 11],
    ['crimeLocation', 'مكان وقوع الجريمة أو الشكوى', 'TEXT', true, 12],
    ['crimeDate', 'تاريخ وقوع الجريمة أو الشكوى', 'DATE', true, 13],
    ['crimeTime', 'وقت وقوع الجريمة أو الشكوى', 'TEXT', false, 14],
    ['availableEvidence', 'الأدلة المتاحة', 'TEXTAREA', false, 15],
    ['witnesses', 'الشهود', 'TEXTAREA', false, 16],
    ['actionsTaken', 'الإجراءات المتخذة', 'TEXTAREA', false, 17],
    ['notes', 'الملاحظات', 'TEXTAREA', false, 18],
    ['investigatorSignature', 'توقيع المحقق المسؤول', 'SIGNATURE', false, 19],
  ] as const

  for (const [name, label, type, required, sortOrder] of fieldRows) {
    const options =
      name === 'crimeType'
        ? [
            { value: 'THEFT', label: 'سرقة' },
            { value: 'ASSAULT', label: 'اعتداء' },
            { value: 'MURDER', label: 'قتل' },
            { value: 'FRAUD', label: 'احتيال' },
            { value: 'DRUGS', label: 'تجارة مخدرات' },
            { value: 'CYBER_CRIME', label: 'جرائم إلكترونية' },
            { value: 'HARASSMENT', label: 'تحرش' },
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
    name: 'investigation_form',
    code: 'INVESTIGATION',
    hierarchyEntityId,
    description: 'استمارة توثيق التحقيقات في الشكاوى والجرائم',
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
    const validatedData = InvestigationFormSchema.parse(body)

    let template = await getInvestigationTemplate()
    if (!template) {
      template = await createInvestigationTemplate(departmentId)
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
        message: 'تم حفظ استمارة التحقيق بنجاح',
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
    console.error('[v0] Investigation form error:', error)
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}
