"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { FileText, Loader2, AlertTriangle, Info, AlertCircle, Search, X, Filter } from 'lucide-react';

interface AuditEntryItem {
    id: string;
    action: string;
    actor: string;
    target: string;
    timestamp: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    details?: string;
}

interface AuditStreamProps {
    entries?: AuditEntryItem[];
    isLoading?: boolean;
}

const severityStyles = {
    CRITICAL: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-r-red-500/50' },
    WARNING: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-r-amber-500/50' },
    INFO: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-r-blue-500/50' },
};

export default function AuditStream({ entries = [], isLoading = false }: AuditStreamProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
    const [filterActor, setFilterActor] = useState<string>('ALL');
    const [filterAction, setFilterAction] = useState<string>('ALL');
    const [showFilters, setShowFilters] = useState(false);

    // Extract unique actors and actions for filter dropdowns
    const { uniqueActors, uniqueActions } = useMemo(() => {
        const actors = new Set<string>();
        const actions = new Set<string>();
        entries.forEach(e => {
            if (e.actor) actors.add(e.actor);
            if (e.action) actions.add(e.action);
        });
        return {
            uniqueActors: Array.from(actors).sort(),
            uniqueActions: Array.from(actions).sort(),
        };
    }, [entries]);

    // Filtered entries
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            // Severity filter
            if (filterSeverity !== 'ALL' && entry.severity !== filterSeverity) return false;

            // Actor filter
            if (filterActor !== 'ALL' && entry.actor !== filterActor) return false;

            // Action filter
            if (filterAction !== 'ALL' && entry.action !== filterAction) return false;

            // Search query
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    entry.action.toLowerCase().includes(q) ||
                    entry.actor.toLowerCase().includes(q) ||
                    entry.target.toLowerCase().includes(q) ||
                    (entry.details && entry.details.toLowerCase().includes(q))
                );
            }

            return true;
        });
    }, [entries, filterSeverity, filterActor, filterAction, searchQuery]);

    if (isLoading) {
        return (
            <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm p-6 flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="w-6 h-6 text-[#39ff14] animate-spin mb-2" />
                <span className="text-xs text-gray-500 font-mono">تحميل سجل التدقيق...</span>
            </div>
        );
    }

    return (
        <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm tactical-card">
            <div className="p-4 border-b border-[#1a3a2a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#39ff14]" />
                    <h3 className="text-xs font-bold text-white font-mono tracking-wider">سجل التدقيق / AUDIT STREAM</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${showFilters ? 'bg-[#39ff14]/20 text-[#39ff14]' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a3a2a]/50'}`}
                        title="تصفية"
                    >
                        <Filter className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[9px] text-gray-500 font-mono">
                        {filteredEntries.length}/{entries.length}
                    </span>
                </div>
            </div>

            {/* Search & Filters */}
            <div className={`border-b border-[#1a3a2a] transition-all duration-200 ${showFilters ? 'p-3' : 'h-0 overflow-hidden p-0'}`}>
                <div className="space-y-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="بحث في السجل..."
                            className="w-full bg-[#0f1922] border border-[#1a3a2a] rounded text-xs text-white pr-7 pl-2 py-1.5 font-mono placeholder:text-gray-600 focus:border-[#39ff14]/30 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Filter dropdowns */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Severity Filter */}
                        <select
                            value={filterSeverity}
                            onChange={(e) => setFilterSeverity(e.target.value)}
                            className="bg-[#0f1922] border border-[#1a3a2a] rounded text-[10px] text-gray-300 px-2 py-1.5 font-mono focus:border-[#39ff14]/30 focus:outline-none cursor-pointer"
                        >
                            <option value="ALL">جميع المستويات</option>
                            <option value="CRITICAL">حرج</option>
                            <option value="WARNING">تحذير</option>
                            <option value="INFO">معلومة</option>
                        </select>

                        {/* Actor Filter */}
                        <select
                            value={filterActor}
                            onChange={(e) => setFilterActor(e.target.value)}
                            className="bg-[#0f1922] border border-[#1a3a2a] rounded text-[10px] text-gray-300 px-2 py-1.5 font-mono focus:border-[#39ff14]/30 focus:outline-none cursor-pointer"
                        >
                            <option value="ALL">جميع المستخدمين</option>
                            {uniqueActors.map(actor => (
                                <option key={actor} value={actor}>{actor}</option>
                            ))}
                        </select>

                        {/* Action Filter */}
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="bg-[#0f1922] border border-[#1a3a2a] rounded text-[10px] text-gray-300 px-2 py-1.5 font-mono focus:border-[#39ff14]/30 focus:outline-none cursor-pointer"
                        >
                            <option value="ALL">جميع الإجراءات</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Entries list */}
            <div className="max-h-[350px] overflow-y-auto">
                {filteredEntries.length === 0 ? (
                    <div className="p-6 text-center">
                        <FileText className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                        <p className="text-xs text-gray-600">لا توجد إدخالات مطابقة</p>
                        <p className="text-[10px] text-gray-700 font-mono">NO MATCHING AUDIT ENTRIES</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#1a3a2a]/50">
                        {filteredEntries.map((entry) => {
                            const sev = severityStyles[entry.severity];
                            const SevIcon = sev.icon;
                            return (
                                <div
                                    key={entry.id}
                                    className={`p-3 hover:bg-[#0f1922]/50 transition-colors border-r-2 ${sev.border}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-1 rounded ${sev.bg}`}>
                                            <SevIcon className={`w-3 h-3 ${sev.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-white truncate">{entry.action}</span>
                                                <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${sev.bg} ${sev.color}`}>
                                                    {entry.severity}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-gray-400 font-bold">{entry.actor}</span>
                                                <span className="text-[8px] text-gray-700">→</span>
                                                <span className="text-[10px] text-gray-500 truncate">{entry.target}</span>
                                            </div>
                                            {entry.details && (
                                                <p className="text-[9px] text-gray-600 mt-1 line-clamp-1">{entry.details}</p>
                                            )}
                                            <span className="text-[8px] text-gray-700 font-mono mt-1 block">
                                                {new Date(entry.timestamp).toLocaleString('ar-SA', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-[#1a3a2a] text-[9px] text-gray-600 font-mono text-center">
                <span>AUDIT TRAIL // IMMUTABLE LOG // {filteredEntries.length} MATCHING</span>
            </div>
        </div>
    );
}