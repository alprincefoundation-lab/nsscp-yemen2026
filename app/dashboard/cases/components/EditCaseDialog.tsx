"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

import type { CaseItem, CaseUpdateInput } from '../services/cases-api';
import { CASE_STATUS_WORKFLOW, CASE_PRIORITIES, CASE_TYPES, updateCase } from '../services/cases-api';

interface EditCaseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    caseItem: CaseItem | null;
    userId?: string;
}

export function EditCaseDialog({ isOpen, onClose, onSuccess, caseItem, userId }: EditCaseDialogProps) {
    const [formData, setFormData] = useState<CaseUpdateInput>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        if (caseItem) {
            setFormData({
                title: caseItem.title,
                description: caseItem.description,
                caseType: caseItem.caseType,
                status: caseItem.status,
                priority: caseItem.priority,
            });
            setError(null);
        }
    }, [caseItem]);

    if (!isOpen || !caseItem) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title?.trim()) {
            setError('العنوان مطلوب');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await updateCase(caseItem.id, {
                ...formData,
                updatedByUserId: userId,
            });
            if (response.success) {
                onSuccess();
                onClose();
            } else {
                setError(response.error || 'فشل تحديث القضية');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل تحديث القضية');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black/50" onClick={onClose} />
                <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg p-6 z-10">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">تعديل القضية</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Case Number (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم القضية</label>
                            <input
                                type="text"
                                value={caseItem.caseNumber}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm"
                            />
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                العنوان <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحالة</label>
                            <select
                                value={formData.status || caseItem.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                {CASE_STATUS_WORKFLOW.map((status) => (
                                    <option key={status} value={status}>{statusLabels[status] || status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأولوية</label>
                            <select
                                value={formData.priority || caseItem.priority}
                                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                {CASE_PRIORITIES.map((priority) => (
                                    <option key={priority} value={priority}>
                                        {priority === 'LOW' ? 'منخفضة' : priority === 'NORMAL' ? 'عادية' : priority === 'HIGH' ? 'عالية' : priority === 'URGENT' ? 'عاجلة' : 'حرجة'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Case Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع القضية</label>
                            <select
                                value={formData.caseType || caseItem.caseType}
                                onChange={(e) => setFormData(prev => ({ ...prev, caseType: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                {CASE_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
                            <textarea
                                value={formData.description || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                                إلغاء
                            </button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}