import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const isDev = process.env.NODE_ENV === 'development'

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: isDev
      ? [
          { emit: 'stdout', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ]
      : [{ emit: 'stdout', level: 'error' }],
  })

if (isDev) {
  globalForPrisma.prisma = prisma
}
