import { prisma } from '@/lib/prisma';
import {
  validateHierarchyRelation,
  createHierarchyEntity as createHierarchyNode,
  updateHierarchyEntity as updateHierarchyNode,
  deleteHierarchyEntity as deleteHierarchyNode,
  getHierarchyTree,
} from '@/lib/hierarchy-service';
import { createAuditLog, extractRequestMeta } from '@/lib/core/audit-engine';
import { createHierarchySchema, updateHierarchySchema } from '@/lib/schemas/hierarchy.schema';
import { z } from 'zod';

export async function getAllHierarchyEntities() {
  const roots = await prisma.centralCommand.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });

  return Promise.all(
    roots.map(async (root) => ({
      id: root.id,
      name: root.name,
      code: root.code,
      type: 'MINISTRY',
      parentId: null,
      children: await getHierarchyTree(root.id, 6),
    })),
  );
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

  const newEntity = await createHierarchyNode({
    name: data.name,
    code: data.code,
    type: data.type,
    parentId: data.parentId || undefined,
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
  const updated = await updateHierarchyNode(data.id, {
    name: data.name,
    parentId: undefined,
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
  await deleteHierarchyNode(id);

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
