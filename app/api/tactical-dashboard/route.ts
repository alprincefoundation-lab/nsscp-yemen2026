/**
 * Tactical Dashboard API - Aggregates data for the tactical operations center
 *
 * GET /api/tactical-dashboard
 *
 * Returns: metrics, emergency calls, map markers, departments, provinces, org chart
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiGuard } from '@/lib/hierarchy/guard'
import { auditSensitiveAction } from '@/lib/logging/audit'

type TacticalReport = {
  id: string
  title: string
  description: string
  department: string
  status: string
  priority: string
  createdAt: Date
}

type TacticalNotification = {
  id: number
  alertType: string
  detectProvince: string
  detectFacility: string
  targetProvince: string
  isResolved: boolean
  alertTime: Date
}

type TacticalDepartmentRow = {
  id: string
  name: string
  code: string
  Level5Section: Array<{ id: string }>
}

type TacticalProvinceRow = {
  id: string
  name: string
  code: string
  Level3Unit: Array<{ id: string }>
}

type TacticalOrgLeaf = {
  id: string
  name: string
  code: string
}

type TacticalOrgSection = {
  id: string
  name: string
  code: string
  Level6Unit: TacticalOrgLeaf[]
}

type TacticalOrgDepartment = {
  id: string
  name: string
  code: string
  Level5Section: TacticalOrgSection[]
}

type TacticalOrgUnit = {
  id: string
  name: string
  code: string
  Level4Department: TacticalOrgDepartment[]
}

type TacticalOrgProvince = {
  id: string
  name: string
  code: string
  Level3Unit: TacticalOrgUnit[]
}

type TacticalOrgRoot = {
  id: string
  name: string
  code: string
  Province: TacticalOrgProvince[]
}

export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuard(request)
    if ('error' in guard) return guard.error
    const { user } = guard

    const [reports, departments, provinces, centralCommand, notifications, totalOfficers] = await Promise.all([
      prisma.report.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          department: true,
          status: true,
          priority: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.level4Department.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          Level5Section: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.province.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          Level3Unit: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.centralCommand.findFirst({
        include: {
          Province: {
            include: {
              Level3Unit: {
                include: {
                  Level4Department: {
                    include: {
                      Level5Section: {
                        include: {
                          Level6Unit: {
                            select: {
                              id: true,
                              name: true,
                              code: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.systemNotification.findMany({
        take: 10,
        orderBy: { alertTime: 'desc' },
        select: {
          id: true,
          alertType: true,
          detectProvince: true,
          detectFacility: true,
          targetProvince: true,
          isResolved: true,
          alertTime: true,
        },
      }),
      prisma.officer.count(),
    ])

    const totalCases = reports.length
    const activeCases = reports.filter((report) => report.status === 'active').length
    const closedCases = reports.filter((report) => report.status === 'closed').length
    const activeOperations = activeCases
    const activePatrols = Math.max(0, totalOfficers - activeOperations)
    const totalDepartments = departments.length

    const securityCases = reports.filter((report) => report.priority === 'HIGH').length
    const trafficCases = reports.filter((report) => report.priority === 'MEDIUM').length
    const healthCases = reports.filter((report) => report.priority === 'LOW').length
    const totalTypedCases = securityCases + trafficCases + healthCases || 1

    const averageResponseTime =
      notifications.length > 0
        ? notifications.reduce((acc: number, item: TacticalNotification) => acc + calculateResponseSeconds(item), 0) /
          notifications.length
        : 0

    const formattedDepartments = departments.map((department: TacticalDepartmentRow) => {
      const relatedReports = reports.filter(
        (report) => report.department === department.name || report.department === department.code,
      ).length
      const staff = department.Level5Section.length

      return {
        id: department.id,
        name: department.name,
        description: department.code,
        icon: getIconForDepartment(department.name),
        status: 'active' as const,
        staff,
        reports: relatedReports,
        efficiency: staff > 0 ? Math.min(100, Math.round((relatedReports / staff) * 100)) : 0,
      }
    })

    const onDutyPerProvince = provinces.length > 0 ? Math.max(1, Math.round(totalOfficers / provinces.length)) : totalOfficers

    const formattedProvinces = provinces.map((province: TacticalProvinceRow) => ({
      id: province.id,
      nameAr: province.name,
      nameEn: province.code,
      activeReports: province.Level3Unit.length,
      onDutyOfficers: onDutyPerProvince,
      responseTime: 'غير متوفر',
      status: (province.Level3Unit.length > 8 ? 'warning' : province.Level3Unit.length > 16 ? 'critical' : 'active') as
        | 'active'
        | 'warning'
        | 'critical',
    }))

    const formattedOrgChart = centralCommand ? formatOrgChart(centralCommand as unknown as TacticalOrgRoot) : null

    await auditSensitiveAction(request, user, 'READ', 'TACTICAL_DASHBOARD', 'GLOBAL', {
      details: {
        metrics: {
          totalCases,
          activeCases,
          activeOperations,
          activePatrols,
          totalOfficers,
          totalDepartments,
        },
      },
      hierarchyEntityId: null,
    })

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          activeReports: activeCases,
          averageResponseMinutes: Math.floor(averageResponseTime / 60),
          averageResponseSeconds: Math.round(averageResponseTime % 60),
          completionRate: totalCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0,
          availablePatrols: activePatrols,
          activeOperations,
          totalOfficers,
          totalDepartments,
          reportDistribution: {
            security: Math.round((securityCases / totalTypedCases) * 100),
            traffic: Math.round((trafficCases / totalTypedCases) * 100),
            health: Math.round((healthCases / totalTypedCases) * 100),
          },
          activeOperationsList: getActiveOperations(reports),
        },
        emergencyCalls: notifications.map((notification) => ({
          id: String(notification.id),
          phone: '',
          name: notification.detectFacility || notification.targetProvince || 'بلاغ طارئ',
          language: 'العربية',
          type: notification.alertType,
          description: notification.detectProvince || notification.targetProvince || notification.alertType,
          location: notification.detectProvince || notification.targetProvince || notification.detectFacility || '',
          status: notification.isResolved ? 'مُنهى' : 'قيد المعالجة',
          time: getRelativeTime(notification.alertTime),
          priority: notification.isResolved ? 'منخفضة' : 'عالية',
        })),
        mapMarkers: buildMapMarkers(reports, notifications),
        departments: formattedDepartments,
        provinces: formattedProvinces,
        orgChart: formattedOrgChart,
      },
    })
  } catch (error) {
    console.error('Tactical Dashboard API Error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب بيانات اللوحة التكتيكية' }, { status: 500 })
  }
}

function getActiveOperations(reports: TacticalReport[]) {
  return reports.slice(0, 5).map((report) => ({
    id: report.id,
    type: report.priority,
    description: report.description || report.title,
    status: report.status === 'closed' ? 'مُنهى' : 'قيد المعالجة',
    time: getRelativeTime(report.createdAt),
    location: report.department,
  }))
}

function buildMapMarkers(reports: TacticalReport[], notifications: TacticalNotification[]) {
  const YEMEN_CENTER_LAT = 15.3694
  const YEMEN_CENTER_LNG = 44.191
  const markers: Array<{ id: string; lat: number; lng: number; type: 'report' | 'ambulance' | 'fire' | 'police'; name: string; distance: string }> = []

  notifications.forEach((notification) => {
    const hash = hashString(String(notification.id))
    const latOffset = (((hash % 200) - 100) / 100) * 2
    const lngOffset = ((((hash >> 1) % 200) - 100) / 100) * 2

    markers.push({
      id: String(notification.id),
      lat: YEMEN_CENTER_LAT + latOffset,
      lng: YEMEN_CENTER_LNG + lngOffset,
      type: 'report',
      name: notification.detectFacility || notification.targetProvince || 'موقع البلاغ',
      distance: `${(Math.abs(hash % 500) / 100).toFixed(1)} كم`,
    })
  })

  reports.slice(0, 10).forEach((report) => {
    const hash = hashString(report.id)
    const latOffset = (((hash % 150) - 75) / 100) * 1.5
    const lngOffset = ((((hash >> 1) % 150) - 75) / 100) * 1.5

    markers.push({
      id: report.id,
      lat: YEMEN_CENTER_LAT + latOffset,
      lng: YEMEN_CENTER_LNG + lngOffset,
      type: report.priority === 'HIGH' ? 'police' : 'report',
      name: report.title,
      distance: `${(Math.abs(hash % 500) / 100).toFixed(1)} كم`,
    })
  })

  return markers
}

function formatOrgChart(root: TacticalOrgRoot) {
  return {
    id: root.id,
    name: root.name,
    title: 'القيادة المركزية',
    level: 0,
    link: '/dashboard',
    children: root.Province.map((province) => ({
      id: province.id,
      name: province.name,
      title: 'محافظة',
      level: 1,
      link: '/dashboard/departments',
      children: province.Level3Unit.map((unit) => ({
        id: unit.id,
        name: unit.name,
        title: 'إدارة',
        level: 2,
        link: '/dashboard/departments',
        children: unit.Level4Department.map((department) => ({
          id: department.id,
          name: department.name,
          title: 'قسم',
          level: 3,
          link: '/dashboard/departments',
          children: department.Level5Section.map((section) => ({
            id: section.id,
            name: section.name,
            title: 'وحدة',
            level: 4,
            link: '/dashboard/departments',
            children: section.Level6Unit.map((unitLevel) => ({
              id: unitLevel.id,
              name: unitLevel.name,
              title: 'وحدة فرعية',
              level: 5,
              link: '/dashboard/departments',
            })),
          })),
        })),
      })),
    })),
  }
}

function getIconForDepartment(name: string): string {
  const iconMap: Record<string, string> = {
    'نظم المعلومات': '💻',
    'الأمن السيبراني': '🔒',
    'الموارد البشرية': '👥',
    'المالية': '💰',
    'العمليات': '🚨',
    'المرور': '🚦',
    'العلاقات العامة': '📢',
    'القانون': '⚖️',
    'الشؤون الإدارية': '📋',
    'المراقبة': '🔍',
    'البحث': '🔬',
    'التدريب': '📚',
    'الاتصالات': '📡',
    'الطوارئ': '🚑',
    'الصيانة': '🔧',
    'المخزون': '📦',
    'المشاريع': '🎯',
    'المراكز الإقليمية': '🗺️',
    'الشراكات': '🤝',
    'الجودة': '⭐',
    'التحليل': '📊',
    'الرقابة المرورية': '📹',
    'الخدمات الاجتماعية': '❤️',
    'البيئة': '🛡️',
    'التطوير': '🌱',
  }

  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) return icon
  }

  return '📋'
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'الآن'
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`
  if (diffHours < 24) return `منذ ${diffHours} ساعة`
  return `منذ ${diffDays} يوم`
}

function calculateResponseSeconds(notification: TacticalNotification): number {
  return Math.max(0, Math.floor((Date.now() - notification.alertTime.getTime()) / 1000))
}

function hashString(str: string): number {
  let hash = 0

  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash &= hash
  }

  return Math.abs(hash)
}
