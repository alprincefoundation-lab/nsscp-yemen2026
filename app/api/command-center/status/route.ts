import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDatabaseStatus, getSystemStats, getSystemLoad } from '@/lib/command-center/service';

export async function GET(request: NextRequest) {
  const currentUser = await getAuthenticatedUser(request);
  const database = await getDatabaseStatus();
  const dbOnline = database.status === 'online';

  const stats = await getSystemStats(dbOnline);

  const apiLatency = database.latency ?? 50;
  const systemLoad = await getSystemLoad(apiLatency);

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
    timestamp: new Date().toISOString(),

    system: {
      version: '3.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime().toFixed(0) + 's',
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
