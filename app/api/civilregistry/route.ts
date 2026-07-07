import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json({
        sector: "civilregistry",
        name: "السجل المدني",
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
