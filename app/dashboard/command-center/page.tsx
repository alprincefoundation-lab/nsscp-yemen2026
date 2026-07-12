'use client'

import { useCallback, useMemo, useState } from 'react'
import { Activity, Bell, Clock3, FileText, LayoutDashboard, ListChecks, Map, RefreshCw, Users } from 'lucide-react'
import ActiveUsersPanel from './components/ActiveUsersPanel'
import AlertsFeed from './components/AlertsFeed'
import AuditStream from './components/AuditStream'
import HierarchyNavigator from './components/HierarchyNavigator'
import LiveMapPanel from './components/LiveMapPanel'
import QuickActionsPanel from './components/QuickActionsPanel'
import StatsOverview from './components/StatsOverview'
import { useActiveUsers } from './hooks/useActiveUsers'
import { useAuditStream } from './hooks/useAuditStream'
import { useHierarchyTree } from './hooks/useHierarchyTree'
import { useLiveAlerts } from './hooks/useLiveAlerts'
import { useStatsOverview } from './hooks/useStatsOverview'
import type { QuickAction } from './services/command-center-api'

const SECTIONS = [
  { key: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { key: 'map', label: 'الخريطة الحية', icon: Map },
  { key: 'alerts', label: 'التنبيهات', icon: Bell },
  { key: 'hierarchy', label: 'التدرج الهرمي', icon: ListChecks },
  { key: 'users', label: 'المستخدمون النشطون', icon: Users },
  { key: 'audit', label: 'سجل التدقيق', icon: FileText },
  { key: 'actions', label: 'إجراءات سريعة', icon: Activity },
] as const

type SectionKey = (typeof SECTIONS)[number]['key']

export default function CommandCenterPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>('overview')

  const { alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useLiveAlerts()
  const { users, isLoading: usersLoading, refetch: refetchUsers } = useActiveUsers()
  const { tree, isLoading: hierarchyLoading, refetch: refetchHierarchy } = useHierarchyTree()
  const { entries, isLoading: auditLoading, refetch: refetchAudit } = useAuditStream()
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useStatsOverview()

  const notificationCount = useMemo(
    () => alerts.filter((alert) => alert.severity === 'CRITICAL' && !alert.acknowledged).length,
    [alerts],
  )

  const systemStatus = useMemo(() => {
    const criticalCount = alerts.filter((alert) => alert.severity === 'CRITICAL').length
    if (criticalCount > 2) return 'ALERT' as const
    if (criticalCount > 0) return 'STANDBY' as const
    return 'ACTIVE' as const
  }, [alerts])

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.allSettled([
      refetchAlerts(),
      refetchUsers(),
      refetchHierarchy(),
      refetchAudit(),
      refetchStats(),
    ])
    setIsRefreshing(false)
  }, [refetchAlerts, refetchUsers, refetchHierarchy, refetchAudit, refetchStats])

  const handleActionClick = useCallback((action: QuickAction) => {
    if (action.route) {
      window.location.href = action.route
    }
  }, [])

  const lastUpdatedLabel = stats.lastUpdated
    ? new Date(stats.lastUpdated).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    : '--:--'

  const statusLabel = systemStatus === 'ACTIVE' ? 'نشط' : systemStatus === 'STANDBY' ? 'استعداد' : 'إنذار'

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="rounded-[2rem] border border-cyan-400/20 bg-[#071116] p-5 shadow-[0_0_40px_rgba(2,132,199,0.12)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">NSSCP COMMAND CENTER</p>
            <h1 className="text-2xl font-bold text-white md:text-3xl">مركز القيادة والسيطرة</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-400">
              مراقبة حية للعمليات والتنبيهات والمستخدمين النشطين مع عرضٍ موحد داخل
              لوحة التحكم الرئيسية.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                {statusLabel}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-slate-200">
                تنبيهات حرجة {notificationCount}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-slate-200">
                آخر تحديث {lastUpdatedLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              تحديث
            </button>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-200">
              <Clock3 className="h-4 w-4 text-cyan-300" />
              النطاق: الجمهورية اليمنية
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon
            const active = activeSection === section.key

            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-cyan-400/30 bg-cyan-400/15 text-cyan-100'
                    : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            )
          })}
        </div>
      </section>

      {activeSection === 'overview' && (
        <div className="space-y-6">
          <StatsOverview stats={stats} isLoading={statsLoading} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AlertsFeed alerts={alerts} isLoading={alertsLoading} />
            <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/70 p-5 shadow-[0_0_24px_rgba(15,23,42,0.22)]">
              <QuickActionsPanel onActionClick={handleActionClick} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ActiveUsersPanel users={users} isLoading={usersLoading} />
            <HierarchyNavigator nodes={tree} isLoading={hierarchyLoading} />
          </div>

          <AuditStream entries={entries} isLoading={auditLoading} />
        </div>
      )}

      {activeSection === 'map' && <LiveMapPanel isLoading={false} />}

      {activeSection === 'alerts' && <AlertsFeed alerts={alerts} isLoading={alertsLoading} />}

      {activeSection === 'hierarchy' && <HierarchyNavigator nodes={tree} isLoading={hierarchyLoading} />}

      {activeSection === 'users' && <ActiveUsersPanel users={users} isLoading={usersLoading} />}

      {activeSection === 'audit' && <AuditStream entries={entries} isLoading={auditLoading} />}

      {activeSection === 'actions' && (
        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/70 p-5 shadow-[0_0_24px_rgba(15,23,42,0.22)]">
          <QuickActionsPanel onActionClick={handleActionClick} />
        </div>
      )}
    </div>
  )
}
