export const dynamic = 'force-dynamic'

import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getHierarchyScope } from '@/lib/hierarchy/data-scope'
import { Prisma } from '@prisma/client'
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

const CRIME_TYPE_OPTIONS = [
  { value: 'THEFT', label: 'سرقة' },
  { value: 'ASSAULT', label: 'اعتداء' },
  { value: 'MURDER', label: 'قتل' },
  { value: 'FRAUD', label: 'احتيال' },
  { value: 'DRUGS', label: 'تجارة مخدرات' },
  { value: 'CYBER_CRIME', label: 'جرائم إلكترونية' },
  { value: 'HARASSMENT', label: 'تحرش' },
  { value: 'OTHER', label: 'أخرى' },
]

async function getInvestigationTemplate(): Promise<DynamicFormRow | null> {
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
    WHERE "code" = 'INVESTIGATION' OR "name" = 'investigation_form'
    ORDER BY "createdAt" DESC
    LIMIT 1
  `)

  return rows[0] ?? null
}

async function createInvestigationTemplate(hierarchyEntityId: string): Promise<DynamicFormRow> {
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
      'investigation_form',
      'INVESTIGATION',
      ${hierarchyEntityId},
      'استمارة توثيق التحقيقات في الشكاوى والجرائم',
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
    { name: 'investigationNumber', label: 'رقم التحقيق', type: 'TEXT', required: false, sortOrder: 1 },
    { name: 'startDate', label: 'تاريخ بدء التحقيق', type: 'DATE', required: true, sortOrder: 2 },
    { name: 'investigatorName', label: 'اسم المحقق المسؤول', type: 'TEXT', required: true, sortOrder: 3 },
    { name: 'investigatorId', label: 'رقم الهوية للمحقق', type: 'TEXT', required: true, sortOrder: 4 },
    { name: 'suspectName', label: 'اسم المشتبه به', type: 'TEXT', required: true, sortOrder: 5 },
    { name: 'suspectIdentity', label: 'رقم الهوية (أو جواز السفر) للمشتبه به', type: 'TEXT', required: true, sortOrder: 6 },
    { name: 'suspectBirthDate', label: 'تاريخ الميلاد للمشتبه به', type: 'DATE', required: true, sortOrder: 7 },
    { name: 'suspectAddress', label: 'عنوان المشتبه به', type: 'TEXT', required: true, sortOrder: 8 },
    { name: 'suspectPhone', label: 'رقم الهاتف للمشتبه به', type: 'TEXT', required: false, sortOrder: 9 },
    { name: 'crimeType', label: 'نوع الشكوى أو الجريمة', type: 'SELECT', required: true, sortOrder: 10, options: CRIME_TYPE_OPTIONS },
    { name: 'crimeDescription', label: 'تفاصيل الشكوى أو الجريمة', type: 'TEXTAREA', required: true, sortOrder: 11 },
    { name: 'crimeLocation', label: 'مكان وقوع الجريمة أو الشكوى', type: 'TEXT', required: true, sortOrder: 12 },
    { name: 'crimeDate', label: 'تاريخ وقوع الجريمة أو الشكوى', type: 'DATE', required: true, sortOrder: 13 },
    { name: 'crimeTime', label: 'وقت وقوع الجريمة أو الشكوى', type: 'TEXT', required: false, sortOrder: 14 },
    { name: 'availableEvidence', label: 'الأدلة المتاحة', type: 'TEXTAREA', required: false, sortOrder: 15 },
    { name: 'witnesses', label: 'الشهود', type: 'TEXTAREA', required: false, sortOrder: 16 },
    { name: 'actionsTaken', label: 'الإجراءات المتخذة', type: 'TEXTAREA', required: false, sortOrder: 17 },
    { name: 'notes', label: 'الملاحظات', type: 'TEXTAREA', required: false, sortOrder: 18 },
    { name: 'investigatorSignature', label: 'توقيع المحقق المسؤول', type: 'SIGNATURE', required: false, sortOrder: 19 },
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
    name: 'investigation_form',
    code: 'INVESTIGATION',
    hierarchyEntityId,
    description: 'استمارة توثيق التحقيقات في الشكاوى والجرائم',
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
    const validatedData = InvestigationFormSchema.parse(body)

    let template = await getInvestigationTemplate()
    if (!template) {
      template = await createInvestigationTemplate(departmentId)
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