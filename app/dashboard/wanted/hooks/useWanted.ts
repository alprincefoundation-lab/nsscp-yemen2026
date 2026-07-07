'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { WantedPerson, WantedFilters, WantedResponse } from '../services/wanted-api';
import { fetchWanted, createWanted, updateWanted, deleteWanted } from '../services/wanted-api';
import type { WantedCreateInput, WantedUpdateInput } from '../services/wanted-api';

interface UseWantedReturn {
    wanted: WantedPerson[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
    filters: WantedFilters;
    setFilters: (filters: WantedFilters) => void;
    setPage: (page: number) => void;
    refetch: () => Promise<void>;
    addWanted: (input: WantedCreateInput) => Promise<WantedPerson | null>;
    editWanted: (input: WantedUpdateInput) => Promise<WantedPerson | null>;
    removeWanted: (id: string) => Promise<boolean>;
}

export function useWanted(initialFilters: WantedFilters = {}): UseWantedReturn {
    const [wanted, setWanted] = useState<WantedPerson[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(initialFilters.page || 1);
    const [pageSize] = useState(initialFilters.pageSize || 20);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<WantedFilters>({ ...initialFilters, page: 1 });
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef<boolean>(true);

    const fetchData = useCallback(async (currentFilters: WantedFilters) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setIsLoading(true);
            const response = await fetchWanted(currentFilters);
            if (isMountedRef.current && !controller.signal.aborted) {
                setWanted(response.data);
                setTotal(response.total);
                setTotalPages(response.totalPages);
                setError(null);
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            if (isMountedRef.current) {
                setError(err instanceof Error ? err.message : 'فشل تحميل بيانات المطلوبين');
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

    const handleSetFilters = useCallback((newFilters: WantedFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1);
    }, []);

    const addWanted = useCallback(async (input: WantedCreateInput): Promise<WantedPerson | null> => {
        try {
            const created = await createWanted(input);
            await refetch();
            return created;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل إضافة المطلوب');
            return null;
        }
    }, [refetch]);

    const editWanted = useCallback(async (input: WantedUpdateInput): Promise<WantedPerson | null> => {
        try {
            const updated = await updateWanted(input);
            await refetch();
            return updated;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل تحديث بيانات المطلوب');
            return null;
        }
    }, [refetch]);

    const removeWanted = useCallback(async (id: string): Promise<boolean> => {
        try {
            await deleteWanted(id);
            await refetch();
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل حذف المطلوب');
            return false;
        }
    }, [refetch]);

    return {
        wanted, total, page, pageSize, totalPages,
        isLoading, error, filters,
        setFilters: handleSetFilters,
        setPage: handleSetPage,
        refetch,
        addWanted, editWanted, removeWanted,
    };
}
