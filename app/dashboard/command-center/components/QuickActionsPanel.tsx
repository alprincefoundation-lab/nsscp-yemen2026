"use client";

import { Activity, UserPlus, Building2, FileBarChart, Briefcase, Archive, Loader2 } from 'lucide-react';

interface QuickActionItem {
    id: string;
    label: string;
    icon: string;
    route: string;
    enabled: boolean;
}

interface QuickActionsPanelProps {
    actions?: QuickActionItem[];
    isLoading?: boolean;
    onActionClick?: (action: QuickActionItem) => void;
}

const iconMap: Record<string, React.ElementType> = {
    'user-plus': UserPlus,
    'building-2': Building2,
    'file-bar-chart': FileBarChart,
    'briefcase': Briefcase,
    'archive': Archive,
    activity: Activity,
};

// Default actions as specified in the requirements
const DEFAULT_ACTIONS: QuickActionItem[] = [
    { id: 'create-user', label: 'إنشاء مستخدم', icon: 'user-plus', route: '/dashboard/users', enabled: true },
    { id: 'create-hierarchy', label: 'إنشاء كيان هرمي', icon: 'building-2', route: '/dashboard/hierarchy', enabled: true },
    { id: 'generate-report', label: 'توليد تقرير', icon: 'file-bar-chart', route: '/dashboard/reports', enabled: true },
    { id: 'open-cases', label: 'فتح إدارة القضايا', icon: 'briefcase', route: '/dashboard/cases', enabled: true },
    { id: 'open-archive', label: 'فتح الأرشيف', icon: 'archive', route: '/dashboard/archive', enabled: true },
];

export default function QuickActionsPanel({ actions, isLoading = false, onActionClick }: QuickActionsPanelProps) {
    if (isLoading) {
        return (
            <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm p-6 flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="w-6 h-6 text-[#39ff14] animate-spin mb-2" />
                <span className="text-xs text-gray-500 font-mono">تحميل الإجراءات السريعة...</span>
            </div>
        );
    }

    // Use provided actions or fall back to defaults
    const displayActions = (actions && actions.length > 0)
        ? actions.filter((a) => a.enabled)
        : DEFAULT_ACTIONS;

    return (
        <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm tactical-card">
            <div className="p-4 border-b border-[#1a3a2a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#39ff14]" />
                    <h3 className="text-xs font-bold text-white font-mono tracking-wider">إجراءات سريعة / QUICK ACTIONS</h3>
                </div>
                <span className="text-[9px] text-gray-500 font-mono">{displayActions.length} متاح</span>
            </div>

            <div className="p-4">
                {displayActions.length === 0 ? (
                    <div className="text-center py-6">
                        <Activity className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                        <p className="text-xs text-gray-600">لا توجد إجراءات متاحة</p>
                        <p className="text-[10px] text-gray-700 font-mono">NO ACTIONS AVAILABLE</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {displayActions.map((action) => {
                            const Icon = iconMap[action.icon] || Activity;
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => onActionClick?.(action)}
                                    className="group relative bg-[#0f1922] border border-[#1a3a2a] hover:border-[#39ff14]/40 p-4 rounded-lg text-right transition-all hover:bg-[#39ff14]/[0.02] cursor-pointer"
                                >
                                    <div className="p-2 rounded bg-[#39ff14]/10 text-[#39ff14] w-fit mb-2 group-hover:shadow-[0_0_10px_rgba(57,255,20,0.2)] transition-shadow">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors block">
                                        {action.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-[#1a3a2a] text-[9px] text-gray-600 font-mono text-center">
                <span>DEPLOYABLE ACTIONS // COMMAND OVERRIDE</span>
            </div>
        </div>
    );
}