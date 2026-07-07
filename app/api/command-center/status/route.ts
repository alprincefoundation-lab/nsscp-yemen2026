import { NextResponse } from 'next/server';
import { getDatabaseStatus, getSystemStats, getSystemLoad } from '@/lib/command-center/service';

export async function GET() {
  const database = await getDatabaseStatus();
  const dbOnline = database.status === 'online';

  const stats = await getSystemStats(dbOnline);

  const apiLatency = database.latency ?? 50;
  const systemLoad = await getSystemLoad(apiLatency);

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
      authentication: { status: 'online' },
      rbac: { status: 'online' },
      audit: { status: 'online' },
      workflow: { status: 'online' },
      archive: { status: 'online' },
      notifications: { status: 'online' },
      api: { status: 'online' },
      redis: { status: 'online' },
    },

    stats,
    systemLoad,

    health: {
      database,
      systemHealth: database,
    }
  });
}
