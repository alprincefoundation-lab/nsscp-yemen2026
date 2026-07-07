export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  createFormSubmission,
  getFormTemplateByType,
} from '@/lib/services/forms.service'
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

    // Get or create investigation form template
    let template = await getFormTemplateByType('INVESTIGATION')

    if (!template) {
      // Create template if it doesn't exist
      template = await prisma.formTemplate.create({
        data: {
          name: 'investigation_form',
          displayName: 'نموذج استمارة التحقيقات',
          formType: 'INVESTIGATION',
          description: 'استمارة توثيق التحقيقات في الشكاوى والجرائم',
          fields: {
            create: [
              {
                fieldName: 'investigationNumber',
                displayLabel: 'رقم التحقيق',
                fieldType: 'TEXT',
                required: false,
                order: 1,
              },
              {
                fieldName: 'startDate',
                displayLabel: 'تاريخ بدء التحقيق',
                fieldType: 'DATE',
                required: true,
                order: 2,
              },
              {
                fieldName: 'investigatorName',
                displayLabel: 'اسم المحقق المسؤول',
                fieldType: 'TEXT',
                required: true,
                order: 3,
              },
              {
                fieldName: 'investigatorId',
                displayLabel: 'رقم الهوية للمحقق',
                fieldType: 'TEXT',
                required: true,
                order: 4,
              },
              {
                fieldName: 'suspectName',
                displayLabel: 'اسم المشتبه به',
                fieldType: 'TEXT',
                required: true,
                order: 5,
              },
              {
                fieldName: 'suspectIdentity',
                displayLabel: 'رقم الهوية (أو جواز السفر) للمشتبه به',
                fieldType: 'TEXT',
                required: true,
                order: 6,
              },
              {
                fieldName: 'suspectBirthDate',
                displayLabel: 'تاريخ الميلاد للمشتبه به',
                fieldType: 'DATE',
                required: true,
                order: 7,
              },
              {
                fieldName: 'suspectAddress',
                displayLabel: 'عنوان المشتبه به',
                fieldType: 'TEXT',
                required: true,
                order: 8,
              },
              {
                fieldName: 'suspectPhone',
                displayLabel: 'رقم الهاتف للمشتبه به',
                fieldType: 'TEXT',
                required: false,
                order: 9,
              },
              {
                fieldName: 'crimeType',
                displayLabel: 'نوع الشكوى أو الجريمة',
                fieldType: 'SELECT',
                required: true,
                order: 10,
                options: JSON.stringify([
                  { value: 'THEFT', label: 'سرقة' },
                  { value: 'ASSAULT', label: 'اعتداء' },
                  { value: 'MURDER', label: 'قتل' },
                  { value: 'FRAUD', label: 'احتيال' },
                  { value: 'DRUGS', label: 'تجارة مخدرات' },
                  { value: 'CYBER_CRIME', label: 'جرائم إلكترونية' },
                  { value: 'HARASSMENT', label: 'تحرش' },
                  { value: 'OTHER', label: 'أخرى' },
                ]),
              },
              {
                fieldName: 'crimeDescription',
                displayLabel: 'تفاصيل الشكوى أو الجريمة',
                fieldType: 'TEXTAREA',
                required: true,
                order: 11,
              },
              {
                fieldName: 'crimeLocation',
                displayLabel: 'مكان وقوع الجريمة أو الشكوى',
                fieldType: 'TEXT',
                required: true,
                order: 12,
              },
              {
                fieldName: 'crimeDate',
                displayLabel: 'تاريخ وقوع الجريمة أو الشكوى',
                fieldType: 'DATE',
                required: true,
                order: 13,
              },
              {
                fieldName: 'crimeTime',
                displayLabel: 'وقت وقوع الجريمة أو الشكوى',
                fieldType: 'TEXT',
                required: false,
                order: 14,
              },
              {
                fieldName: 'availableEvidence',
                displayLabel: 'الأدلة المتاحة',
                fieldType: 'TEXTAREA',
                required: false,
                order: 15,
              },
              {
                fieldName: 'witnesses',
                displayLabel: 'الشهود',
                fieldType: 'TEXTAREA',
                required: false,
                order: 16,
              },
              {
                fieldName: 'actionsTaken',
                displayLabel: 'الإجراءات المتخذة',
                fieldType: 'TEXTAREA',
                required: false,
                order: 17,
              },
              {
                fieldName: 'notes',
                displayLabel: 'الملاحظات',
                fieldType: 'TEXTAREA',
                required: false,
                order: 18,
              },
              {
                fieldName: 'investigatorSignature',
                displayLabel: 'توقيع المحقق المسؤول',
                fieldType: 'SIGNATURE',
                required: false,
                order: 19,
              },
            ],
          },
        },
        include: { fields: true },
      })
    }

    // Create submission
    const submission = await createFormSubmission({
      templateId: template.id,
      submittedBy: userId,
      departmentId,
      formData: validatedData,
      relatedEntityType: 'INVESTIGATION',
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
