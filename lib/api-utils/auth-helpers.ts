import { requireAuth } from '@/lib/auth/index';
import { hasPermission, Permission } from '@/lib/permissions';

export async function authorizeAction(requiredPermission: Permission) {
  const user = await requireAuth();
  const authorized = hasPermission(user.role, requiredPermission);
  if (!authorized) {
    throw new Error('Forbidden: ليس لديك الصلاحية الأمنية الكافية لإجراء هذه العملية.');
  }
  return user;
}
