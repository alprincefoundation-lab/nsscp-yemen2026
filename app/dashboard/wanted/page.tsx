"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Shield, Search, Plus, Trash2, Edit3, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useWanted } from './hooks/useWanted';
import { Skeleton } from '@/components/ui/skeleton';
import type { WantedPerson, WantedCreateInput, WantedUpdateInput } from './services/wanted-api';
import { STATUS_LABELS, STATUS_COLORS, DANGER_COLORS, WANTED_STATUSES, DANGER_LEVELS } from './services/wanted-api';

export default function WantedPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<WantedPerson | null>(null);
  const [formData, setFormData] = useState({ fullName: '', status: 'ACTIVE', dangerLevel: 'MEDIUM', notes: '' });

  const { wanted, total, page, pageSize, totalPages, isLoading, error, filters, setFilters, setPage, refetch, addWanted, editWanted, removeWanted } = useWanted({ page: 1, pageSize: 15 });
  const handleSearch = useCallback(() => setFilters({ search: search || undefined, status: statusFilter || undefined }), [search, statusFilter, setFilters]);
  const handleCreate = useCallback(async () => { const r = await addWanted(formData as WantedCreateInput); if (r) { setShowCreate(false); setFormData({ fullName: '', status: 'ACTIVE', dangerLevel: 'MEDIUM', notes: '' }); } }, [formData, addWanted]);
  const handleUpdate = useCallback(async () => { if (!editingItem) return; const r = await editWanted({ id: editingItem.id, ...formData } as WantedUpdateInput); if (r) { setEditingItem(null); setFormData({ fullName: '', status: 'ACTIVE', dangerLevel: 'MEDIUM', notes: '' }); } }, [editingItem, formData, editWanted]);
  const handleDelete = useCallback(async (id: string) => { if (confirm('متأكد من حذف هذا المطلوب؟')) await removeWanted(id); }, [removeWanted]);
  const openEdit = useCallback((item: WantedPerson) => { setEditingItem(item); setFormData({ fullName: `${item.firstName} ${item.lastName}`, status: item.status, dangerLevel: item.dangerLevel || 'MEDIUM', notes: item.notes || '' }); }, []);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('ar-YE', { year: 'numeric', month: 'short', day: 'numeric' });
  const activeCount = wanted.filter(w => w.status === 'ACTIVE').length;
  const highDangerCount = wanted.filter(w => w.dangerLevel === 'HIGH' || w.dangerLevel === 'EXTREME').length;

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center"><Shield className="h-5 w-5 text-red-500" /></div>
          <div><h1 className="text-xl font-bold text-gray-900 dark:text-white">المطلوبين أمنياً</h1><p className="text-xs text-gray-500 dark:text-gray-400">سجل المطلوبين والملاحقة الأمنية</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowCreate(true); setEditingItem(null); setFormData({ fullName: '', status: 'ACTIVE', dangerLevel: 'MEDIUM', notes: '' }); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" />إضافة مطلوب</button>
          <button onClick={refetch} className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm" title="تحديث"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'إجمالي المطلوبين', value: total }, { label: 'نشط', value: activeCount, color: 'text-red-600' }, { label: 'شديد الخطورة', value: highDangerCount, color: 'text-orange-600' }, { label: 'الصفحة', value: `${page}/${totalPages || 1}` }].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 block mb-1">{stat.label}</span>
            {isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : <span className={`text-2xl font-bold ${(stat as any).color || 'text-gray-900 dark:text-white'}`}>{stat.value}</span>}
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="بحث بالاسم..." className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-900 border rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 outline-none" /></div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setFilters({ ...filters, status: e.target.value || undefined }); }} className="px-3 py-2.5 bg-white dark:bg-gray-900 border rounded-lg text-sm"><option value="">كل الحالات</option>{WANTED_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}</select>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div><p className="text-sm font-medium text-red-800 dark:text-red-300">خطأ في تحميل البيانات</p><p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p></div>
          <button onClick={refetch} className="mr-auto px-3 py-1.5 text-xs bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 rounded-md">إعادة المحاولة</button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4"><Skeleton className="h-5 w-5 rounded-full" /><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-24" /></div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"><th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">الاسم</th><th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">الحالة</th><th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">الخطورة</th><th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">تاريخ الإضافة</th><th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">إجراءات</th></tr></thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {wanted.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500"><Shield className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>لا توجد سجلات مطلوبين</p></td></tr>
                ) : wanted.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium">{item.firstName} {item.lastName}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[item.status] || ''}`}>{STATUS_LABELS[item.status] || item.status}</span></td>
                    <td className="px-4 py-3">{item.dangerLevel ? <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${DANGER_COLORS[item.dangerLevel] || ''}`}>{item.dangerLevel}</span> : '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => openEdit(item)} className="p-1.5 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md" title="تعديل"><Edit3 className="w-4 h-4" /></button><button onClick={() => handleDelete(item.id)} className="p-1.5 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="حذف"><Trash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs text-gray-600 dark:text-gray-400">إجمالي {total} مطلوب | الصفحة {page} من {totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-3 py-1 text-xs border rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700">السابق</button>
                <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1 text-xs border rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700">التالي</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {(showCreate || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowCreate(false); setEditingItem(null); }}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border w-full max-w-md mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingItem ? 'تعديل بيانات مطلوب' : 'إضافة مطلوب جديد'}</h2>
              <button onClick={() => { setShowCreate(false); setEditingItem(null); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1">الاسم الكامل</label><input type="text" value={formData.fullName} onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 outline-none" placeholder="الاسم الثلاثي" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">الحالة</label><select value={formData.status} onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm">{WANTED_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
                <div><label className="block text-xs font-medium mb-1">الخطورة</label><select value={formData.dangerLevel} onChange={(e) => setFormData(p => ({ ...p, dangerLevel: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm">{DANGER_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-medium mb-1">ملاحظات</label><textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm resize-none" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowCreate(false); setEditingItem(null); }} className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">إلغاء</button>
              <button onClick={editingItem ? handleUpdate : handleCreate} disabled={!formData.fullName.trim()} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">{editingItem ? 'حفظ' : 'إضافة'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
