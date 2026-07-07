import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json({
        module: "evidence",
        name: "إدارة الأدلة والمحجوزات",
        status: "active",
        timestamp: new Date().toISOString()
    });
}
