/**
 * Department Metrics Service — NSSCP Production
 *
 * Provides REAL-TIME metrics for every department/sector from PostgreSQL.
 * Replaces all hardcoded activeOperations: 12, staffOnDuty: 48 stubs.
 */
import { prisma } from '@/lib/prisma'

export interface DepartmentMetrics {
  activeOperations: number
  staffOnDuty: number
  threatLevel: string
}

const SECTOR_DEPARTMENT_MAP: Record<string, string> = {
  airportsecurity: 'أمن المطارات والمنافذ',
  bulletins: 'مركز التعميمات',
  gateway: 'البوابة الرئيسية',
  criminalinvestigation: 'البحث الجنائي',
  civilregistry: 'السجل المدني',
  forensic: 'الأدلة الجنائية',
  civildefense: 'الدفاع المدني',
  privatesector: 'الأمن الخاص',
  prisons: 'إدارة السجون',
  policestations: 'مراكز الشرطة',
  narcotics: 'مكافحة المخدرات',
  passports: 'الجوازات والهجرة',
  users: 'شؤون الأفراد',
  traffic: 'إدارة المرور',
  systems: 'نظم المعلومات',
  evidence: 'إدارة الأدلة والمحجوزات',
}

function resolveThreatLevel(activeOps: number): string {
  if (activeOps > 20) return 'high'
  if (activeOps > 10) return 'medium'
  return 'low'
}

export async function getDepartmentMetrics(
  sector: string
): Promise<DepartmentMetrics> {
  const departmentName = SECTOR_DEPARTMENT_MAP[sector] || sector

  const [activeOperations, staffOnDuty] = await Promise.all([
    prisma.operation.count({
      where: {
        departmentId: { contains: sector, mode: 'insensitive' },
        status: { in: ['ACTIVE', 'IN_PROGRESS', 'PLANNED'] },
      },
    }),
    prisma.officer.count({
      where: {
        department: { contains: departmentName, mode: 'insensitive' },
      },
    }),
  ])

  return {
    activeOperations,
    staffOnDuty,
    threatLevel: resolveThreatLevel(activeOperations),
  }
}
