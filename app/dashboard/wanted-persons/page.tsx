'use client'

import { useState, useCallback, useMemo } from 'react'
import { Shield, Search, Plus, Trash2, Edit3, AlertTriangle, RefreshCw, X } from 'lucide-react'
import { useWanted } from '@/app/dashboard/wanted/hooks/useWanted'
import { Skeleton } from '@/components/ui/skeleton'
import type { WantedPerson, WantedCreateInput, WantedUpdateInput } from '@/app/dashboard/wanted/services/wanted-api'
import { STATUS_LABELS, STATUS_COLORS, DANGER_COLORS, WANTED_STATUSES, DANGER_LEVELS } from '@/app/dashboard/wanted/services/wanted-api'

export default function WantedPersonsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingItem, setEditingItem] = useState<WantedPerson | null>(null)
  const [formData, setFormData] = useState({ fullName: '', status: 'ACTIVE', dangerLevel: 'MEDIUM', notes: '' })

  const { wanted, total, page, totalPages, isLoading, error, filters, setFilters, setPage, refetch, addWanted, editWanted, removeWanted } = useWanted({ page: 1, pageSize: 15 })
  const handleSearch = useCallback(() => setFilters({ search: search || undefined, status: statusFilter || undefined }), [search, statusFilter, setFilters])
  const handleCreate = useCallback(async () => { const r = await addWanted(formData as WantedCreateInput); if (r) { setShowCreate(false); setFormData({ fullName: '', status: 'ACTIVE', dangerLevel: 'MEDIUM', notes: '' }); } }, [formData, addWanted])
  const handleUpdate = useCallback(async () => { if (!editingItem) return; const r = await editWanted({ id: editingItem.id, ...formData } as WantedUpdateInput); if (r) { setEditingItem(null); setFormData({ fullName: '', status: 'ACTIVE', dangerLevel: 'MEDIUM', notes: '' }); } }, [editingItem, formData, editWanted])
  const handleDelete = useCallback(async (id: string) => { if (confirm('متأكد من حذف هذا المطلوب؟')) await removeWanted(id); }, [removeWanted])
  const openEdit = useCallback((item: WantedPerson) => { setEditingItem(item); setFormData({ fullName: `${item.firstName} ${item.lastName}`, status: item.status, dangerLevel: item.dangerLevel || 'MEDIUM', notes: item.notes || '' }); }, [])
  const formatDate = (d: string) => new Date(d).toLocaleDateString('ar-YE', { year: 'numeric', month: 'short', day: 'numeric' })
  const activeCount = useMemo(() => wanted.filter((w) => w.status === 'ACTIVE').length, [wanted])
  const highDangerCount = useMemo(() => wanted.filter((w) => w.dangerLevel === 'HIGH' || w.dangerLevel === 'EXTREME').length, [wanted])

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
            <Shield className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">المطلوبون أمنياً</h1>
            <p className="text-xs text-slate-400">سجل المطلوبين والملاحقة الأمنية</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowCreate(true); setEditingItem(null); setFormData({ fullName: '', status: 'ACTIVE', dangerLevel: 'MEDIUM', notes: '' }); }} className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-400">
            <Plus className="h-4 w-4" />
            إضافة مطلوب
          </button>
          <button onClick={refetch} className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 transition-colors hover:border-slate-600 hover:text-white" title="تحديث">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'إجمالي المطلوبين', value: total },
          { label: 'نشط', value: activeCount, color: 'text-red-300' },
          { label: 'شديد الخطورة', value: highDangerCount, color: 'text-orange-300' },
          { label: 'الصفحة', value: `${page}/${totalPages || 1}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
            <span className="mb-1 block text-xs text-slate-400">{stat.label}</span>
            {isLoading ? <Skeleton className="mt-1 h-7 w-16" /> : <span className={`text-2xl font-bold text-white ${(stat as any).color || ''}`}>{stat.value}</span>}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
            placeholder="بحث بالاسم..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pl-4 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value)
            setFilters({ ...filters, status: event.target.value || undefined })
          }}
          className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-3 text-sm text-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
        >
          <option value="">كل الحالات</option>
          {WANTED_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status] || status}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-300" />
          <div>
            <p className="text-sm font-medium text-red-100">خطأ في تحميل البيانات</p>
            <p className="mt-0.5 text-xs text-red-200/80">{error}</p>
          </div>
          <button onClick={refetch} className="mr-auto rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-100">
            إعادة المحاولة
          </button>
        </div>
      )}

      {isLoading && (
        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/70">
          <div className="space-y-4 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/70">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60">
                  <th className="px-4 py-3 text-right font-medium text-slate-400">الاسم</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">الخطورة</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">تاريخ الإضافة</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {wanted.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      <Shield className="mx-auto mb-3 h-10 w-10 opacity-30" />
                      <p>لا توجد سجلات مطلوبين</p>
                    </td>
                  </tr>
                ) : (
                  wanted.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-medium text-white">
                        {item.firstName} {item.lastName}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[item.status] || 'bg-slate-800 text-slate-300'}`}>
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.dangerLevel ? (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${DANGER_COLORS[item.dangerLevel] || 'bg-slate-800 text-slate-300'}`}>
                            {item.dangerLevel}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(item)} className="rounded-md p-1.5 transition-colors hover:bg-sky-500/10 hover:text-sky-300" title="تعديل">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="rounded-md p-1.5 transition-colors hover:bg-red-500/10 hover:text-red-300" title="حذف">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/50 px-4 py-3">
              <span className="text-xs text-slate-400">إجمالي {total} مطلوب | الصفحة {page} من {totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="rounded-lg border border-slate-800 px-3 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50">
                  السابق
                </button>
                <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="rounded-lg border border-slate-800 px-3 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50">
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(showCreate || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => { setShowCreate(false); setEditingItem(null); }}>
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingItem ? 'تعديل بيانات مطلوب' : 'إضافة مطلوب جديد'}</h2>
              <button onClick={() => { setShowCreate(false); setEditingItem(null); }} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-900 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">الاسم الكامل</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(event) => setFormData((previous) => ({ ...previous, fullName: event.target.value }))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                  placeholder="الاسم الثلاثي"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(event) => setFormData((previous) => ({ ...previous, status: event.target.value }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                  >
                    {WANTED_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">الخطورة</label>
                  <select
                    value={formData.dangerLevel}
                    onChange={(event) => setFormData((previous) => ({ ...previous, dangerLevel: event.target.value }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                  >
                    {DANGER_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(event) => setFormData((previous) => ({ ...previous, notes: event.target.value }))}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={() => { setShowCreate(false); setEditingItem(null); }} className="flex-1 rounded-xl border border-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-900">
                إلغاء
              </button>
              <button onClick={editingItem ? handleUpdate : handleCreate} disabled={!formData.fullName.trim()} className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50">
                {editingItem ? 'حفظ' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
