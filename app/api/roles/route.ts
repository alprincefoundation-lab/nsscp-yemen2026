import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getRoles } from '@/lib/core/rbac-engine';

export async function GET(request: NextRequest) {
  await requireAuth(request);
  const roles = await getRoles();
  return NextResponse.json(roles);
}

export async function POST(request: NextRequest) {
  await requireAuth(request);
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
