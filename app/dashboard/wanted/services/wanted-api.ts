/**
 * Wanted Persons API Service
 * Connects to /api/wanted endpoint for all wanted person operations.
 * Integrates with hierarchy, RBAC, and audit systems.
 */

import type { ApiResponse, PaginatedResponse } from '@/types/api';

// ===== Type Definitions =====

export interface WantedPerson {
    id: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    aliasNames?: string[];
    dateOfBirth?: string;
    nationality?: string;
    gender?: string;
    status: string;
    dangerLevel?: string;
    hierarchyEntityId?: string;
    caseNumber?: string;
    notes?: string;
    photoUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface WantedFilters {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface WantedResponse {
    data: WantedPerson[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface WantedCreateInput {
    fullName: string;
    status?: string;
    dangerLevel?: string;
    hierarchyEntityId?: string;
    caseNumber?: string;
    notes?: string;
}

export interface WantedUpdateInput {
    id: string;
    fullName?: string;
    status?: string;
    dangerLevel?: string;
    notes?: string;
}

// ===== API Functions =====

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
}

export async function fetchWanted(filters: WantedFilters = {}): Promise<WantedResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);

    const query = params.toString();
    return apiFetch<WantedResponse>(`/api/wanted${query ? `?${query}` : ''}`);
}

export async function createWanted(input: WantedCreateInput): Promise<WantedPerson> {
    return apiFetch<WantedPerson>('/api/wanted', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function updateWanted(input: WantedUpdateInput): Promise<WantedPerson> {
    return apiFetch<WantedPerson>('/api/wanted', {
        method: 'PUT',
        body: JSON.stringify(input),
    });
}

export async function deleteWanted(id: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/api/wanted?id=${id}`, {
        method: 'DELETE',
    });
}

// ===== Status & Danger Level Maps =====

export const WANTED_STATUSES = ['ACTIVE', 'CAPTURED', 'DECEASED', 'ARCHIVED'] as const;
export type WantedStatus = typeof WANTED_STATUSES[number];

export const DANGER_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'] as const;
export type DangerLevel = typeof DANGER_LEVELS[number];

export const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'نشط',
    CAPTURED: 'مقبوض عليه',
    DECEASED: 'متوفى',
    ARCHIVED: 'مؤرشفة',
};

export const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    CAPTURED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    DECEASED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    ARCHIVED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
};

export const DANGER_COLORS: Record<string, string> = {
    LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    EXTREME: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};
