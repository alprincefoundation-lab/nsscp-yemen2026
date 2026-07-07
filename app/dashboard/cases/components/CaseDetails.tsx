"use client";

import type { CaseItem } from '../services/cases-api';
import { CaseHeader } from './CaseHeader';
import { CaseActions } from './CaseActions';
import { CaseTimeline } from './CaseTimeline';
import { CaseEvidence } from './CaseEvidence';
import { CasePersons } from './CasePersons';
import { CaseVehicles } from './CaseVehicles';
import { CaseNotes } from './CaseNotes';
import { CaseAttachments } from './CaseAttachments';

interface CaseDetailsProps {
    caseItem: CaseItem | null;
    isLoading: boolean;
    error?: string | null;
    userRole?: string;
    onEdit?: () => void;
    onAssign?: () => void;
    onTransfer?: () => void;
    onClose?: () => void;
    onArchive?: () => void;
    onPrint?: () => void;
    onGenerateReport?: () => void;
}

export function CaseDetails({
    caseItem,
    isLoading,
    error,
    userRole,
    onEdit,
    onAssign,
    onTransfer,
    onClose,
    onArchive,
    onPrint,
    onGenerateReport,
}: CaseDetailsProps) {
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800 p-6">
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    if (!caseItem) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">اختر قضية لعرض التفاصيل</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <CaseHeader
                caseItem={caseItem}
                onPrint={onPrint}
                onExport={onGenerateReport}
            />

            {/* Actions */}
            <CaseActions
                caseItem={caseItem}
                userRole={userRole}
                onEdit={onEdit}
                onAssign={onAssign}
                onTransfer={onTransfer}
                onClose={onClose}
                onArchive={onArchive}
                onPrint={onPrint}
                onGenerateReport={onGenerateReport}
                isDetailsView
            />

            {/* Two-column layout for details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CaseTimeline caseId={caseItem.id} />
                <CaseEvidence evidence={caseItem.evidence} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CasePersons />
                <CaseVehicles />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CaseNotes caseId={caseItem.id} />
                <CaseAttachments caseId={caseItem.id} />
            </div>
        </div>
    );
}