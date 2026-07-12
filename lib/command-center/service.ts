import { prisma } from '@/lib/prisma';

export type ServiceStatus = {
  status: 'online' | 'warning' | 'offline';
  latency?: number;
};

export async function getDatabaseStatus(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'online', latency: Date.now() - start };
  } catch {
    return { status: 'offline' };
  }
}

export async function getSystemStats(dbOnline: boolean) {
  if (!dbOnline) {
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalCases: 0,
      activeCases: 0,
      totalAlerts: 0,
      criticalAlerts: 0,
      pendingCases: 0,
      activeOperations: 0,
      totalWanted: 0,
      totalEvidence: 0,
      totalArchive: 0,
    };
  }

  const [users, cases, wanted, evidence] = await Promise.all([
    prisma.officer.count(),
    prisma.report.count(),
    prisma.wantedPerson.count(),
    prisma.dataRecord.count(),
  ]);

  return {
    totalUsers: users,
    activeUsers: Math.min(users, Math.round(users * 0.3)),
    totalCases: cases,
    activeCases: Math.round(cases * 0.35),
    totalAlerts: Math.round(cases * 0.4),
    criticalAlerts: Math.round(cases * 0.08),
    pendingCases: Math.round(cases * 0.25),
    activeOperations: Math.min(12, Math.max(0, Math.round((users + cases + wanted) / 50))),
    totalWanted: wanted,
    totalEvidence: evidence,
    totalArchive: Math.round((cases + wanted) * 0.4),
  };
}

export async function getSystemLoad(apiLatency: number) {
  return {
    cpu: Math.min(90, 20 + Math.round(apiLatency / 4)),
    memory: Math.min(90, 30 + Math.round(apiLatency / 6)),
    network: Math.min(100, 10 + Math.round(apiLatency / 8)),
    apiLatency,
  };
}
