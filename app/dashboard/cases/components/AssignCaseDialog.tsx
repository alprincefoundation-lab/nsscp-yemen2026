"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

import type { CaseItem } from '../services/cases-api';
import { assignCase } from '../services/cases-api';

interface OfficerOption {
    id: string;
    fullName: string;
    badgeNumber: string;
    rank: string;
}

interface AssignCaseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    caseItem: CaseItem | null;
    userId?: string;
}

export function AssignCaseDialog({ isOpen, onClose, onSuccess, caseItem, userId }: AssignCaseDialogProps) {
    const [officers, setOfficers] = useState<OfficerOption[]>([]);
    const [selectedOfficerId, setSelectedOfficerId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingOfficers, setLoadingOfficers] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedOfficerId(caseItem?.assignedOfficerId || '');
            setError(null);
            fetchOfficers();
        }
    }, [isOpen, caseItem]);

    const fetchOfficers = async () => {
        setLoadingOfficers(true);
        try {
            const response = await fetch('/api/officers?isActive=true');
            const data = await response.json();
            const list = Array.isArray(data) ? data : data.data || [];
            setOfficers(list.map((o: any) => ({
                id: o.id,
                fullName: o.fullName,
                badgeNumber: o.badgeNumber,
                rank: o.rank,
            })));
        } catch {
            setError('فشل تحميل قائمة الضباط');
        } finally {
            setLoadingOfficers(false);
        }
    };

    if (!isOpen || !caseItem) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOfficerId) {
            setError('يرجى اختيار ضابط');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await assignCase(caseItem.id, selectedOfficerId, userId);
            if (response.success) {
                onSuccess();
                onClose();
            } else {
                setError(response.error || 'فشل تعيين القضية');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل تعيين القضية');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black/50" onClick={onClose} />
                <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6 z-10">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">تعيين قضية</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        تعيين القضية رقم: <span className="font-mono text-blue-600 dark:text-blue-400">{caseItem.caseNumber}</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                الضابط المسؤول <span className="text-red-500">*</span>
                            </label>
                            {loadingOfficers ? (
                                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                    جاري تحميل الضباط...
                                </div>
                            ) : (
                                <select
                                    value={selectedOfficerId}
                                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">اختر ضابطاً</option>
                                    {officers.map((officer) => (
                                        <option key={officer.id} value={officer.id}>
                                            {officer.rank} {officer.fullName} - {officer.badgeNumber}
                                        </option>
                                    ))}
                                </select>
                            )}
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
                            <button type="submit" disabled={isSubmitting || !selectedOfficerId} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? 'جاري التعيين...' : 'تعيين'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}