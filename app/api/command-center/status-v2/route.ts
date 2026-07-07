import { NextResponse } from 'next/server';
import { getDatabaseStatus, getSystemStats, getSystemLoad } from '@/lib/command-center/service';

let cache: any = null;
let last = 0;
const TTL = 2000; // 2 seconds cache

export async function GET() {
  if (cache && Date.now() - last < TTL) {
    return NextResponse.json(cache);
  }

  const database = await getDatabaseStatus();
  const dbOnline = database.status === 'online';

  const stats = await getSystemStats(dbOnline);
  const systemLoad = await getSystemLoad(database.latency ?? 50);

  const now = new Date();

  cache = {
    success: true,
    timestamp: now.toISOString(),
    user: {
      currentUser: 'قائد المركز',
      role: 'مدير العمليات',
      clearance: 'TOP SECRET',
      sessionTimer: '03:40:00',
      currentTime: now.toLocaleTimeString('ar-SA'),
      currentDate: now.toLocaleDateString('ar-SA'),
      connectedDatabase: 'PostgreSQL 16',
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
  };

  last = Date.now();
  return NextResponse.json(cache);
}
