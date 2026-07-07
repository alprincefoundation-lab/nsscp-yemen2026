"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import TopBar from './components/TopBar';
import SideNavigation from './components/SideNavigation';
import LiveMapPanel from './components/LiveMapPanel';
import AlertsFeed from './components/AlertsFeed';
import HierarchyNavigator from './components/HierarchyNavigator';
import ActiveUsersPanel from './components/ActiveUsersPanel';
import AuditStream from './components/AuditStream';
import QuickActionsPanel from './components/QuickActionsPanel';
import StatsOverview from './components/StatsOverview';
import { useLiveAlerts } from './hooks/useLiveAlerts';
import { useActiveUsers } from './hooks/useActiveUsers';
import { useHierarchyTree } from './hooks/useHierarchyTree';
import { useAuditStream } from './hooks/useAuditStream';
import { useStatsOverview } from './hooks/useStatsOverview';
import type { QuickAction } from './services/command-center-api';

export default function CommandCenterPage() {
    const [activeSection, setActiveSection] = useState<string>('overview');

    // Data hooks with live polling
    const { alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useLiveAlerts();
    const { users, isLoading: usersLoading, refetch: refetchUsers } = useActiveUsers();
    const { tree, isLoading: hierarchyLoading, refetch: refetchHierarchy } = useHierarchyTree();
    const { entries, isLoading: auditLoading, refetch: refetchAudit } = useAuditStream();
    const { stats, isLoading: statsLoading, refetch: refetchStats } = useStatsOverview();

    // Notification count derived from unacknowledged critical alerts
    const notificationCount = useMemo(() => {
        return alerts.filter(a => a.severity === 'CRITICAL' && !a.acknowledged).length;
    }, [alerts]);

    // Global refresh handler
    const [isRefreshing, setIsRefreshing] = useState(false);
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await Promise.allSettled([
            refetchAlerts(),
            refetchUsers(),
            refetchHierarchy(),
            refetchAudit(),
            refetchStats(),
        ]);
        setIsRefreshing(false);
    }, [refetchAlerts, refetchUsers, refetchHierarchy, refetchAudit, refetchStats]);

    // Quick action click handler - routes to the appropriate dashboard page
    const handleActionClick = useCallback((action: QuickAction) => {
        if (action.route) {
            window.location.href = action.route;
        }
    }, []);

    // System status derived from alerts
    const systemStatus = useMemo(() => {
        const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
        if (criticalCount > 2) return 'ALERT' as const;
        if (criticalCount > 0) return 'STANDBY' as const;
        return 'ACTIVE' as const;
    }, [alerts]);

    return (
        <div className="min-h-screen bg-[#050b0e] flex flex-col">
            {/* Top Navigation Bar */}
            <TopBar
                lastUpdated={stats.lastUpdated}
                systemStatus={systemStatus}
                userName="قائد المركز"
                userRole="مدير العمليات"
                notificationCount={notificationCount}
                hierarchyScope="الجمهورية اليمنية"
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
            />

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Side Navigation */}
                <SideNavigation
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                />

                {/* Content Panels */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {activeSection === 'overview' && (
                        <div className="space-y-6">
                            {/* Live counters */}
                            <StatsOverview stats={stats} isLoading={statsLoading} />

                            {/* Two-column layout: Alerts + Quick Actions */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <AlertsFeed alerts={alerts} isLoading={alertsLoading} />
                                <QuickActionsPanel onActionClick={handleActionClick} />
                            </div>

                            {/* Two-column layout: Active Users + Hierarchy */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ActiveUsersPanel users={users} isLoading={usersLoading} />
                                <HierarchyNavigator nodes={tree} isLoading={hierarchyLoading} />
                            </div>

                            {/* Full-width: Audit Stream */}
                            <AuditStream entries={entries} isLoading={auditLoading} />
                        </div>
                    )}

                    {activeSection === 'map' && (
                        <LiveMapPanel isLoading={false} />
                    )}

                    {activeSection === 'alerts' && (
                        <div className="space-y-4">
                            <AlertsFeed alerts={alerts} isLoading={alertsLoading} />
                        </div>
                    )}

                    {activeSection === 'hierarchy' && (
                        <div className="space-y-4">
                            <HierarchyNavigator nodes={tree} isLoading={hierarchyLoading} />
                        </div>
                    )}

                    {activeSection === 'users' && (
                        <div className="space-y-4">
                            <ActiveUsersPanel users={users} isLoading={usersLoading} />
                        </div>
                    )}

                    {activeSection === 'audit' && (
                        <div className="space-y-4">
                            <AuditStream entries={entries} isLoading={auditLoading} />
                        </div>
                    )}

                    {activeSection === 'actions' && (
                        <div className="space-y-4">
                            <QuickActionsPanel onActionClick={handleActionClick} />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}