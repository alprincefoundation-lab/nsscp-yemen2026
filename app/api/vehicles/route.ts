import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json({
        module: "vehicles",
        name: "إدارة المركبات والآليات",
        status: "active",
        timestamp: new Date().toISOString()
    });
}
