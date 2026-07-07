"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

interface Note {
    id: string;
    content: string;
    author: string;
    createdAt: string;
}

interface CaseNotesProps {
    caseId: string;
    notes?: Note[];
    isLoading?: boolean;
}

export function CaseNotes({ caseId, notes = [], isLoading }: CaseNotesProps) {
    const [newNote, setNewNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        // TODO: integrate with notes API
        setNewNote('');
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">الملاحظات</h3>
                <div className="animate-pulse space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    الملاحظات
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {notes.length} ملاحظة
                </span>
            </div>

            {/* Notes List */}
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {notes.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                        لا توجد ملاحظات
                    </p>
                ) : (
                    notes.map((note) => (
                        <div
                            key={note.id}
                            className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                        >
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {note.content}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {note.author}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {new Date(note.createdAt).toLocaleDateString('ar-YE', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="أضف ملاحظة..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <div className="flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={!newNote.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        إضافة
                    </button>
                </div>
            </form>
        </div>
    );
}