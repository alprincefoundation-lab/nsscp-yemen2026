import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDepartmentMetrics } from '@/lib/services/department-metrics.service';

export async function GET(request: NextRequest) {
    await requireAuth(request as any);
    const metrics = await getDepartmentMetrics('gateway');
    return NextResponse.json({
        sector: 'gateway',
        name: 'البوابة الرئيسية (تسجيل المراجعين)',
        status: 'active',
        securityLevel: 'high',
        timestamp: new Date().toISOString(),
        metrics,
    });
}
