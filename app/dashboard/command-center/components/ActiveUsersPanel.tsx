"use client";

import { Users, UserCheck, Loader2, Clock, MapPin, Shield, Building2 } from 'lucide-react';

interface ActiveUserItem {
    id: string;
    username: string;
    role: string;
    department: string;
    lastActive: string;
    sessionDuration: number;
    ipAddress: string;
    hierarchyLocation?: string;
}

interface ActiveUsersPanelProps {
    users?: ActiveUserItem[];
    isLoading?: boolean;
}

export default function ActiveUsersPanel({ users = [], isLoading = false }: ActiveUsersPanelProps) {
    if (isLoading) {
        return (
            <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm p-6 flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="w-6 h-6 text-[#39ff14] animate-spin mb-2" />
                <span className="text-xs text-gray-500 font-mono">تحميل المستخدمين النشطين...</span>
            </div>
        );
    }

    return (
        <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm tactical-card">
            <div className="p-4 border-b border-[#1a3a2a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#39ff14]" />
                    <h3 className="text-xs font-bold text-white font-mono tracking-wider">المستخدمون النشطون / ACTIVE USERS</h3>
                </div>
                <span className="text-[9px] text-gray-500 font-mono">{users.length} متصل</span>
            </div>

            <div className="max-h-[350px] overflow-y-auto">
                {users.length === 0 ? (
                    <div className="p-6 text-center">
                        <UserCheck className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                        <p className="text-xs text-gray-600">لا يوجد مستخدمون نشطون</p>
                        <p className="text-[10px] text-gray-700 font-mono">NO ACTIVE SESSIONS</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#1a3a2a]/50">
                        {users.map((user) => (
                            <div key={user.id} className="p-3 hover:bg-[#0f1922]/50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/20 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-bold text-[#39ff14]">
                                            {user.username.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-white truncate">{user.username}</span>
                                            <span className="text-[9px] text-gray-500 font-mono">{user.role}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                                            <Building2 className="w-3 h-3" />
                                            <span className="truncate">{user.department}</span>
                                        </div>
                                        {/* Hierarchy Location */}
                                        {user.hierarchyLocation && (
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Shield className="w-2.5 h-2.5 text-[#39ff14]/60" />
                                                <span className="text-[9px] text-gray-600 font-mono truncate">
                                                    {user.hierarchyLocation}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="flex items-center gap-1 text-[9px] text-gray-600">
                                                <Clock className="w-3 h-3" />
                                                {Math.floor(user.sessionDuration / 60)}m session
                                            </span>
                                            <span className="text-[8px] text-gray-700 font-mono">{user.ipAddress}</span>
                                        </div>
                                    </div>
                                    <span className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse shrink-0 mt-2"></span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-[#1a3a2a] text-[9px] text-gray-600 font-mono text-center">
                <span>ACTIVE SESSIONS MONITOR // REAL-TIME // {users.length} CONNECTED</span>
            </div>
        </div>
    );
}