import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createAuditLog, extractRequestMeta } from '@/lib/core/audit-engine';

export async function loginUser(
  username: string,
  password: string,
  request: Request
) {
  const meta = extractRequestMeta(request);

  if (!username || !password) {
    throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور');
  }

  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      hierarchyUsers: {
        include: {
          hierarchyEntity: {
            select: { id: true, name: true, type: true, code: true }
          }
        }
      }
    }
  });

  if (!user) {
    // Audit failed login (User not found)
    await createAuditLog({
      action: 'LOGIN',
      entityType: 'USER',
      entityId: 'UNKNOWN',
      details: { username, success: false, reason: 'المستخدم غير موجود' },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    throw new Error('Unauthorized');
  }

  // 2. Check if active
  if (!user.isActive) {
    // Audit failed login (Inactive account)
    await createAuditLog({
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      details: { username, success: false, reason: 'الحساب معطل' },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    throw new Error('Forbidden');
  }

  // 3. Compare password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // Audit failed login (Wrong password)
    await createAuditLog({
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      details: { username, success: false, reason: 'كلمة مرور خاطئة' },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    throw new Error('Unauthorized');
  }

  // 4. Get primary hierarchy assignment
  const primaryHierarchy = user.hierarchyUsers.find(h => h.isPrimary) || user.hierarchyUsers[0];
  const userRole = primaryHierarchy?.role || 'VIEWER';
  const hierarchyEntityId = primaryHierarchy?.hierarchyEntityId || null;
  const hierarchyEntityName = primaryHierarchy?.hierarchyEntity?.name || null;
  const hierarchyEntityType = primaryHierarchy?.hierarchyEntity?.type || null;

  // Audit successful login
  await createAuditLog({
    action: 'LOGIN',
    entityType: 'USER',
    entityId: user.id,
    userId: user.id,
    details: { username, success: true },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    hierarchyEntityId,
    hierarchyEntityType: 'HIERARCHY_ENTITY',
  });

  return {
    user,
    userRole,
    hierarchyEntityId,
    hierarchyEntityName,
    hierarchyEntityType,
  };
}
