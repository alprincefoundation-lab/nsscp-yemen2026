import { NextRequest, NextResponse } from 'next/server';
import { getPermissions, getRoleById } from '@/lib/core/rbac-engine';

export async function GET(request: NextRequest) {
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
  });
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
