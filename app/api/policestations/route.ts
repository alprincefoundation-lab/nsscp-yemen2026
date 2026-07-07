import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json({
        sector: "policestations",
        name: "أقسام الشرطة",
        status: "active",
        securityLevel: "high",
        timestamp: new Date().toISOString(),
        metrics: {
            activeOperations: 12,
            staffOnDuty: 48,
            threatLevel: "low"
        }
    });
}
