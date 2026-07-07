import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-utils/error-handler';
import { authorizeAction } from '@/lib/api-utils/auth-helpers';
import { Permission } from '@/lib/permissions';
import { createHierarchySchema, updateHierarchySchema } from '@/lib/schemas/hierarchy.schema';
import * as hierarchyService from '@/lib/services/hierarchy.service';

export const GET = withErrorHandler(async () => {
  const data = await hierarchyService.getAllHierarchyEntities();
  return NextResponse.json({ success: true, data });
});

export const POST = withErrorHandler(async (request: Request) => {
  const user = await authorizeAction(Permission.MANAGE_HIERARCHY);
  const body = await request.json();
  const validatedData = createHierarchySchema.parse(body);

  const newEntity = await hierarchyService.createHierarchyEntity(validatedData, user.id, request);
  return NextResponse.json({ success: true, data: newEntity });
});

export const PUT = withErrorHandler(async (request: Request) => {
  const user = await authorizeAction(Permission.MANAGE_HIERARCHY);
  const body = await request.json();
  const validatedData = updateHierarchySchema.parse(body);

  const updated = await hierarchyService.updateHierarchyEntity(validatedData, user.id, request);
  return NextResponse.json({ success: true, data: updated });
});

export const DELETE = withErrorHandler(async (request: Request) => {
  const user = await authorizeAction(Permission.MANAGE_HIERARCHY);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    throw new Error('المعرف الفريد مطلوب');
  }

  const result = await hierarchyService.deleteHierarchyEntity(id, user.id, request);
  return NextResponse.json(result);
});