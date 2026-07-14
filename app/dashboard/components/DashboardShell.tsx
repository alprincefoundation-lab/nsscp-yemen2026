"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Shield, Key, Building2, Layers,
  FileText, Archive, ClipboardList, Activity, Settings, Radio,
  LogOut, ChevronDown, ChevronRight, Menu, X, User,
  Bell, Map, Car, Briefcase, Database, AlertTriangle, Globe,
  Lock, FileSearch, BarChart3, Siren, Plane, Ship, Building,
  UserCheck, Eye, Edit, Trash2, Gavel, Target, Crosshair,
} from 'lucide-react';
import { Role, hasPermission, Permission } from '@/lib/permissions';

type SidebarMenuItem = {
  label: string;
  labelAr: string;
  href: string;
  icon: string;
  permission?: Permission;
  children?: SidebarMenuItem[];
  badge?: string;
  roles?: Role[];
};

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Shield, Key, Building2, Layers,
  FileText, Archive, ClipboardList, Activity, Settings, Radio,
  LogOut, User, Bell, Map, Car, Briefcase, Database, AlertTriangle,
  Globe, Lock, FileSearch, BarChart3, Siren, Gavel, Target, Crosshair,
  ChevronDown, ChevronRight, Menu, X, Eye, Edit, Trash2, Plane, Ship, Building,
  UserCheck,
};

const ROLE_ARABIC: Record<string, string> = {
  SUPER_ADMIN: 'مدير النظام العام',
  MINISTRY_ADMIN: 'مدير الوزارة',
  GOVERNORATE_ADMIN: 'مدير المحافظة',
  DEPARTMENT_HEAD: 'مدير الإدارة',
  SECTION_HEAD: 'مدير القسم',
  UNIT_HEAD: 'مدير الوحدة',
  OFFICER: 'ضابط',
  VIEWER: 'مشاهد فقط',
  // Legacy
  DEPARTMENT_MANAGER: 'مدير الإدارة',
  SECTION_MANAGER: 'مدير القسم',
  DATA_ENTRY: 'إدخال بيانات',
  VIEW_ONLY: 'عرض فقط',
};

const VIEWER_ROLES: Role[] = [Role.VIEW_ONLY];
const OFFICER_ROLES: Role[] = [Role.OFFICER, Role.DATA_ENTRY, Role.SECTION_MANAGER, Role.DEPARTMENT_MANAGER, Role.GOVERNORATE_ADMIN, Role.SUPER_ADMIN];
const MANAGER_ROLES: Role[] = [Role.DEPARTMENT_MANAGER, Role.SECTION_MANAGER, Role.GOVERNORATE_ADMIN, Role.SUPER_ADMIN];
const ADMIN_ROLES: Role[] = [Role.GOVERNORATE_ADMIN, Role.SUPER_ADMIN];
const SUPER_ONLY: Role[] = [Role.SUPER_ADMIN];

function buildMenuItems(role: string): SidebarMenuItem[] {
  const allItems: SidebarMenuItem[] = [
    // ─── MAIN ─────────────────────────────────────────
    { label: 'الرئيسية', labelAr: 'الرئيسية', href: '/dashboard', icon: 'LayoutDashboard', roles: [...VIEWER_ROLES, ...OFFICER_ROLES] },
    
    // ─── COMMAND & CONTROL ────────────────────────────
    { label: 'مركز القيادة', labelAr: 'مركز القيادة', href: '/dashboard/command-center', icon: 'Radio', permission: Permission.VIEW_STATISTICS, roles: [...OFFICER_ROLES] },
    { label: 'غرفة العمليات التكتيكية', labelAr: 'غرفة العمليات', href: '/dashboard/tactical', icon: 'Target', permission: Permission.READ_CASE, roles: [...OFFICER_ROLES] },
    { label: 'العمليات', labelAr: 'العمليات', href: '/dashboard/operations', icon: 'Activity', permission: Permission.READ_CASE, roles: [...OFFICER_ROLES] },
    { label: 'مركز العمليات الأمنية', labelAr: 'SOC', href: '/dashboard/soc', icon: 'Siren', permission: Permission.VIEW_STATISTICS, roles: [...MANAGER_ROLES] },

    // ─── CASES & INVESTIGATIONS ───────────────────────
    { label: 'القضايا', labelAr: 'القضايا', href: '/dashboard/cases', icon: 'Gavel', permission: Permission.READ_CASE, roles: [...OFFICER_ROLES] },
    { label: 'التحقيقات الجنائية', labelAr: 'التحقيقات', href: '/dashboard/criminalinvestigation', icon: 'FileSearch', permission: Permission.READ_CASE, roles: [...OFFICER_ROLES] },
    { label: 'الأدلة والمختبر', labelAr: 'الأدلة', href: '/dashboard/evidence', icon: 'Briefcase', permission: Permission.READ_EVIDENCE, roles: [...OFFICER_ROLES] },
    { label: 'الطب الشرعي', labelAr: 'الطب الشرعي', href: '/dashboard/forensic', icon: 'Crosshair', permission: Permission.READ_EVIDENCE, roles: [...MANAGER_ROLES] },

    // ─── WANTED PERSONS ───────────────────────────────
    { label: 'المطلوبون أمنياً', labelAr: 'المطلوبون', href: '/dashboard/wanted-persons', icon: 'Shield', permission: Permission.READ_WANTED, roles: [...OFFICER_ROLES] },
    { label: 'النشرات والتعاميم', labelAr: 'النشرات', href: '/dashboard/bulletins', icon: 'AlertTriangle', permission: Permission.READ_WANTED, roles: [...OFFICER_ROLES] },

    // ─── REPORTS ──────────────────────────────────────
    { label: 'التقارير', labelAr: 'التقارير', href: '/dashboard/reports', icon: 'ClipboardList', permission: Permission.READ_REPORT, roles: [...OFFICER_ROLES] },

    // ─── DEPARTMENTS & HIERARCHY ─────────────────────
    { label: 'الإدارات', labelAr: 'الإدارات', href: '/dashboard/departments', icon: 'Building2', permission: Permission.VIEW_HIERARCHY, roles: [...OFFICER_ROLES] },
    { label: 'الهيكل التنظيمي', labelAr: 'الهيكل التنظيمي', href: '/dashboard/hierarchy', icon: 'Layers', permission: Permission.VIEW_HIERARCHY, roles: [...OFFICER_ROLES] },
    { label: 'الأقسام', labelAr: 'الأقسام', href: '/dashboard/sections', icon: 'Building', permission: Permission.VIEW_HIERARCHY, roles: [...MANAGER_ROLES] },
    { label: 'المحافظات', labelAr: 'المحافظات', href: '/dashboard/governorates', icon: 'Globe', permission: Permission.VIEW_HIERARCHY, roles: [...OFFICER_ROLES] },
    { label: 'المديريات', labelAr: 'المديريات', href: '/dashboard/districts', icon: 'Map', permission: Permission.VIEW_HIERARCHY, roles: [...MANAGER_ROLES] },
    { label: 'مراكز الشرطة', labelAr: 'الشرطة', href: '/dashboard/policestations', icon: 'Building2', permission: Permission.VIEW_HIERARCHY, roles: [...OFFICER_ROLES] },
    { label: 'المحطات', labelAr: 'المحطات', href: '/dashboard/stations', icon: 'Map', permission: Permission.VIEW_HIERARCHY, roles: [...MANAGER_ROLES] },

    // ─── ADMINISTRATION ───────────────────────────────
    { label: 'المستخدمون', labelAr: 'المستخدمون', href: '/dashboard/users', icon: 'Users', permission: Permission.READ_USER, roles: [...ADMIN_ROLES] },
    { label: 'الضباط', labelAr: 'الضباط', href: '/dashboard/officers', icon: 'UserCheck', permission: Permission.READ_OFFICER, roles: [...MANAGER_ROLES] },
    {
      label: 'الأدوار والصلاحيات',
      labelAr: 'الأدوار والصلاحيات',
      href: '/dashboard/roles',
      icon: 'Key',
      permission: Permission.MANAGE_ROLES,
      roles: [...SUPER_ONLY],
      children: [
        { label: 'الأدوار', labelAr: 'الأدوار', href: '/dashboard/roles', icon: 'Key', roles: [...SUPER_ONLY] },
        { label: 'الصلاحيات', labelAr: 'الصلاحيات', href: '/dashboard/permissions', icon: 'Shield', roles: [...SUPER_ONLY] },
      ],
    },
    { label: 'الإعدادات', labelAr: 'الإعدادات', href: '/dashboard/settings', icon: 'Settings', permission: Permission.MANAGE_SETTINGS, roles: [...ADMIN_ROLES] },

    // ─── SPECIALIZED UNITS ────────────────────────────
    { label: 'المرور', labelAr: 'المرور', href: '/dashboard/traffic', icon: 'Car', permission: Permission.READ_VEHICLE, roles: [...OFFICER_ROLES] },
    { label: 'المركبات', labelAr: 'المركبات', href: '/dashboard/vehicles', icon: 'Car', permission: Permission.READ_VEHICLE, roles: [...OFFICER_ROLES] },
    { label: 'الجوازات', labelAr: 'الجوازات', href: '/dashboard/passports', icon: 'Plane', permission: Permission.READ_CASE, roles: [...OFFICER_ROLES] },
    { label: 'الدفاع المدني', labelAr: 'الدفاع المدني', href: '/dashboard/civildefense', icon: 'Siren', permission: Permission.READ_CASE, roles: [...OFFICER_ROLES] },
    { label: 'مكافحة المخدرات', labelAr: 'المخدرات', href: '/dashboard/narcotics', icon: 'AlertTriangle', permission: Permission.READ_CASE, roles: [...OFFICER_ROLES] },
    { label: 'السجون', labelAr: 'السجون', href: '/dashboard/prisons', icon: 'Lock', permission: Permission.READ_CASE, roles: [...OFFICER_ROLES] },

    // ─── ARCHIVE ──────────────────────────────────────
    { label: 'الأرشيف', labelAr: 'الأرشيف', href: '/dashboard/archive', icon: 'Archive', permission: Permission.READ_REPORT, roles: [...OFFICER_ROLES] },
  ];

  const userRoleEnum = role as Role;
  return allItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(userRoleEnum);
  });
}

export default function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<SidebarMenuItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<number>(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (!response.ok) throw new Error('unauthorized');
        const data = await response.json();
        if (!data.user) throw new Error('unauthorized');

        setUser(data.user);
        setMenuItems(buildMenuItems(data.user.role));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const toggleExpand = useCallback((href: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      router.replace('/login');
    }
  }, [router]);

  const roleLabel = useMemo(() => {
    if (!user) return '';
    return ROLE_ARABIC[user.role] || user.role;
  }, [user]);

  const isItemActive = useCallback(
    (item: SidebarMenuItem) => {
      const selfActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
      const childActive = item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`));
      return selfActive || Boolean(childActive);
    },
    [pathname],
  );

  // Breadcrumb generation
  const breadcrumbItems = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const items: { label: string; href: string }[] = [];
    let accumulated = '';
    for (const segment of segments) {
      accumulated += `/${segment}`;
      const menuItem = menuItems.find((m) => m.href === accumulated);
      items.push({
        label: segment === 'dashboard' ? 'الرئيسية' : (menuItem?.labelAr || segment),
        href: accumulated,
      });
    }
    return items;
  }, [pathname, menuItems]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* ─── SIDEBAR ─────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} transition-all duration-300 bg-slate-900/80 border-l border-slate-800/80 backdrop-blur-md flex flex-col`}>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <Shield className="h-5 w-5" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.28em] text-emerald-200">NSSCP</p>
                <p className="truncate text-[11px] text-slate-400">Unified Dashboard</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen((previous) => !previous)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {sidebarOpen && user && (
          <div className="border-b border-slate-800/80 bg-slate-900/40 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10">
                <User className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.fullName || user.username}</p>
                <p className="truncate text-[11px] text-slate-400">{roleLabel}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {menuItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            const hasChildren = Boolean(item.children?.length);
            const active = isItemActive(item);
            const isExpanded = expanded.has(item.href) || Boolean(item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`)));

            return (
              <div key={item.href} className="space-y-0.5">
                <button
                  onClick={() => (hasChildren ? toggleExpand(item.href) : router.push(item.href))}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    active
                      ? 'border border-cyan-400/30 bg-cyan-400/10 text-white'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  } ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-right truncate">{item.labelAr}</span>
                      {item.badge && <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                      {hasChildren && (isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />)}
                    </>
                  )}
                </button>

                {sidebarOpen && hasChildren && isExpanded && item.children?.map((child) => {
                  const ChildIcon = ICON_MAP[child.icon] || LayoutDashboard;
                  const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);

                  return (
                    <button
                      key={child.href}
                      onClick={() => router.push(child.href)}
                      className={`mr-4 flex w-[calc(100%-1rem)] items-center gap-2 rounded-lg px-3 py-2 text-[11px] transition-colors ${
                        childActive
                          ? 'border border-emerald-400/25 bg-emerald-400/10 text-white'
                          : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'
                      }`}
                    >
                      <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>{child.labelAr}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────── */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* HEADER */}
        <header className="flex items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-900/85 px-4 py-3 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.12)]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/80">NSSCP</p>
              <h1 className="text-sm font-semibold text-white">المنظومة الوطنية الذكية للأمن والسيطرة</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              className="relative rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </button>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">{user?.fullName || user?.username}</p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </div>
        </header>

        {/* BREADCRUMB */}
        {breadcrumbItems.length > 1 && (
          <nav className="px-6 py-2 border-b border-slate-800/40 bg-slate-900/40">
            <ol className="flex items-center gap-2 text-xs text-slate-400">
              {breadcrumbItems.map((item, index) => (
                <li key={item.href} className="flex items-center gap-2">
                  {index > 0 && <span className="text-slate-600">/</span>}
                  {index < breadcrumbItems.length - 1 ? (
                    <button onClick={() => router.push(item.href)} className="hover:text-cyan-300 transition-colors">
                      {item.label}
                    </button>
                  ) : (
                    <span className="text-slate-200 font-medium">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}