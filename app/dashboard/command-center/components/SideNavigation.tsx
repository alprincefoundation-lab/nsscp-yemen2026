"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

import {
    LayoutDashboard,
    Map,
    Bell,
    Users,
    Activity,
    ListChecks,
    FileText,
    ChevronLeft,
    Menu,
    X,
} from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    section: string;
}

interface SideNavigationProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

const navItems: NavItem[] = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard, section: 'overview' },
    { id: 'map', label: 'الخريطة الحية', icon: Map, section: 'map' },
    { id: 'alerts', label: 'التنبيهات', icon: Bell, section: 'alerts' },
    { id: 'hierarchy', label: 'التدرج الهرمي', icon: ListChecks, section: 'hierarchy' },
    { id: 'users', label: 'المستخدمون النشطون', icon: Users, section: 'users' },
    { id: 'audit', label: 'سجل التدقيق', icon: FileText, section: 'audit' },
    { id: 'actions', label: 'إجراءات سريعة', icon: Activity, section: 'actions' },
];

export default function SideNavigation({ activeSection, onSectionChange }: SideNavigationProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleNavClick = (section: string) => {
        onSectionChange(section);
        setIsMobileOpen(false);
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="fixed bottom-4 right-4 z-50 md:hidden w-12 h-12 rounded-full bg-[#0a1214] border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14] shadow-xl"
                aria-label="Toggle navigation"
            >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Desktop Sidebar */}
            <aside
                className={`hidden md:flex flex-col bg-[#0a1214] border-l border-[#1a3a2a] transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-56'}`}
            >
                {/* Toggle Collapse */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-3 border-b border-[#1a3a2a] flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                    aria-label="Toggle sidebar"
                >
                    <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>

                {/* Navigation Items */}
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.section;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.section)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold transition-all cursor-pointer
                                    ${isActive
                                        ? 'bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/30'
                                        : 'text-gray-400 hover:bg-[#1a3a2a]/30 hover:text-gray-200 border border-transparent'
                                    }
                                    ${isCollapsed ? 'justify-center px-0' : ''}
                                `}
                                title={item.label}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer Status */}
                <div className="p-3 border-t border-[#1a3a2a] text-[8px] text-gray-600 font-mono text-center">
                    {!isCollapsed && <span>NSSCP CMD CENTER v1</span>}
                </div>
            </aside>

            {/* Mobile Drawer Overlay */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-40 md:hidden bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}>
                    <div
                        className="absolute right-0 top-0 bottom-0 w-64 bg-[#0a1214] border-l border-[#1a3a2a] p-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1a3a2a]">
                            <span className="text-xs font-bold text-white">القائمة</span>
                            <button onClick={() => setIsMobileOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeSection === item.section;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavClick(item.section)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold transition-all cursor-pointer
                                            ${isActive ? 'bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/30' : 'text-gray-400 hover:bg-[#1a3a2a]/30 hover:text-gray-200 border border-transparent'}
                                        `}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}