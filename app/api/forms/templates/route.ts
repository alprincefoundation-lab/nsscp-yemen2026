export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createFormTemplate, listFormTemplates } from '@/lib/services/forms.service'
import { z } from 'zod'

const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  formType: z.string().min(1),
  departmentId: z.string().optional(),
  fields: z.array(
    z.object({
      fieldName: z.string().min(1),
      displayLabel: z.string().min(1),
      fieldType: z.enum([
        'TEXT',
        'NUMBER',
        'EMAIL',
        'DATE',
        'SELECT',
        'CHECKBOX',
        'TEXTAREA',
        'FILE',
        'SIGNATURE',
      ]),
      required: z.boolean().optional().default(false),
      order: z.number().int().positive(),
      options: z.string().optional(),
      validation: z.string().optional(),
      placeholder: z.string().optional(),
    })
  ),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateTemplateSchema.parse(body)

    const template = await createFormTemplate(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: template,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[v0] Create template error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const formType = searchParams.get('formType')
    const departmentId = searchParams.get('departmentId')
    const isActive = searchParams.get('isActive')

    const templates = await listFormTemplates({
      ...(formType && { formType }),
      ...(departmentId && { departmentId }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
    })

    return NextResponse.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    console.error('[v0] List templates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
