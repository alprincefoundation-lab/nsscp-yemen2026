'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { CaseItem, CaseUpdateInput } from '../services/cases-api';
import { fetchCaseById, updateCase, deleteCase, archiveCase, assignCase } from '../services/cases-api';
import type { ApiResponse } from '@/types/api';

interface UseCaseReturn {
    caseItem: CaseItem | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    update: (input: CaseUpdateInput) => Promise<boolean>;
    remove: (userId?: string) => Promise<boolean>;
    archive: (userId?: string) => Promise<boolean>;
    assign: (officerId: string, userId?: string) => Promise<boolean>;
}

export function useCase(id: string | null): UseCaseReturn {
    const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(!!id);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef<boolean>(true);

    const fetchData = useCallback(async (caseId: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setIsLoading(true);
            setError(null);
            const response = await fetchCaseById(caseId);
            if (isMountedRef.current && !controller.signal.aborted) {
                if (response.success && response.data) {
                    setCaseItem(response.data as CaseItem);
                } else {
                    setError(response.error || 'Failed to fetch case');
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            if (isMountedRef.current) {
                setError(err instanceof Error ? err.message : 'Failed to fetch case');
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    const refetch = useCallback(async () => {
        if (id) {
            await fetchData(id);
        }
    }, [id, fetchData]);

    useEffect(() => {
        isMountedRef.current = true;
        if (id) {
            fetchData(id);
        }

        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [id, fetchData]);

    const update = useCallback(async (input: CaseUpdateInput): Promise<boolean> => {
        if (!id) return false;
        try {
            const response = await updateCase(id, input);
            if (response.success && response.data) {
                setCaseItem(response.data as CaseItem);
                setError(null);
                return true;
            }
            setError(response.error || 'Failed to update case');
            return false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update case');
            return false;
        }
    }, [id]);

    const remove = useCallback(async (userId?: string): Promise<boolean> => {
        if (!id) return false;
        try {
            const response = await deleteCase(id, userId);
            if (response.success) {
                setCaseItem(null);
                setError(null);
                return true;
            }
            setError(response.error || 'Failed to delete case');
            return false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete case');
            return false;
        }
    }, [id]);

    const archive = useCallback(async (userId?: string): Promise<boolean> => {
        if (!id) return false;
        try {
            const response = await archiveCase(id, userId);
            if (response.success && response.data) {
                setCaseItem(response.data as CaseItem);
                setError(null);
                return true;
            }
            setError(response.error || 'Failed to archive case');
            return false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to archive case');
            return false;
        }
    }, [id]);

    const assign = useCallback(async (officerId: string, userId?: string): Promise<boolean> => {
        if (!id) return false;
        try {
            const response = await assignCase(id, officerId, userId);
            if (response.success && response.data) {
                setCaseItem(response.data as CaseItem);
                setError(null);
                return true;
            }
            setError(response.error || 'Failed to assign case');
            return false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign case');
            return false;
        }
    }, [id]);

    return { caseItem, isLoading, error, refetch, update, remove, archive, assign };
}