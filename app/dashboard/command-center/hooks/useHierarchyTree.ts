'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { HierarchyNode } from '../services/command-center-api';
import { fetchHierarchyTree } from '../services/command-center-api';

interface UseHierarchyTreeReturn {
    tree: HierarchyNode[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const POLL_INTERVAL = 5000; // 5 seconds

export function useHierarchyTree(): UseHierarchyTreeReturn {
    const [tree, setTree] = useState<HierarchyNode[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef<boolean>(true);

    const fetchData = useCallback(async () => {
        // Cancel any in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const data = await fetchHierarchyTree(controller.signal);
            if (isMountedRef.current && !controller.signal.aborted) {
                setTree(data);
                setError(null);
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            if (isMountedRef.current) {
                setError(err instanceof Error ? err.message : 'فشل جلب الشجرة الهرمية');
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        await fetchData();
    }, [fetchData]);

    useEffect(() => {
        isMountedRef.current = true;

        // Initial fetch
        fetchData();

        // Polling every 5 seconds
        const interval = setInterval(fetchData, POLL_INTERVAL);

        return () => {
            isMountedRef.current = false;
            clearInterval(interval);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchData]);

    return { tree, isLoading, error, refetch };
}