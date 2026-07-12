import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getRolePermissions, Permission } from '@/lib/permissions';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const permissions = getRolePermissions(user.role as any);

    return NextResponse.json({
      permissions: permissions,
      role: user.role,
    });
  } catch (error) {
    console.error('User Permissions Error:', error);
    return NextResponse.json({ error: 'حدث خطأ داخلي' }, { status: 500 });
  }
}
