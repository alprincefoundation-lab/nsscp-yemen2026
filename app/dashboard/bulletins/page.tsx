"use client";
import React, { useState } from "react";
import { Shield, Plus, Pencil, Trash2, RefreshCw, Search, FileText } from 'lucide-react';
import { useApiData } from '@/hooks/useApiData';

interface Record { id: string; title: string; content?: string; type?: string; status?: string; priority?: string; createdAt: string; }
export default function Page() {
  const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [selected, setSelected] = useState<Record | null>(null);
  const { records, total, totalPages, isLoading, error, mutate } = useApiData<Record>('/api/bulletins', { page, pageSize: 20, search: search || undefined });
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4" dir="rtl">
      <div className="bg-card p-4 md:p-6 rounded-xl border border-border flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex items-center gap-3"><Shield className="h-6 w-6 text-primary" /><div><h1 className="text-lg font-bold">مركز التعميمات</h1><p className="text-xs text-muted-foreground">التعميمات الأمنية والبلاغات الرسمية</p></div></div>
        <div className="flex items-center gap-2"><div className="relative"><Search className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="بحث..." className="pl-3 pr-8 py-1.5 text-xs rounded-lg border border-border bg-background w-48" /></div><button onClick={mutate} className="p-2 rounded-lg border border-border hover:bg-muted"><RefreshCw className="h-4 w-4" /></button></div>
      </div>
      {selected && (<div className="bg-card p-4 rounded-xl border border-border"><div className="flex items-center justify-between mb-2"><h2 className="font-bold">{selected.title}</h2><button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button></div><p className="text-xs text-muted-foreground whitespace-pre-wrap">{selected.content || 'لا يوجد محتوى'}</p><div className="mt-2 text-xs text-muted-foreground"><span className="ml-3">النوع: {selected.type || '-'}</span><span className="ml-3">الحالة: {selected.status || '-'}</span><span>الأولوية: {selected.priority || '-'}</span></div></div>)}
      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-xs">{error}</div>}
      <div className="bg-card rounded-xl border border-border overflow-x-auto"><table className="w-full text-xs"><thead className="bg-muted/50 border-b border-border"><tr><th className="p-3 text-right">العنوان</th><th className="p-3 text-right">النوع</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">الأولوية</th><th className="p-3 text-right">التاريخ</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={5} className="p-6 text-center"><RefreshCw className="h-4 w-4 animate-spin inline-block" /> جاري التحميل...</td></tr> : records.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">لا توجد تعميمات</td></tr> : records.map(r => (<tr key={r.id} className="border-b border-border hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(r)}><td className="p-3 font-medium flex items-center gap-2"><FileText className="h-3 w-3 text-primary" />{r.title}</td><td className="p-3">{r.type || '-'}</td><td className="p-3">{r.status || '-'}</td><td className="p-3">{r.priority || '-'}</td><td className="p-3 text-muted-foreground">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-YE') : '-'}</td></tr>))}</tbody></table>{totalPages > 1 && (<div className="p-3 flex items-center justify-between border-t border-border text-xs"><span>{total} تعميم</span><div className="flex gap-1">{Array.from({ length: totalPages }, (_, i) => (<button key={i} onClick={() => setPage(i + 1)} className={`px-2 py-1 rounded ${page === i + 1 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{i + 1}</button>))}</div></div>)}</div>
    </div>
  );
}