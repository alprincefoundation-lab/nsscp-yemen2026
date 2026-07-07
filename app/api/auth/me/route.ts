import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile with resolved hierarchy context.
 * Uses centralized getAuthenticatedUser() from lib/auth for JWT verification.
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 });
        }

        // Resolve hierarchy context from department
        let hierarchyNodeName: string | null = user.department?.nameAr || null;
        let hierarchyNodeType: string | null = 'DEPARTMENT';

        return NextResponse.json({
            user: {
                id: user.id,
                username: user.email,
                role: user.roles[0]?.name || 'USER',
                fullName: user.fullName,
                hierarchyEntityId: user.departmentId || null,
                hierarchyNodeName,
                hierarchyNodeType,
                badgeNumber: user.militaryId || null,
                rank: user.rank || null,
                userType: user.roles[0]?.name || 'USER',
            }
        });
    } catch (error) {
        console.error('Auth Me Error:', error);
        return NextResponse.json({ error: 'حدث خطأ داخلي' }, { status: 500 });
    }
}

// HierarchyEntity is not present in the current schema, using Department instead.
async function findAncestorDepartment(
    departmentId: string,
): Promise<{ id: string; name: string } | null> {
    const current = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true, nameAr: true, parentDepartmentId: true },
    });
    if (current) return { id: current.id, name: current.nameAr };
    return null;
}