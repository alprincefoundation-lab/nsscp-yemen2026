import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const canViewAllSessions = ['SUPER_ADMIN', 'MINISTRY_ADMIN', 'GOVERNORATE_ADMIN'].includes(user.role);

    const sessions = await prisma.authSession.findMany({
      where: {
        isValid: true,
        expiresAt: { gt: new Date() },
        ...(canViewAllSessions ? {} : { officerId: user.id }),
      },
      orderBy: { lastActive: 'desc' },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            role: true,
            rank: true,
            department: true,
          },
        },
      },
      take: 100,
    });

    return NextResponse.json({
      total: sessions.length,
      records: sessions.map((session) => ({
        id: session.id,
        userId: session.officerId,
        username: session.username,
        role: session.role,
        department: session.officer.department || session.hierarchyEntityName || null,
        rank: session.officer.rank || null,
        hierarchyEntityId: session.hierarchyEntityId || null,
        hierarchyEntityName: session.hierarchyEntityName || null,
        hierarchyEntityType: session.hierarchyEntityType || null,
        lastActive: session.lastActive.toISOString(),
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        ipAddress: session.ip,
        userAgent: session.userAgent,
      })),
    });
  } catch (error) {
    console.error('Auth Sessions Error:', error);
    return NextResponse.json({ error: 'حدث خطأ داخلي' }, { status: 500 });
  }
}
