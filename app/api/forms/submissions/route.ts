export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getHierarchyScope } from '@/lib/hierarchy/data-scope'
import {
  createFormSubmission,
  listFormSubmissions,
  getFormSubmission,
} from '@/lib/services/forms.service'
import { z } from 'zod'

const CreateSubmissionSchema = z.object({
  templateId: z.string().min(1),
  submittedBy: z.string().min(1),
  departmentId: z.string().min(1),
  formData: z.record(z.unknown()),
  relatedEntityId: z.string().optional(),
  relatedEntityType: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const scope = await getHierarchyScope(auth)
    const body = await request.json()
    const validatedData = CreateSubmissionSchema.parse(body)

    if (validatedData.departmentId && scope.allowedEntityIds.length > 0 && !scope.allowedEntityIds.includes(validatedData.departmentId)) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذا النطاق' },
        { status: 403 }
      )
    }

    const submission = await createFormSubmission(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: submission,
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
    console.error('[v0] Create submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const templateId = searchParams.get('templateId')
    const departmentId = searchParams.get('departmentId')
    const submittedBy = searchParams.get('submittedBy')
    const status = searchParams.get('status')
    const relatedEntityId = searchParams.get('relatedEntityId')
    const skip = searchParams.get('skip')
    const take = searchParams.get('take')

    const submissions = await listFormSubmissions({
      ...(templateId && { templateId }),
      ...(departmentId && { departmentId }),
      ...(submittedBy && { submittedBy }),
      ...(status && { status }),
      ...(relatedEntityId && { relatedEntityId }),
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    })

    return NextResponse.json({
      success: true,
      data: submissions,
    })
  } catch (error) {
    console.error('[v0] List submissions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
