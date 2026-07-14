/**
 * Audit API Route
 * Thin wrapper around the existing Audit Engine - no duplicate backend logic.
 * Exposes getAuditLogs() from lib/core/audit-engine.ts to the client.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/core/audit-engine';
import { getAuthenticatedUser } from '@/lib/auth';
import { Permission, hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        if (!hasPermission(user.role, Permission.VIEW_AUDIT_LOGS)) {
            return NextResponse.json({ error: 'ليس لديك صلاحية لعرض السجل التدقيقي' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
        const entityType = searchParams.get('entityType') || undefined;
        const entityId = searchParams.get('entityId') || undefined;
        const userId = searchParams.get('userId') || undefined;
        const action = searchParams.get('action') || undefined;

        const result = await getAuditLogs({
            page,
            pageSize,
            entityType,
            entityId,
            userId,
            action,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch audit logs' },
            { status: 500 }
        );
    }
}
