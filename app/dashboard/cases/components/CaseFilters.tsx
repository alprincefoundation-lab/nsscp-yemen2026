"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

import type { CasesFilters } from '../services/cases-api';
import { CASE_STATUS_WORKFLOW, CASE_PRIORITIES, CASE_TYPES } from '../services/cases-api';

interface CaseFiltersProps {
    filters: CasesFilters;
    onFiltersChange: (filters: CasesFilters) => void;
    hierarchyEntities?: { value: string; label: string }[];
}

export function CaseFilters({
    filters,
    onFiltersChange,
    hierarchyEntities = [],
}: CaseFiltersProps) {
    const [localSearch, setLocalSearch] = useState(filters.search || '');

    const handleFilterChange = useCallback((key: keyof CasesFilters, value: string | undefined) => {
        onFiltersChange({ [key]: value || undefined });
    }, [onFiltersChange]);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onFiltersChange({ search: localSearch || undefined });
    }, [localSearch, onFiltersChange]);

    const handleClear = useCallback(() => {
        setLocalSearch('');
        onFiltersChange({
            search: undefined,
            status: undefined,
            priority: undefined,
            caseType: undefined,
            hierarchyEntityId: undefined,
            assignedUserId: undefined,
            fromDate: undefined,
            toDate: undefined,
        });
    }, [onFiltersChange]);

    const hasActiveFilters = filters.status || filters.priority || filters.caseType ||
        filters.hierarchyEntityId ||
        filters.assignedUserId || filters.search || filters.fromDate || filters.toDate;

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

    const priorityLabels: Record<string, string> = {
        LOW: 'منخفضة',
        NORMAL: 'عادية',
        HIGH: 'عالية',
        URGENT: 'عاجلة',
        CRITICAL: 'حرجة',
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <svg
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        placeholder="بحث برقم القضية أو العنوان..."
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                    بحث
                </button>
            </form>

            {/* Filters Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {/* Status Filter */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        الحالة
                    </label>
                    <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    >
                        <option value="">الكل</option>
                        {CASE_STATUS_WORKFLOW.map((status) => (
                            <option key={status} value={status}>
                                {statusLabels[status] || status}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Priority Filter */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        الأولوية
                    </label>
                    <select
                        value={filters.priority || ''}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    >
                        <option value="">الكل</option>
                        {CASE_PRIORITIES.map((priority) => (
                            <option key={priority} value={priority}>
                                {priorityLabels[priority] || priority}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Case Type Filter */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        نوع القضية
                    </label>
                    <select
                        value={filters.caseType || ''}
                        onChange={(e) => handleFilterChange('caseType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    >
                        <option value="">الكل</option>
                        {CASE_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Hierarchy Entity Filter */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        الكيان التنظيمي
                    </label>
                    <select
                        value={filters.hierarchyEntityId || ''}
                        onChange={(e) => handleFilterChange('hierarchyEntityId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    >
                        <option value="">الكل</option>
                        {hierarchyEntities.map((entity) => (
                            <option key={entity.value} value={entity.value}>
                                {entity.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date Range - From */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        من تاريخ
                    </label>
                    <input
                        type="date"
                        value={filters.fromDate || ''}
                        onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                </div>

                {/* Date Range - To */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        إلى تاريخ
                    </label>
                    <input
                        type="date"
                        value={filters.toDate || ''}
                        onChange={(e) => handleFilterChange('toDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                </div>
            </div>

            {/* Active Filters Indicator */}
            {hasActiveFilters && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        توجد عوامل تصفية نشطة
                    </span>
                    <button
                        onClick={handleClear}
                        className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        إلغاء التصفية
                    </button>
                </div>
            )}
        </div>
    );
}