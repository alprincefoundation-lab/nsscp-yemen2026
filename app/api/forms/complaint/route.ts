export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  createFormSubmission,
  getFormTemplateByType,
} from '@/lib/services/forms.service'
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

    // Get or create complaint form template
    let template = await getFormTemplateByType('COMPLAINT')

    if (!template) {
      // Create template if it doesn't exist
      template = await prisma.formTemplate.create({
        data: {
          name: 'complaint_form',
          displayName: 'نموذج استمارة الشكوى',
          formType: 'COMPLAINT',
          description: 'استمارة تقديم الشكاوى الجنائية والمدنية',
          fields: {
            create: [
              {
                fieldName: 'complaintNumber',
                displayLabel: 'رقم الشكوى',
                fieldType: 'TEXT',
                required: false,
                order: 1,
              },
              {
                fieldName: 'submissionDate',
                displayLabel: 'تاريخ تقديم الشكوى',
                fieldType: 'DATE',
                required: true,
                order: 2,
              },
              {
                fieldName: 'complainantName',
                displayLabel: 'اسم المشتكي',
                fieldType: 'TEXT',
                required: true,
                order: 3,
              },
              {
                fieldName: 'identityNumber',
                displayLabel: 'رقم الهوية',
                fieldType: 'TEXT',
                required: true,
                order: 4,
              },
              {
                fieldName: 'birthDate',
                displayLabel: 'تاريخ الميلاد',
                fieldType: 'DATE',
                required: true,
                order: 5,
              },
              {
                fieldName: 'gender',
                displayLabel: 'الجنس',
                fieldType: 'SELECT',
                required: true,
                order: 6,
                options: JSON.stringify([
                  { value: 'MALE', label: 'ذكر' },
                  { value: 'FEMALE', label: 'أنثى' },
                ]),
              },
              {
                fieldName: 'address',
                displayLabel: 'عنوان السكن',
                fieldType: 'TEXT',
                required: true,
                order: 7,
              },
              {
                fieldName: 'phoneNumber',
                displayLabel: 'رقم الهاتف',
                fieldType: 'TEXT',
                required: true,
                order: 8,
              },
              {
                fieldName: 'complaintType',
                displayLabel: 'نوع الشكوى',
                fieldType: 'SELECT',
                required: true,
                order: 9,
                options: JSON.stringify([
                  { value: 'CRIMINAL', label: 'شكوى جنائية' },
                  { value: 'CIVIL', label: 'شكوى مدنية' },
                  { value: 'SERVICE', label: 'شكوى خدمات' },
                  { value: 'OTHER', label: 'أخرى' },
                ]),
              },
              {
                fieldName: 'complaintDescription',
                displayLabel: 'وصف الشكوى',
                fieldType: 'TEXTAREA',
                required: true,
                order: 10,
              },
              {
                fieldName: 'incidentDate',
                displayLabel: 'تاريخ وقوع الحادث',
                fieldType: 'DATE',
                required: true,
                order: 11,
              },
              {
                fieldName: 'relatedEntity',
                displayLabel: 'الجهة المعنية',
                fieldType: 'TEXT',
                required: false,
                order: 12,
              },
              {
                fieldName: 'attachments',
                displayLabel: 'المرفقات',
                fieldType: 'FILE',
                required: false,
                order: 13,
              },
              {
                fieldName: 'complainantSignature',
                displayLabel: 'توقيع المشتكي',
                fieldType: 'SIGNATURE',
                required: false,
                order: 14,
              },
              {
                fieldName: 'additionalNotes',
                displayLabel: 'ملاحظات إضافية',
                fieldType: 'TEXTAREA',
                required: false,
                order: 15,
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
      relatedEntityType: 'COMPLAINT',
    })

    // If there are approvals required, create them based on workflow
    // This will integrate with the workflow engine

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
