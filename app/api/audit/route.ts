/**
 * Audit API Route
 * Thin wrapper around the existing Audit Engine - no duplicate backend logic.
 * Exposes getAuditLogs() from lib/core/audit-engine.ts to the client.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/core/audit-engine';

export async function GET(request: NextRequest) {
    try {
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