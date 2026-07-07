import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { HierarchyEngine } from '@/lib/hierarchy';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const rootId = searchParams.get('rootId');
    const engine = new HierarchyEngine({ id: authUser.id, role: authUser.role, hierarchyNodeId: authUser.hierarchyEntityId });
    const tree = await engine.getTree(rootId || undefined);
    return NextResponse.json({ success: true, data: tree });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
