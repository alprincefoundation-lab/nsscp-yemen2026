import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json({
        module: "settings",
        name: "الإعدادات العامة للمنظومة",
        status: "active",
        timestamp: new Date().toISOString()
    });
}
