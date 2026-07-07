"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

interface TimelineEvent {
    id: string;
    action: string;
    actor: string;
    timestamp: string;
    details?: string;
    type: 'created' | 'updated' | 'assigned' | 'evidence' | 'status' | 'archive' | 'closed';
}

interface CaseTimelineProps {
    caseId: string;
    isLoading?: boolean;
}

const EVENT_ICONS: Record<string, string> = {
    created: '●',
    updated: '●',
    assigned: '→',
    evidence: '◆',
    status: '◉',
    archive: '▼',
    closed: '✕',
};

const EVENT_COLORS: Record<string, string> = {
    created: 'text-green-600 dark:text-green-400 border-green-500',
    updated: 'text-blue-600 dark:text-blue-400 border-blue-500',
    assigned: 'text-orange-600 dark:text-orange-400 border-orange-500',
    evidence: 'text-purple-600 dark:text-purple-400 border-purple-500',
    status: 'text-yellow-600 dark:text-yellow-400 border-yellow-500',
    archive: 'text-rose-600 dark:text-rose-400 border-rose-500',
    closed: 'text-gray-600 dark:text-gray-400 border-gray-500',
};

const ACTION_LABELS: Record<string, string> = {
    CREATE: 'تم إنشاء القضية',
    UPDATE: 'تم تحديث القضية',
    ASSIGN: 'تم تعيين ضابط',
    ARCHIVE: 'تم أرشفة القضية',
    DELETE: 'تم حذف القضية',
};

export function CaseTimeline({ caseId, isLoading }: CaseTimelineProps) {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!caseId) return;
        setLoading(true);

        // Fetch audit logs for this case
        fetch(`/api/audit?entityType=CASE&entityId=${caseId}&pageSize=50`)
            .then((res) => res.json())
            .then((data) => {
                const items = (data.data || []).map((entry: any) => {
                    let type: TimelineEvent['type'] = 'updated';
                    const action = entry.action || '';
                    if (action === 'CREATE') type = 'created';
                    else if (action === 'ASSIGN') type = 'assigned';
                    else if (action === 'ARCHIVE') type = 'archive';
                    else if (action === 'DELETE' || action === 'CLOSE' || action === 'COMPLETED') type = 'closed';

                    return {
                        id: entry.id,
                        action: ACTION_LABELS[action] || action.replace(/_/g, ' '),
                        actor: entry.user?.fullName || entry.user?.username || entry.officer?.fullName || 'النظام',
                        timestamp: entry.createdAt,
                        details: entry.details ? (typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)) : undefined,
                        type,
                    };
                });
                setEvents(items);
                setLoading(false);
            })
            .catch(() => {
                setEvents([]);
                setLoading(false);
            });
    }, [caseId]);

    if (isLoading || loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">الجدول الزمني</h3>
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                    جاري تحميل الأحداث...
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">الجدول الزمني</h3>

            {events.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                    لا توجد أحداث في الجدول الزمني
                </p>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute right-4 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />

                    <div className="space-y-4">
                        {events.map((event) => (
                            <div key={event.id} className="relative pr-10">
                                {/* Timeline dot */}
                                <div
                                    className={`absolute right-2 w-4 h-4 rounded-full border-2 bg-white dark:bg-gray-900 flex items-center justify-center text-xs ${EVENT_COLORS[event.type] || 'border-gray-400 text-gray-400'}`}
                                >
                                    {EVENT_ICONS[event.type] || '●'}
                                </div>

                                {/* Event content */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {event.action}
                                        </p>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap mr-2">
                                            {new Date(event.timestamp).toLocaleDateString('ar-YE', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        بواسطة: {event.actor}
                                    </p>
                                    {event.details && (
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                                            {event.details}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}