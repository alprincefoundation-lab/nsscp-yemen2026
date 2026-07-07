import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json({
        module: "districts",
        name: "إدارة المديريات",
        status: "active",
        timestamp: new Date().toISOString()
    });
}
