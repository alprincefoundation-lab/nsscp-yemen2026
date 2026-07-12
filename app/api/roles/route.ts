import { NextRequest, NextResponse } from 'next/server';
import { getRoles } from '@/lib/core/rbac-engine';

export async function GET() {
  const roles = await getRoles();
  return NextResponse.json(roles);
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
