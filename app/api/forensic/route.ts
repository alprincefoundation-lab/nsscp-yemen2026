import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDepartmentMetrics } from '@/lib/services/department-metrics.service';

export async function GET(request: NextRequest) {
    await requireAuth(request as any);
    const metrics = await getDepartmentMetrics('forensic');
    return NextResponse.json({
        sector: 'forensic',
        name: 'الأدلة الجنائية',
        status: 'active',
        securityLevel: 'high',
        timestamp: new Date().toISOString(),
        metrics,
    });
}
