'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { CaseItem, CasesFilters, CasesResponse } from '../services/cases-api';
import { fetchCases } from '../services/cases-api';

interface UseCasesReturn {
    cases: CaseItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
    filters: CasesFilters;
    setFilters: (filters: CasesFilters) => void;
    setPage: (page: number) => void;
    refetch: () => Promise<void>;
}

export function useCases(initialFilters: CasesFilters = {}): UseCasesReturn {
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(initialFilters.page || 1);
    const [pageSize] = useState(initialFilters.pageSize || 20);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<CasesFilters>({ ...initialFilters, page: 1 });
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef<boolean>(true);

    const fetchData = useCallback(async (currentFilters: CasesFilters) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setIsLoading(true);
            const response = await fetchCases(currentFilters);
            if (isMountedRef.current && !controller.signal.aborted) {
                setCases(response.data);
                setTotal(response.total);
                setTotalPages(response.totalPages);
                setError(null);
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            if (isMountedRef.current) {
                setError(err instanceof Error ? err.message : 'Failed to fetch cases');
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    const refetch = useCallback(async () => {
        await fetchData({ ...filters, page, pageSize });
    }, [fetchData, filters, page, pageSize]);

    useEffect(() => {
        isMountedRef.current = true;
        fetchData({ ...filters, page, pageSize });

        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchData, filters, page, pageSize]);

    const handleSetPage = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const handleSetFilters = useCallback((newFilters: CasesFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1);
    }, []);

    return {
        cases,
        total,
        page,
        pageSize,
        totalPages,
        isLoading,
        error,
        filters,
        setFilters: handleSetFilters,
        setPage: handleSetPage,
        refetch,
    };
}