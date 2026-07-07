import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json({
        module: "stations",
        name: "مراكز وأقسام الشرطة",
        status: "active",
        timestamp: new Date().toISOString()
    });
}
