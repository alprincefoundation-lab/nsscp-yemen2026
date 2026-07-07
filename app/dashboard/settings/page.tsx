"use client";
import React, { useState } from "react";
import { Shield, RefreshCw, Save } from 'lucide-react';
import { useApiData } from '@/hooks/useApiData';

interface Setting { id: string; key: string; value: string; description?: string; }
export default function Page() {
  const { records, isLoading, error, mutate } = useApiData<Setting>('/api/settings');
  const [editing, setEditing] = useState<Record<string, string>>({});
  const handleSave = async (key: string) => {
    try { await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value: editing[key] }) }); mutate(); } catch (err: any) { alert(err.message); }
  };
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4" dir="rtl">
      <div className="bg-card p-4 md:p-6 rounded-xl border border-border flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex items-center gap-3"><Shield className="h-6 w-6 text-primary" /><div><h1 className="text-lg font-bold">الإعدادات العامة للمنظومة</h1><p className="text-xs text-muted-foreground">إعدادات وتكوين النظام المركزي</p></div></div>
        <button onClick={mutate} className="flex items-center gap-1 p-2 rounded-lg border border-border hover:bg-muted"><RefreshCw className="h-4 w-4" /><span className="text-xs">تحديث</span></button>
      </div>
      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-xs">{error}</div>}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        {isLoading ? <div className="text-center py-6"><RefreshCw className="h-5 w-5 animate-spin inline-block" /> جاري التحميل...</div> :
        (records as Setting[]).length === 0 ? <p className="text-center text-muted-foreground text-xs py-6">لا توجد إعدادات</p> :
        (records as Setting[]).map(s => (
          <div key={s.id || s.key} className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg">
            <div className="flex-1"><p className="text-xs font-bold">{s.key}</p>{s.description && <p className="text-[10px] text-muted-foreground">{s.description}</p>}</div>
            <input value={editing[s.key] ?? s.value} onChange={e => setEditing({...editing, [s.key]: e.target.value})} className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background w-48" dir="ltr" />
            <button onClick={() => handleSave(s.key)} disabled={!editing[s.key] || editing[s.key] === s.value} className="p-1.5 rounded hover:bg-primary/20 text-primary disabled:opacity-30"><Save className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}