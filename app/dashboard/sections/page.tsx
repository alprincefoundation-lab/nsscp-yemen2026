"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Layers, RefreshCw } from 'lucide-react';

export default function SectionsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/sections').then(r => r.json()).then(d => { setData(d.sections || d.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6" dir="rtl">
      <div className="bg-card p-6 rounded-xl border border-border flex justify-between items-center">
        <Layers className="h-8 w-8 text-primary" />
        <div><h1 className="text-xl font-black text-foreground">الأقسام</h1><p className="text-xs text-muted-foreground">إدارة الأقسام والشعب</p></div>
        <div className="bg-muted px-4 py-2 rounded border border-border"><span className="text-xs text-primary">نظام هرمي</span></div>
      </div>
      <div className="bg-card p-6 rounded-xl border border-border">
        {loading ? (
          <div className="flex items-center justify-center py-12"><RefreshCw className="h-8 w-8 text-primary animate-spin" style={{ animationDuration: '3s' }} /></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-right p-2">الاسم</th><th className="text-right p-2">الإدارة</th><th className="text-right p-2">الوصف</th>
            </tr></thead>
            <tbody>{data.map((item: any) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50">
                <td className="p-2">{item.name}</td>
                <td className="p-2 text-muted-foreground">{item.parent?.name || '—'}</td>
                <td className="p-2 text-muted-foreground">{item.description || '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
