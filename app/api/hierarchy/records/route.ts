/**
 * API endpoints for Dynamic Records (السجلات الديناميكية)
 * Uses DynamicRecord model with hierarchy context
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/hierarchy/records?formId=xxx
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const formId = searchParams.get('formId');
        const id = searchParams.get('id');

        if (!formId && !id) {
            return NextResponse.json(
                { error: 'formId or id parameter is required' },
                { status: 400 }
            );
        }

        if (id) {
            const record = await prisma.dynamicRecord.findUnique({
                where: { id },
                include: {
                    form: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            hierarchyEntityId: true,
                        }
                    },
                    createdBy: {
                        select: { id: true, username: true, fullName: true }
                    },
                    attachments: true,
                },
            });

            if (!record) {
                return NextResponse.json({ error: 'Record not found' }, { status: 404 });
            }

            return NextResponse.json(record);
        }

        // Get all records for a form
        const records = await prisma.dynamicRecord.findMany({
            where: { formId: formId! },
            include: {
                createdBy: {
                    select: { id: true, username: true, fullName: true }
                },
                attachments: {
                    select: { id: true, originalName: true, mimeType: true, fileSize: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json(records);
    } catch (error) {
        console.error('Error fetching records:', error);
        return NextResponse.json(
            { error: 'Failed to fetch records' },
            { status: 500 }
        );
    }
}

// POST /api/hierarchy/records
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { formId, data, createdById } = body;

        if (!formId || !data) {
            return NextResponse.json(
                { error: 'Missing required fields: formId, data' },
                { status: 400 }
            );
        }

        const record = await prisma.dynamicRecord.create({
            data: {
                formId,
                data,
                createdById: createdById || undefined,
            },
        });

        return NextResponse.json(record, { status: 201 });
    } catch (error) {
        console.error('Error creating record:', error);
        return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
    }
}

// PUT /api/hierarchy/records?id=xxx
export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

        const body = await request.json();
        const { data } = body;

        const record = await prisma.dynamicRecord.update({
            where: { id },
            data: { ...(data && { data }) },
        });

        return NextResponse.json(record);
    } catch (error) {
        console.error('Error updating record:', error);
        return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
    }
}

// DELETE /api/hierarchy/records?id=xxx
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

        await prisma.dynamicRecord.delete({ where: { id } });
        return NextResponse.json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting record:', error);
        return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
    }
}