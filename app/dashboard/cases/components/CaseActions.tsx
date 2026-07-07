"use client";

import type { CaseItem } from '../services/cases-api';

interface CaseActionsProps {
    caseItem?: CaseItem | null;
    userRole?: string;
    onEdit?: () => void;
    onAssign?: () => void;
    onTransfer?: () => void;
    onClose?: () => void;
    onArchive?: () => void;
    onPrint?: () => void;
    onGenerateReport?: () => void;
    isDetailsView?: boolean;
}

const ROLE_HIERARCHY: Record<string, number> = {
    SUPER_ADMIN: 100,
    MINISTRY_ADMIN: 80,
    GOVERNORATE_ADMIN: 60,
    DEPARTMENT_MANAGER: 40,
    SECTION_MANAGER: 20,
    OFFICER: 10,
};

function hasPermission(userRole: string, minRole: string): boolean {
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const minLevel = ROLE_HIERARCHY[minRole] || 0;
    return userLevel >= minLevel;
}

export function CaseActions({
    caseItem,
    userRole = 'OFFICER',
    onEdit,
    onAssign,
    onTransfer,
    onClose,
    onArchive,
    onPrint,
    onGenerateReport,
    isDetailsView = false,
}: CaseActionsProps) {
    const status = caseItem?.status;

    const canCreate = hasPermission(userRole, 'OFFICER');
    const canEdit = hasPermission(userRole, 'SECTION_MANAGER') || (hasPermission(userRole, 'OFFICER') && status === 'OPEN');
    const canAssign = hasPermission(userRole, 'SECTION_MANAGER');
    const canTransfer = hasPermission(userRole, 'DEPARTMENT_MANAGER');
    const canClose = hasPermission(userRole, 'SECTION_MANAGER') && status !== 'CLOSED' && status !== 'ARCHIVED';
    const canArchive = hasPermission(userRole, 'GOVERNORATE_ADMIN') && status !== 'ARCHIVED';
    const canPrint = hasPermission(userRole, 'OFFICER');
    const canGenerateReport = hasPermission(userRole, 'SECTION_MANAGER');

    if (!isDetailsView) {
        // List view actions - just show create button
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">الإجراءات</h3>
            <div className="flex flex-wrap gap-2">
                {canEdit && onEdit && (
                    <button
                        onClick={onEdit}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        تعديل
                    </button>
                )}
                {canAssign && onAssign && (
                    <button
                        onClick={onAssign}
                        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        تعيين
                    </button>
                )}
                {canTransfer && onTransfer && (
                    <button
                        onClick={onTransfer}
                        className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        تحويل
                    </button>
                )}
                {canClose && onClose && (
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        إغلاق
                    </button>
                )}
                {canArchive && onArchive && (
                    <button
                        onClick={onArchive}
                        className="px-3 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                    >
                        أرشفة
                    </button>
                )}
                {canPrint && onPrint && (
                    <button
                        onClick={onPrint}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        طباعة
                    </button>
                )}
                {canGenerateReport && onGenerateReport && (
                    <button
                        onClick={onGenerateReport}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        تقرير
                    </button>
                )}
            </div>
        </div>
    );
}