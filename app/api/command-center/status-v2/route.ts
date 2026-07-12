import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDatabaseStatus, getSystemStats, getSystemLoad } from '@/lib/command-center/service';

export async function GET(request: NextRequest) {
  const currentUser = await getAuthenticatedUser(request);
  const database = await getDatabaseStatus();
  const dbOnline = database.status === 'online';

  const stats = await getSystemStats(dbOnline);
  const systemLoad = await getSystemLoad(database.latency ?? 50);

  const now = new Date();
  const session = currentUser
    ? await prisma.authSession.findFirst({
        where: {
          officerId: currentUser.id,
          isValid: true,
          expiresAt: { gt: new Date() },
        },
        orderBy: { lastActive: 'desc' },
        select: {
          createdAt: true,
        },
      })
    : null;

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    user: {
      currentUser: currentUser?.fullName || currentUser?.username || 'غير متاح',
      role: currentUser?.role || 'غير متاح',
      clearance: currentUser ? 'SESSION_BASED' : 'NONE',
      sessionTimer: session ? `${Math.floor((now.getTime() - session.createdAt.getTime()) / 1000)}s` : '00:00:00',
      currentTime: now.toLocaleTimeString('ar-SA'),
      currentDate: now.toLocaleDateString('ar-SA'),
      connectedDatabase: dbOnline ? 'PostgreSQL' : 'غير متاح',
    },
    services: {
      database,
      authentication: { status: currentUser ? 'online' : 'offline' },
      rbac: { status: dbOnline ? 'online' : 'offline' },
      audit: { status: dbOnline ? 'online' : 'offline' },
      workflow: { status: dbOnline ? 'online' : 'offline' },
      archive: { status: dbOnline ? 'online' : 'offline' },
      notifications: { status: dbOnline ? 'online' : 'offline' },
      api: { status: 'online' },
      redis: { status: 'offline' },
    },
    stats,
    systemLoad,
    health: {
      database,
      systemHealth: database,
    }
  });
}
