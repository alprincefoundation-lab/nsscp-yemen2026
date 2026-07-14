import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    await requireAuth(request as any);
    return NextResponse.json({
        module: "districts",
        name: "إدارة المديريات",
        status: "active",
        timestamp: new Date().toISOString()
    });
}
