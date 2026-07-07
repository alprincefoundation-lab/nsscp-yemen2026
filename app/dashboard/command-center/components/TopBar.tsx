"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { Shield, Clock, Wifi, Activity, Bell, RefreshCw, User, ChevronDown, MapPin } from 'lucide-react';

interface TopBarProps {
    title?: string;
    lastUpdated?: string;
    systemStatus?: 'ACTIVE' | 'STANDBY' | 'ALERT';
    userName?: string;
    userRole?: string;
    notificationCount?: number;
    hierarchyScope?: string;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

const statusConfig = {
    ACTIVE: { label: 'نشط', color: 'text-[#39ff14]', bg: 'bg-[#39ff14]/20', border: 'border-[#39ff14]/40' },
    STANDBY: { label: 'استعداد', color: 'text-amber-500', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
    ALERT: { label: 'إنذار', color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/40' },
};

export default function TopBar({
    title = 'مركز القيادة والسيطرة الأمنية',
    lastUpdated,
    systemStatus = 'ACTIVE',
    userName = 'ضابط القيادة',
    userRole = 'قائد المركز',
    notificationCount = 0,
    hierarchyScope = 'الجمهورية اليمنية',
    onRefresh,
    isRefreshing = false,
}: TopBarProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const status = statusConfig[systemStatus];
    const displayTime = lastUpdated
        ? new Date(lastUpdated).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '--:--:--';

    return (
        <header className="bg-[#0a1214] border-b border-[#1a3a2a] px-4 md:px-6 py-2.5 flex items-center justify-between shadow-xl relative z-30">
            {/* Left side: Logo & Title */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-[#39ff14]" />
                </div>
                <div>
                    <h1 className="text-sm md:text-base font-bold text-white tracking-wide">{title}</h1>
                    <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">CENTRAL SECURITY COMMAND CENTER</p>
                </div>
            </div>

            {/* Right side: Status, Scope, Refresh, Notifications, User */}
            <div className="flex items-center gap-2 md:gap-4">
                {/* Hierarchy Scope */}
                <div className="hidden lg:flex items-center gap-1.5 text-gray-400 border-l border-[#1a3a2a] pl-3">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[10px] font-mono text-gray-500">{hierarchyScope}</span>
                </div>

                {/* System Status */}
                <div className={`hidden md:flex items-center gap-2 px-2.5 py-1 rounded border ${status.border} ${status.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.color} animate-pulse`}></span>
                    <span className={`text-[9px] font-mono font-bold ${status.color}`}>{status.label}</span>
                </div>

                {/* Last Updated + Refresh */}
                <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono">{displayTime}</span>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className={`p-1 rounded transition-colors cursor-pointer ${isRefreshing ? 'text-[#39ff14] animate-spin' : 'text-gray-600 hover:text-[#39ff14]'}`}
                            title="تحديث"
                        >
                            <RefreshCw className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Connection Indicator */}
                <div className="flex items-center gap-1.5 text-[#39ff14]/70">
                    <Wifi className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-mono hidden sm:inline">مشفّر</span>
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button className="p-1.5 text-gray-400 hover:text-white transition-colors relative cursor-pointer">
                        <Bell className="w-4 h-4" />
                        {notificationCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                                {notificationCount > 9 ? '9+' : notificationCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#1a3a2a]/30 transition-colors cursor-pointer"
                    >
                        <div className="w-7 h-7 rounded-full bg-[#1a2744] border border-[#1a3a2a] flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-[#39ff14]" />
                        </div>
                        <div className="hidden md:block text-right">
                            <span className="text-[10px] font-bold text-white block leading-tight">{userName}</span>
                            <span className="text-[8px] text-gray-500 font-mono block">{userRole}</span>
                        </div>
                        <ChevronDown className="w-3 h-3 text-gray-500 hidden md:block" />
                    </button>

                    {/* Dropdown */}
                    {showUserMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                            <div className="absolute left-0 top-full mt-1 w-48 bg-[#0a1214] border border-[#1a3a2a] rounded-sm shadow-2xl z-50 py-1">
                                <div className="px-3 py-2 border-b border-[#1a3a2a]">
                                    <span className="text-[10px] text-gray-400 font-mono block">{userName}</span>
                                    <span className="text-[8px] text-gray-600">{userRole}</span>
                                </div>
                                <button className="w-full text-right px-3 py-1.5 text-[10px] text-gray-400 hover:text-white hover:bg-[#1a3a2a]/30 transition-colors cursor-pointer">
                                    الملف الشخصي
                                </button>
                                <button className="w-full text-right px-3 py-1.5 text-[10px] text-gray-400 hover:text-white hover:bg-[#1a3a2a]/30 transition-colors cursor-pointer">
                                    الإعدادات
                                </button>
                                <div className="border-t border-[#1a3a2a] mt-1 pt-1">
                                    <button className="w-full text-right px-3 py-1.5 text-[10px] text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
                                        تسجيل الخروج
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Activity pulse */}
                <Activity className="w-4 h-4 text-[#39ff14] animate-pulse hidden md:block" />
            </div>
        </header>
    );
}