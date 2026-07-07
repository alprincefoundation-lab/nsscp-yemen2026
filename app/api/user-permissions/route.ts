import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { getRolePermissions, Permission } from '@/lib/permissions';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nsscp_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'الجلسة منتهية' }, { status: 401 });
    }

    // Get permissions for the user's role
    const permissions = getRolePermissions(payload.role as any);

    return NextResponse.json({
      permissions: permissions,
      role: payload.role,
    });
  } catch (error) {
    console.error('User Permissions Error:', error);
    return NextResponse.json({ error: 'حدث خطأ داخلي' }, { status: 500 });
  }
}