import { NextRequest, NextResponse } from 'next/server';
import { apiGuard } from '@/lib/hierarchy/guard';
import { executeTransition } from '@/lib/core/workflow-engine';
import { createAuditLog, extractRequestMeta } from '@/lib/core/audit-engine';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Guard check
    const guard = await apiGuard(req, { requireOneOf: ['OFFICER', 'DEPARTMENT_MANAGER', 'SECTION_MANAGER'] });
    if ('error' in guard) return guard.error;
    const { user } = guard;

    const { status, note } = await req.json();
    const { id: caseId } = await params;

    // 2. Execute Workflow Transition
    const result = await executeTransition({
      entityType: 'CASE',
      entityId: caseId,
      action: 'SUBMIT',
      fromStatus: 'OPEN',
      toStatus: status,
      userId: user.id,
      comment: note,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // 3. Audit Log
    const meta = extractRequestMeta(req);
    await createAuditLog({
      action: 'CASE_STATUS_CHANGE',
      entityType: 'CASE',
      entityId: caseId,
      userId: user.id,
      details: { newStatus: status, note },
      hierarchyEntityId: user.hierarchyEntityId || '',
      hierarchyEntityType: 'HIERARCHY_ENTITY',
      ...meta,
    });

    return NextResponse.json({ success: true, newStatus: result.newStatus });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
