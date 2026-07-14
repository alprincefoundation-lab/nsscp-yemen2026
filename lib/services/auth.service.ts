import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createAuditLog, extractRequestMeta } from '@/lib/core/audit-engine';
import { resolveOfficerHierarchyContext } from '@/lib/auth';

export async function loginUser(
  username: string,
  password: string,
  request: Request
) {
  const meta = extractRequestMeta(request);

  if (!username || !password) {
    throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور');
  }

  // 1. Find officer by legacy username mapping
  const user = await prisma.officer.findFirst({
    where: { name: username },
    select: {
      id: true,
      name: true,
      rank: true,
      role: true,
      department: true,
      passwordHash: true,
    },
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

  if (!user.passwordHash) {
    await createAuditLog({
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      details: { username, success: false, reason: 'Hash مفقود' },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    throw new Error('Unauthorized');
  }

  // 2. Compare password against the stored bcrypt hash.
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
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

  // 3. Map officer fields to the legacy response contract
  const userRole = user.role || 'VIEWER';
  const hierarchyContext = await resolveOfficerHierarchyContext(user.id);
  const hierarchyEntityId = hierarchyContext.hierarchyEntityId;
  const hierarchyEntityName = hierarchyContext.hierarchyEntityName || user.department || null;
  const hierarchyEntityType = hierarchyContext.hierarchyEntityType || 'OFFICER';

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
