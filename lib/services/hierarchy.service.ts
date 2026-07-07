import { prisma } from '@/lib/prisma';
import { validateHierarchyRelation } from '@/lib/hierarchy-service';
import { createAuditLog, extractRequestMeta } from '@/lib/core/audit-engine';
import { createHierarchySchema, updateHierarchySchema } from '@/lib/schemas/hierarchy.schema';
import { z } from 'zod';

export async function getAllHierarchyEntities() {
  return await prisma.hierarchyEntity.findMany({
    orderBy: { createdAt: 'asc' },
  });
}

export async function createHierarchyEntity(
  data: z.infer<typeof createHierarchySchema>,
  userId: string,
  request: Request
) {
  const isValid = await validateHierarchyRelation(data.parentId || null, data.type);
  if (!isValid) {
    throw new Error('مخالفة صريحة للتراتبية الإدارية والأمنية المعتمدة.');
  }

  const newEntity = await prisma.hierarchyEntity.create({
    data: {
      name: data.name,
      code: data.code,
      type: data.type,
      parentId: data.parentId || null,
    },
  });

  const meta = extractRequestMeta(request);
  await createAuditLog({
    action: 'CREATE_HIERARCHY_ENTITY',
    entityType: 'HIERARCHY_ENTITY',
    entityId: newEntity.id,
    userId,
    details: { name: data.name, code: data.code, type: data.type, parentId: data.parentId || null },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    hierarchyEntityId: newEntity.id,
    hierarchyEntityType: 'HIERARCHY_ENTITY',
  });

  return newEntity;
}

export async function updateHierarchyEntity(
  data: z.infer<typeof updateHierarchySchema>,
  userId: string,
  request: Request
) {
  const updated = await prisma.hierarchyEntity.update({
    where: { id: data.id },
    data: {
      name: data.name,
      code: data.code,
    },
  });

  const meta = extractRequestMeta(request);
  await createAuditLog({
    action: 'UPDATE_HIERARCHY_ENTITY',
    entityType: 'HIERARCHY_ENTITY',
    entityId: data.id,
    userId,
    details: { name: data.name, code: data.code, previousName: updated.name },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    hierarchyEntityId: data.id,
    hierarchyEntityType: 'HIERARCHY_ENTITY',
  });

  return updated;
}

export async function deleteHierarchyEntity(
  id: string,
  userId: string,
  request: Request
) {
  const hasChildren = await prisma.hierarchyEntity.findFirst({
    where: { parentId: id },
  });

  if (hasChildren) {
    throw new Error('حظر أمني: لا يمكن حذف الكيان لوجود فروع تابعة له في شجرة النظام.');
  }

  await prisma.hierarchyEntity.delete({ where: { id } });

  const meta = extractRequestMeta(request);
  await createAuditLog({
    action: 'DELETE_HIERARCHY_ENTITY',
    entityType: 'HIERARCHY_ENTITY',
    entityId: id,
    userId,
    details: { deletedEntityId: id },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    hierarchyEntityId: id,
    hierarchyEntityType: 'HIERARCHY_ENTITY',
  });

  return { success: true, message: 'تم الحذف من المنومة السيادية بنجاح.' };
}
