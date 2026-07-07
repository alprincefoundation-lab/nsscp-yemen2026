'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { StatsOverview } from '../services/command-center-api';
import { fetchStatsOverview } from '../services/command-center-api';

interface UseStatsOverviewReturn {
    stats: StatsOverview;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const POLL_INTERVAL = 15000; // 15 seconds

export function useStatsOverview(): UseStatsOverviewReturn {
    const [stats, setStats] = useState<StatsOverview>({
        totalAlerts: 0,
        criticalAlerts: 0,
        activeUsers: 0,
        activeSessions: 0,
        systemUptime: '00:00:00',
        lastUpdated: new Date().toISOString(),
        departmentCount: 19,
        governorateCount: 22,
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef<boolean>(true);

    const fetchData = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const data = await fetchStatsOverview(controller.signal);
            if (isMountedRef.current && !controller.signal.aborted) {
                setStats(data);
                setError(null);
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            if (isMountedRef.current) {
                setError(err instanceof Error ? err.message : 'فشل جلب الإحصائيات');
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
        fetchData();

        const interval = setInterval(fetchData, POLL_INTERVAL);

        return () => {
            isMountedRef.current = false;
            clearInterval(interval);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchData]);

    return { stats, isLoading, error, refetch };
}