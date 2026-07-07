"use client";

import { STATUS_COLORS, PRIORITY_COLORS } from '../services/cases-api';

interface CaseStatusBadgeProps {
    status: string;
    size?: 'sm' | 'md' | 'lg';
}

export function CaseStatusBadge({ status, size = 'sm' }: CaseStatusBadgeProps) {
    const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-1 text-xs';

    const statusLabels: Record<string, string> = {
        OPEN: 'مفتوحة',
        UNDER_REVIEW: 'قيد المراجعة',
        UNDER_INVESTIGATION: 'قيد التحقيق',
        REFERRED: 'محالة',
        ON_HOLD: 'معلقة',
        COMPLETED: 'مكتملة',
        CLOSED: 'مغلقة',
        ARCHIVED: 'مؤرشفة',
    };

    return (
        <span className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${colorClass}`}>
            {statusLabels[status] || status}
        </span>
    );
}

interface CasePriorityBadgeProps {
    priority: string;
    size?: 'sm' | 'md' | 'lg';
}

export function CasePriorityBadge({ priority, size = 'sm' }: CasePriorityBadgeProps) {
    const colorClass = PRIORITY_COLORS[priority] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-1 text-xs';

    const priorityLabels: Record<string, string> = {
        LOW: 'منخفضة',
        NORMAL: 'عادية',
        HIGH: 'عالية',
        URGENT: 'عاجلة',
        CRITICAL: 'حرجة',
    };

    return (
        <span className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${colorClass}`}>
            {priorityLabels[priority] || priority}
        </span>
    );
}