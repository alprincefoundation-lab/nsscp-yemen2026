"use client";
import React, { useState } from "react";
import { Shield, Activity, Plus, Pencil, Trash2, RefreshCw, Search } from 'lucide-react';
import { useApiData, apiCreate, apiUpdate, apiDelete } from '@/hooks/useApiData';

interface OfficerRecord {
  id: string; fullName: string; badgeNumber: string; rank: string;
  title?: string; hierarchyEntityId?: string;
  hierarchyEntity?: { id: string; name: string; type: string };
  createdAt: string;
}

export default function Page() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OfficerRecord | null>(null);
  const [form, setForm] = useState({ fullName: '', badgeNumber: '', rank: '', title: '', hierarchyEntityId: '' });

  const { records, total, totalPages, isLoading, error, mutate } = useApiData<OfficerRecord>(
    '/api/officers', { page, pageSize: 20, search: search || undefined }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiUpdate('/api/officers', { id: editing.id, ...form });
      } else {
        await apiCreate('/api/officers', form);
      }
      setShowForm(false); setEditing(null);
      setForm({ fullName: '', badgeNumber: '', rank: '', title: '', hierarchyEntityId: '' });
      mutate();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('تأكيد الحذف؟')) return;
    try { await apiDelete('/api/officers', id); mutate(); } catch (err: any) { alert(err.message); }
  };

  const openEdit = (r: OfficerRecord) => {
    setEditing(r);
    setForm({ fullName: r.fullName, badgeNumber: r.badgeNumber, rank: r.rank, title: r.title || '', hierarchyEntityId: r.hierarchyEntityId || '' });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4" dir="rtl">
      <div className="bg-card p-4 md:p-6 rounded-xl border border-border flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div><h1 className="text-lg font-bold">سجل الضباط والأفراد</h1><p className="text-xs text-muted-foreground">إدارة كامل سجل الكادر الأمني</p></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative"><Search className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="بحث..." className="pl-3 pr-8 py-1.5 text-xs rounded-lg border border-border bg-background w-48" /></div>
          <button onClick={mutate} className="p-2 rounded-lg border border-border hover:bg-muted" title="تحديث"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => { setEditing(null); setForm({ fullName: '', badgeNumber: '', rank: '', title: '', hierarchyEntityId: '' }); setShowForm(true); }} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground"><Plus className="h-3 w-3" />إضافة</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card p-4 rounded-xl border border-border">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="الاسم الكامل" className="px-3 py-2 text-xs rounded-lg border border-border bg-background" />
            <input required value={form.badgeNumber} onChange={e => setForm({...form, badgeNumber: e.target.value})} placeholder="الرقم العسكري" className="px-3 py-2 text-xs rounded-lg border border-border bg-background" />
            <input required value={form.rank} onChange={e => setForm({...form, rank: e.target.value})} placeholder="الرتبة" className="px-3 py-2 text-xs rounded-lg border border-border bg-background" />
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="المسمى الوظيفي" className="px-3 py-2 text-xs rounded-lg border border-border bg-background" />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground">{editing ? 'تحديث' : 'حفظ'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-xs rounded-lg border border-border">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-xs">{error}</div>}

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 border-b border-border"><tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الرقم العسكري</th><th className="p-3 text-right">الرتبة</th><th className="p-3 text-right">المسمى</th><th className="p-3 text-right">الإجراءات</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground"><RefreshCw className="h-5 w-5 animate-spin inline-block" /> جاري التحميل...</td></tr> :
             records.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">لا توجد سجلات</td></tr> :
             records.map(r => (
              <tr key={r.id} className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium">{r.fullName}</td>
                <td className="p-3 font-mono">{r.badgeNumber}</td>
                <td className="p-3">{r.rank}</td>
                <td className="p-3 text-muted-foreground">{r.title || '-'}</td>
                <td className="p-3"><div className="flex gap-1"><button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-3 w-3" /></button><button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-destructive/20 text-destructive"><Trash2 className="h-3 w-3" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="p-3 flex items-center justify-between border-t border-border text-xs">
            <span>{total} سجل</span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`px-2 py-1 rounded ${page === i + 1 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}