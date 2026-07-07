"use client";

import type { CaseItem } from '../services/cases-api';
import { CaseStatusBadge, CasePriorityBadge } from './CaseStatusBadge';

interface CaseHeaderProps {
    caseItem: CaseItem;
    onPrint?: () => void;
    onExport?: () => void;
}

export function CaseHeader({ caseItem, onPrint, onExport }: CaseHeaderProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ar-YE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            {/* Top Row: Case Number & Actions */}
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {caseItem.title}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        رقم القضية: {caseItem.caseNumber}
                    </p>
                </div>
                <div className="flex gap-2">
                    {onPrint && (
                        <button
                            onClick={onPrint}
                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                            طباعة
                        </button>
                    )}
                    {onExport && (
                        <button
                            onClick={onExport}
                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                            تصدير
                        </button>
                    )}
                </div>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap gap-3 mb-4">
                <CaseStatusBadge status={caseItem.status} size="md" />
                <CasePriorityBadge priority={caseItem.priority} size="md" />
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {caseItem.caseType}
                </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">تاريخ الإنشاء</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(caseItem.createdAt)}</span>
                </div>
                <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">آخر تحديث</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(caseItem.updatedAt)}</span>
                </div>
                {caseItem.assignedOfficer && (
                    <div>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">الضابط المسؤول</span>
                        <span className="text-gray-900 dark:text-gray-100">
                            {caseItem.assignedOfficer.rank} {caseItem.assignedOfficer.fullName}
                        </span>
                    </div>
                )}
                {caseItem.hierarchyEntity && (
                    <div>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">الجهة</span>
                        <span className="text-gray-900 dark:text-gray-100">{caseItem.hierarchyEntity.name}</span>
                    </div>
                )}
                <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">عدد المرفقات</span>
                    <span className="text-gray-900 dark:text-gray-100">{caseItem.evidence?.length || 0}</span>
                </div>
                <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">عدد المكلفين</span>
                    <span className="text-gray-900 dark:text-gray-100">{caseItem.assignments?.length || 0}</span>
                </div>
            </div>

            {/* Description */}
            {caseItem.description && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الوصف</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {caseItem.description}
                    </p>
                </div>
            )}
        </div>
    );
}