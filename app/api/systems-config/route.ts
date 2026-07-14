import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await requireAuth(request);
  return NextResponse.json({ error: 'not implemented' }, { status: 501 });
}

export async function POST(request: NextRequest) {
  await requireAuth(request);
  return NextResponse.json({ error: 'not implemented' }, { status: 501 });
}
