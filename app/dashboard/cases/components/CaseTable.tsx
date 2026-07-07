"use client";

import type { CaseItem } from '../services/cases-api';
import { CaseStatusBadge, CasePriorityBadge } from './CaseStatusBadge';

interface CaseTableProps {
    cases: CaseItem[];
    isLoading: boolean;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onSort: (field: string) => void;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onCaseClick: (caseItem: CaseItem) => void;
    selectedCaseId?: string | null;
}

export function CaseTable({
    cases,
    isLoading,
    total,
    page,
    pageSize,
    totalPages,
    onPageChange,
    onSort,
    sortBy,
    sortOrder,
    onCaseClick,
    selectedCaseId,
}: CaseTableProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ar-YE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const renderSortIcon = (field: string) => {
        if (sortBy !== field) return <span className="text-gray-300 dark:text-gray-600 mr-1">↕</span>;
        return (
            <span className="text-blue-600 dark:text-blue-400 mr-1">
                {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    const handleSortClick = (field: string) => {
        onSort(field);
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-8 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">جاري تحميل القضايا...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <th
                                className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 whitespace-nowrap"
                                onClick={() => handleSortClick('caseNumber')}
                            >
                                {renderSortIcon('caseNumber')}
                                رقم القضية
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                النوع
                            </th>
                            <th
                                className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 whitespace-nowrap"
                                onClick={() => handleSortClick('title')}
                            >
                                {renderSortIcon('title')}
                                العنوان
                            </th>
                            <th
                                className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 whitespace-nowrap"
                                onClick={() => handleSortClick('status')}
                            >
                                {renderSortIcon('status')}
                                الحالة
                            </th>
                            <th
                                className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 whitespace-nowrap"
                                onClick={() => handleSortClick('priority')}
                            >
                                {renderSortIcon('priority')}
                                الأولوية
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                المحافظة
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                الإدارة
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                الضابط المسؤول
                            </th>
                            <th
                                className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 whitespace-nowrap"
                                onClick={() => handleSortClick('createdAt')}
                            >
                                {renderSortIcon('createdAt')}
                                تاريخ الإنشاء
                            </th>
                            <th
                                className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 whitespace-nowrap"
                                onClick={() => handleSortClick('updatedAt')}
                            >
                                {renderSortIcon('updatedAt')}
                                آخر تحديث
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {cases.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                    لا توجد قضايا متطابقة
                                </td>
                            </tr>
                        ) : (
                            cases.map((caseItem) => (
                                <tr
                                    key={caseItem.id}
                                    onClick={() => onCaseClick(caseItem)}
                                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors ${selectedCaseId === caseItem.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-r-blue-600'
                                            : ''
                                        }`}
                                >
                                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">
                                        {caseItem.caseNumber}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {caseItem.caseType}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-xs truncate">
                                        {caseItem.title}
                                    </td>
                                    <td className="px-4 py-3">
                                        <CaseStatusBadge status={caseItem.status} size="sm" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <CasePriorityBadge priority={caseItem.priority} size="sm" />
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                        {caseItem.hierarchyEntity?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                        {caseItem.hierarchyEntity?.type || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {caseItem.assignedOfficer
                                            ? `${caseItem.assignedOfficer.rank} ${caseItem.assignedOfficer.fullName}`
                                            : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {formatDate(caseItem.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {formatDate(caseItem.updatedAt)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        إجمالي {total} قضية | الصفحة {page} من {totalPages}
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                            السابق
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`px-3 py-1 text-sm border rounded-md ${page === pageNum
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                            التالي
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}