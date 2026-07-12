"use client";

import { BarChart3, AlertTriangle, Users, Activity, Clock, Building2, Globe, Loader2 } from 'lucide-react';

interface StatsData {
    totalAlerts: number;
    criticalAlerts: number;
    activeUsers: number;
    activeSessions: number;
    systemUptime: string;
    lastUpdated: string;
    departmentCount: number;
    governorateCount: number;
}

interface StatsOverviewProps {
    stats?: StatsData;
    isLoading?: boolean;
}

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    accent?: string;
}

function StatCard({ label, value, icon: Icon, accent = 'text-[#39ff14]' }: StatCardProps) {
    return (
        <div className="bg-[#0f1922] border border-[#1a3a2a] rounded-sm p-4 flex items-center gap-4 hover:border-[#39ff14]/20 transition-colors">
            <div className={`p-2.5 rounded bg-[#1a3a2a]/30 ${accent}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">{label}</span>
                <span className="text-lg font-bold text-white font-mono">{value}</span>
            </div>
        </div>
    );
}

export default function StatsOverview({ stats, isLoading = false }: StatsOverviewProps) {
    if (isLoading) {
        return (
            <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm p-6 flex flex-col items-center justify-center min-h-[150px]">
                <Loader2 className="w-6 h-6 text-[#39ff14] animate-spin mb-2" />
                <span className="text-xs text-gray-500 font-mono">تحميل الإحصائيات...</span>
            </div>
        );
    }

    const defaultStats: StatsData = {
        totalAlerts: 0,
        criticalAlerts: 0,
        activeUsers: 0,
        activeSessions: 0,
        systemUptime: 'غير متاح',
        lastUpdated: new Date().toISOString(),
        departmentCount: 0,
        governorateCount: 0,
    };

    const data = stats || defaultStats;

    return (
        <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm tactical-card">
            <div className="p-4 border-b border-[#1a3a2a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#39ff14]" />
                    <h3 className="text-xs font-bold text-white font-mono tracking-wider">نظرة عامة / STATS OVERVIEW</h3>
                </div>
                <span className="text-[9px] text-gray-500 font-mono">
                    {new Date(data.lastUpdated).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <div className="p-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard
                        label="إجمالي التنبيهات"
                        value={data.totalAlerts}
                        icon={AlertTriangle}
                        accent="text-amber-500"
                    />
                    <StatCard
                        label="التنبيهات الحرجة"
                        value={data.criticalAlerts}
                        icon={AlertTriangle}
                        accent="text-red-500"
                    />
                    <StatCard
                        label="المستخدمون النشطون"
                        value={data.activeUsers}
                        icon={Users}
                        accent="text-[#39ff14]"
                    />
                    <StatCard
                        label="الجلسات النشطة"
                        value={data.activeSessions}
                        icon={Activity}
                        accent="text-cyan-500"
                    />
                    <StatCard
                        label="وقت التشغيل"
                        value={data.systemUptime}
                        icon={Clock}
                        accent="text-blue-500"
                    />
                    <StatCard
                        label="الإدارات"
                        value={data.departmentCount}
                        icon={Building2}
                        accent="text-purple-500"
                    />
                    <StatCard
                        label="المحافظات"
                        value={data.governorateCount}
                        icon={Globe}
                        accent="text-emerald-500"
                    />
                    <StatCard
                        label="حالة النظام"
                        value={data.totalAlerts > 0 ? 'إنذار' : 'مستقر'}
                        icon={BarChart3}
                        accent={data.totalAlerts > 0 ? 'text-red-500' : 'text-[#39ff14]'}
                    />
                </div>
            </div>

            <div className="p-3 border-t border-[#1a3a2a] text-[9px] text-gray-600 font-mono text-center">
                <span>SYSTEM STATISTICS // LIVE AGGREGATION</span>
            </div>
        </div>
    );
}
