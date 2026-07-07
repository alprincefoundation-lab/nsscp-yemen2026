/**
 * Cases API Service
 * Connects to /api/cases endpoint for all case management operations.
 * Integrates with existing audit, hierarchy, and RBAC systems.
 */

import type { ApiResponse, PaginatedResponse } from '@/types/api';

// ===== Type Definitions =====

export interface CaseOfficer {
    id: string;
    fullName: string;
    badgeNumber: string;
    rank: string;
    phoneNumber?: string;
}

export interface CaseHierarchyEntity {
    id: string;
    name: string;
    type: string;
    parentId?: string | null;
}

export interface CaseEvidence {
    id: string;
    evidenceNumber: string;
    type: string;
    status: string;
    description?: string;
    locationFound?: string;
    collectedAt?: string;
    storageLocation?: string;
    filePath?: string;
    mimeType?: string;
    fileSize?: number;
    officer?: { id: string; fullName: string; badgeNumber: string };
}

export interface CaseIncident {
    id: string;
    incidentNumber: string;
    type: string;
    status: string;
    title: string;
    description?: string;
    dateTime: string;
    location?: string;
    reportedBy?: { id: string; fullName: string };
}

export interface CaseAssignment {
    id: string;
    officer: CaseOfficer;
    role: string;
    notes?: string;
    assignedAt: string;
}

export interface CaseItem {
    id: string;
    caseNumber: string;
    title: string;
    description?: string;
    caseType: string;
    status: string;
    priority: string;
    hierarchyEntityId?: string | null;
    assignedOfficerId?: string | null;
    hierarchyEntity?: CaseHierarchyEntity | null;
    assignedOfficer?: CaseOfficer | null;
    assignments: CaseAssignment[];
    evidence: CaseEvidence[];
    incidents: CaseIncident[];
    createdAt: string;
    updatedAt: string;
}

export interface CasesFilters {
    page?: number;
    pageSize?: number;
    status?: string;
    priority?: string;
    caseType?: string;
    assignedUserId?: string;
    hierarchyEntityId?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface CasesResponse {
    data: CaseItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface CaseCreateInput {
    title: string;
    description?: string;
    caseType: string;
    status?: string;
    priority?: string;
    hierarchyEntityId?: string;
    assignedOfficerId?: string;
    createdByUserId?: string;
    createdByOfficerId?: string;
}

export interface CaseUpdateInput {
    title?: string;
    description?: string;
    caseType?: string;
    status?: string;
    priority?: string;
    hierarchyEntityId?: string;
    assignedOfficerId?: string;
    updatedByUserId?: string;
    updatedByOfficerId?: string;
}

// ===== API Functions =====

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        ...options,
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `API ${url} returned ${response.status}`);
    }
    return response.json();
}

/**
 * Fetch paginated list of cases with filtering, sorting, and search.
 */
export async function fetchCases(filters: CasesFilters = {}): Promise<CasesResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.caseType) params.set('caseType', filters.caseType);
    if (filters.assignedUserId) params.set('assignedUserId', filters.assignedUserId);
    if (filters.hierarchyEntityId) params.set('hierarchyEntityId', filters.hierarchyEntityId);
    if (filters.search) params.set('search', filters.search);
    if (filters.fromDate) params.set('fromDate', filters.fromDate);
    if (filters.toDate) params.set('toDate', filters.toDate);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

    const qs = params.toString();
    return apiFetch<CasesResponse>(`/api/cases${qs ? `?${qs}` : ''}`);
}

/**
 * Fetch a single case by ID with full details.
 */
export async function fetchCaseById(id: string): Promise<ApiResponse<CaseItem>> {
    return apiFetch<ApiResponse<CaseItem>>(`/api/cases/${id}`);
}

/**
 * Create a new case.
 */
export async function createCase(input: CaseCreateInput): Promise<ApiResponse<CaseItem>> {
    return apiFetch<ApiResponse<CaseItem>>('/api/cases', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

/**
 * Update an existing case.
 */
export async function updateCase(id: string, input: CaseUpdateInput): Promise<ApiResponse<CaseItem>> {
    return apiFetch<ApiResponse<CaseItem>>(`/api/cases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
}

/**
 * Delete a case.
 */
export async function deleteCase(id: string, deletedByUserId?: string): Promise<ApiResponse<void>> {
    return apiFetch<ApiResponse<void>>(`/api/cases/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ deletedByUserId }),
    });
}

/**
 * Archive a case (status change to ARCHIVED).
 */
export async function archiveCase(id: string, updatedByUserId?: string): Promise<ApiResponse<CaseItem>> {
    return updateCase(id, { status: 'ARCHIVED', updatedByUserId });
}

/**
 * Assign a case to an officer.
 */
export async function assignCase(id: string, assignedOfficerId: string, updatedByUserId?: string): Promise<ApiResponse<CaseItem>> {
    return updateCase(id, { assignedOfficerId, updatedByUserId });
}

// ===== RBAC Permission Check Helpers =====

export const CASE_PERMISSIONS = {
    CREATE: 'cases:create',
    VIEW: 'cases:view',
    EDIT: 'cases:edit',
    DELETE: 'cases:delete',
    ASSIGN: 'cases:assign',
    ARCHIVE: 'cases:archive',
    EXPORT: 'cases:export',
    PRINT: 'cases:print',
} as const;

export type CasePermission = keyof typeof CASE_PERMISSIONS;

// ===== Case Status Workflow =====

export const CASE_STATUS_WORKFLOW = [
    'OPEN',
    'UNDER_REVIEW',
    'UNDER_INVESTIGATION',
    'REFERRED',
    'ON_HOLD',
    'COMPLETED',
    'CLOSED',
    'ARCHIVED',
] as const;

export type CaseStatus = typeof CASE_STATUS_WORKFLOW[number];

export const CASE_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'] as const;
export type CasePriority = typeof CASE_PRIORITIES[number];

// ===== Status Color Map =====

export const STATUS_COLORS: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    UNDER_INVESTIGATION: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    REFERRED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    ON_HOLD: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    CLOSED: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400',
    ARCHIVED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400',
};

export const PRIORITY_COLORS: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
    NORMAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const CASE_TYPES = [
    'جنائي',
    'مرور',
    'مخدرات',
    'أمن عام',
    'الدفاع المدني',
    'حماية المنشآت',
    'المرور',
    'جوازات',
    'أدلة جنائية',
    'آخر',
] as const;