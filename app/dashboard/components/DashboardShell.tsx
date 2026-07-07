"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, usePathname } from 'next/navigation';
import { type SidebarMenuItem } from '@/lib/hierarchy';
import {
  LayoutDashboard, Users, Shield, Key, MapPin, Building2, Building,
  Layers, FileText, Bell, CheckSquare, Archive, File, ClipboardList,
  Activity, Settings, Radio, LogOut, ChevronDown, ChevronRight, Menu, X, User,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Shield, Key, MapPin, Building2, Building,
  Layers, FileText, Bell, CheckSquare, Archive, File, ClipboardList,
  Activity, Settings, Radio, LogOut, User,
};

const ROLE_ARABIC: Record<string, string> = {
  SUPER_ADMIN: 'مدير النظام العام',
  GOVERNORATE_ADMIN: 'مدير المحافظة',
  DEPARTMENT_MANAGER: 'مدير الإدارة',
  SECTION_MANAGER: 'مدير القسم',
  OFFICER: 'ضابط',
  DATA_ENTRY: 'إدخال بيانات',
  VIEW_ONLY: 'عرض فقط',
};

export default function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<SidebarMenuItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('unauthorized');
        const d = await res.json();
        if (!d.user) { router.push('/login'); return; }
        setUser(d.user);
        const { HierarchyEngine } = await import('@/lib/hierarchy');
        const e = new HierarchyEngine({ id: d.user.id, role: d.user.role, hierarchyNodeId: d.user.hierarchyEntityId });
        setMenuItems(e.getSidebarMenu());
      } catch { router.push('/login'); }
      finally { setLoading(false); }
    })();
  }, [router]);

  const toggleExpand = useCallback((href: string) => {
    setExpanded(p => { const n = new Set(p); n.has(href) ? n.delete(href) : n.add(href); return n; });
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-slate-900/60 border-l border-slate-800/80 backdrop-blur-md flex flex-col`}>
        <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500 filter drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]" />
              <span className="text-sm font-bold tracking-wider text-white">NSSCP</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        {sidebarOpen && user && (
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/30">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-500/10 border border-blue-500/25 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate">{user.fullName || user.username}</p>
                <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{ROLE_ARABIC[user.role] || user.role}</p>
              </div>
            </div>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {menuItems.map(item => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const hasChildren = !!(item.children?.length);
            const isExpanded = expanded.has(item.href);
            return (
              <div key={item.href}>
                <button
                  onClick={() => hasChildren ? toggleExpand(item.href) : router.push(item.href)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    active
                      ? "bg-blue-500/10 text-white border-r-2 border-blue-500 shadow-[inset_0_0_12px_rgba(59,130,246,0.08)]"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-right">{item.labelAr}</span>
                      {hasChildren && (isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
                    </>
                  )}
                </button>
                {sidebarOpen && hasChildren && isExpanded && item.children?.map(child => {
                  const CI = ICON_MAP[child.icon] || LayoutDashboard;
                  const childActive = pathname === child.href;
                  return (
                    <button
                      key={child.href}
                      onClick={() => router.push(child.href)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] transition-all duration-300 mr-4 mt-0.5 ${
                        childActive
                          ? "bg-emerald-500/10 text-white border-r-2 border-emerald-500 font-semibold"
                          : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                      }`}
                    >
                      <CI className="h-3.5 h-3.5" />
                      <span>{child.labelAr}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        {sidebarOpen && (
          <div className="p-2 border-t border-slate-800/80">
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-950/20 hover:text-red-200 transition-all font-semibold cursor-pointer">
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج الآمن</span>
            </button>
          </div>
        )}
      </aside>
      <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">{children}</main>
    </div>
  );
}