import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDepartmentMetrics } from '@/lib/services/department-metrics.service';

export async function GET(request: NextRequest) {
    await requireAuth(request as any);
    const metrics = await getDepartmentMetrics('criminalinvestigation');
    return NextResponse.json({
        sector: 'criminalinvestigation',
        name: 'البحث الجنائي',
        status: 'active',
        securityLevel: 'high',
        timestamp: new Date().toISOString(),
        metrics,
    });
}
