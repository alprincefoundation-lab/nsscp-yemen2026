"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useCases } from './hooks/useCases';
import { useCase } from './hooks/useCase';
import { CaseTable } from './components/CaseTable';
import { CaseFilters } from './components/CaseFilters';
import { CaseDetails } from './components/CaseDetails';
import { CreateCaseDialog } from './components/CreateCaseDialog';
import { EditCaseDialog } from './components/EditCaseDialog';
import { AssignCaseDialog } from './components/AssignCaseDialog';
import type { CaseItem } from './services/cases-api';

export default function CasesPage() {
  // State
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Data hooks
  const {
    cases,
    total,
    page,
    pageSize,
    totalPages,
    isLoading: isListLoading,
    error: listError,
    filters,
    setFilters,
    setPage,
    refetch: refetchList,
  } = useCases({ page: 1, pageSize: 20, sortBy, sortOrder });

  const {
    caseItem,
    isLoading: isDetailLoading,
    error: detailError,
    refetch: refetchDetail,
    archive: archiveCase,
    assign: assignCaseOp,
  } = useCase(selectedCaseId);

  // Handlers
  const handleCaseClick = useCallback((caseItem: CaseItem) => {
    setSelectedCaseId(prev => prev === caseItem.id ? null : caseItem.id);
  }, []);

  const handleSort = useCallback((field: string) => {
    setSortBy(prev => {
      if (prev === field) {
        setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortOrder('asc');
      return field;
    });
  }, []);

  const handleCreateSuccess = useCallback(() => {
    refetchList();
  }, [refetchList]);

  const handleEditSuccess = useCallback(() => {
    refetchList();
    refetchDetail();
  }, [refetchList, refetchDetail]);

  const handleAssignSuccess = useCallback(() => {
    refetchList();
    refetchDetail();
  }, [refetchList, refetchDetail]);

  const handleEdit = useCallback(() => {
    setShowEditDialog(true);
  }, []);

  const handleAssign = useCallback(() => {
    setShowAssignDialog(true);
  }, []);

  const handleClose = useCallback(async () => {
    if (selectedCaseId && confirm('هل أنت متأكد من إغلاق هذه القضية؟')) {
      const updated = await assignCaseOp(selectedCaseId, '');
      if (updated) {
        refetchList();
        refetchDetail();
      }
    }
  }, [selectedCaseId, assignCaseOp, refetchList, refetchDetail]);

  const handleArchive = useCallback(async () => {
    if (selectedCaseId && confirm('هل أنت متأكد من أرشفة هذه القضية؟')) {
      const archived = await archiveCase();
      if (archived) {
        refetchList();
        refetchDetail();
      }
    }
  }, [selectedCaseId, archiveCase, refetchList, refetchDetail]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleGenerateReport = useCallback(() => {
    // Placeholder for report generation
    alert('سيتم تفعيل إنشاء التقارير قريباً');
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            إدارة القضايا
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            إدارة ومتابعة القضايا الجنائية
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            قضية جديدة
          </button>
        </div>
      </div>

      {/* Filters */}
      <CaseFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Main Content: Table + Detail Panel */}
      <div className="grid grid-cols-1 gap-6">
        {/* Error Banner */}
        {listError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">خطأ في تحميل البيانات</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{listError}</p>
            </div>
            <button
              onClick={() => refetchList()}
              className="mr-auto px-3 py-1.5 text-xs bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Cases Table */}
        <CaseTable
          cases={cases}
          isLoading={isListLoading}
          total={total}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPage}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onCaseClick={handleCaseClick}
          selectedCaseId={selectedCaseId}
        />

        {/* Detail Panel */}
        {selectedCaseId && (
          <CaseDetails
            caseItem={caseItem}
            isLoading={isDetailLoading}
            error={detailError}
            onEdit={handleEdit}
            onAssign={handleAssign}
            onClose={handleClose}
            onArchive={handleArchive}
            onPrint={handlePrint}
            onGenerateReport={handleGenerateReport}
          />
        )}
      </div>

      {/* Dialogs */}
      <CreateCaseDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditCaseDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSuccess={handleEditSuccess}
        caseItem={caseItem}
      />

      <AssignCaseDialog
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        onSuccess={handleAssignSuccess}
        caseItem={caseItem}
      />
    </div>
  );
}