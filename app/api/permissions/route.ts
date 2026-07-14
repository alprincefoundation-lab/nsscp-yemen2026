import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getPermissions, getRoleById } from '@/lib/core/rbac-engine';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const url = new URL(request.url);
  const role = url.searchParams.get('role');

  if (role) {
    const roleRecord = await getRoleById(role);
    return NextResponse.json({
      role: roleRecord,
      permissions: await getPermissions(),
    });
  }

  return NextResponse.json({
    permissions: await getPermissions(),
    role: user.role,
  });
}
