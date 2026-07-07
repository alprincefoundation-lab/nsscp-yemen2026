import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { HierarchyEngine } from '@/lib/hierarchy';

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 });
    }
    const engine = new HierarchyEngine({ id: authUser.id, role: authUser.role, hierarchyNodeId: authUser.hierarchyEntityId });
    const scope = await engine.getScope();
    const dashboard = await engine.getDashboardScope();
    return NextResponse.json({ success: true, data: { scope, dashboard } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
