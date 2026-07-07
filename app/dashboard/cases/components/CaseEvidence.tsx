"use client";

import type { CaseEvidence as CaseEvidenceType } from '../services/cases-api';

interface CaseEvidenceProps {
    evidence: CaseEvidenceType[];
    isLoading?: boolean;
}

const EVIDENCE_TYPE_LABELS: Record<string, string> = {
    PHYSICAL: 'مادي',
    DIGITAL: 'رقمي',
    DOCUMENT: 'مستند',
    PHOTOGRAPH: 'صورة',
    FINGERPRINT: 'بصمة',
    DNA: 'DNA',
    WEAPON: 'سلاح',
    DRUG: 'مخدرات',
    OTHER: 'آخر',
};

const EVIDENCE_STATUS_LABELS: Record<string, string> = {
    COLLECTED: 'تم الجمع',
    IN_LAB: 'في المختبر',
    ANALYZED: 'تم التحليل',
    STORED: 'مخزن',
    RETURNED: 'تم الإرجاع',
    DESTROYED: 'تم الإتلاف',
    SUBMITTED_TO_COURT: 'قدم للمحكمة',
};

export function CaseEvidence({ evidence, isLoading }: CaseEvidenceProps) {
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">الأدلة</h3>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    الأدلة
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {evidence.length} دليل
                </span>
            </div>

            {evidence.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                    لا توجد أدلة مسجلة
                </p>
            ) : (
                <div className="space-y-3">
                    {evidence.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                        >
                            {/* Type Icon */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {item.evidenceNumber}
                                    </p>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                                        {EVIDENCE_TYPE_LABELS[item.type] || item.type}
                                    </span>
                                </div>
                                {item.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {item.description}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span className={`px-1.5 py-0.5 rounded ${item.status === 'STORED' || item.status === 'ANALYZED'
                                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                            : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                        }`}>
                                        {EVIDENCE_STATUS_LABELS[item.status] || item.status}
                                    </span>
                                    {item.storageLocation && (
                                        <span>📍 {item.storageLocation}</span>
                                    )}
                                    {item.collectedAt && (
                                        <span>
                                            📅 {new Date(item.collectedAt).toLocaleDateString('ar-YE')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}