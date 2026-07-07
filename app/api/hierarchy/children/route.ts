import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { HierarchyEngine } from '@/lib/hierarchy';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    if (!entityId) {
      return NextResponse.json({ error: 'entityId parameter is required' }, { status: 400 });
    }
    const engine = new HierarchyEngine({ 
      id: authUser.id, 
      role: authUser.roles[0]?.name || 'USER', 
      departmentId: authUser.departmentId 
    });
    const canAccess = await engine.canAccessHierarchy(entityId);
    if (!canAccess) {
      return NextResponse.json({ error: 'غير مصرح بالوصول لهذا الكيان' }, { status: 403 });
    }
    const children = await prisma.department.findMany({
      where: { parentDepartmentId: entityId },
      select: { id: true, nameAr: true, code: true, parentDepartmentId: true },
      orderBy: { nameAr: 'asc' },
    });
    return NextResponse.json({ success: true, data: children });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
