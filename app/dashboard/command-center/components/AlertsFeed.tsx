"use client";

import { Bell, AlertTriangle, Info, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface AlertItem {
    id: string;
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    region: string;
    timestamp: string;
    category: string;
    acknowledged: boolean;
}

interface AlertsFeedProps {
    alerts?: AlertItem[];
    isLoading?: boolean;
    onAcknowledge?: (id: string) => void;
}

const severityConfig = {
    CRITICAL: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'حرج' },
    HIGH: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'عالي' },
    MEDIUM: { icon: Info, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'متوسط' },
    LOW: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'منخفض' },
};

export default function AlertsFeed({ alerts = [], isLoading = false, onAcknowledge }: AlertsFeedProps) {
    if (isLoading) {
        return (
            <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm p-6 flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="w-6 h-6 text-[#39ff14] animate-spin mb-2" />
                <span className="text-xs text-gray-500 font-mono">تحميل التنبيهات...</span>
            </div>
        );
    }

    const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;

    return (
        <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm tactical-card">
            <div className="p-4 border-b border-[#1a3a2a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#39ff14]" />
                    <h3 className="text-xs font-bold text-white font-mono tracking-wider">التنبيهات الحية / LIVE ALERTS</h3>
                </div>
                <div className="flex items-center gap-2">
                    {criticalCount > 0 && (
                        <span className="text-[10px] font-mono text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                            {criticalCount} حرجة
                        </span>
                    )}
                    <span className="text-[9px] text-gray-500 font-mono">{alerts.length} تنبيه</span>
                </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
                {alerts.length === 0 ? (
                    <div className="p-6 text-center">
                        <CheckCircle className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                        <p className="text-xs text-gray-600">لا توجد تنبيهات نشطة</p>
                        <p className="text-[10px] text-gray-700 font-mono mt-1">ALL CLEAR - NO ACTIVE ALERTS</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#1a3a2a]/50">
                        {alerts.map((alert) => {
                            const sev = severityConfig[alert.severity];
                            const SevIcon = sev.icon;
                            return (
                                <div
                                    key={alert.id}
                                    className={`p-3 hover:bg-[#0f1922]/50 transition-colors ${!alert.acknowledged ? 'bg-[#39ff14]/[0.02]' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-1.5 rounded ${sev.bg} ${sev.border} border`}>
                                            <SevIcon className={`w-3.5 h-3.5 ${sev.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-white truncate">{alert.title}</span>
                                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${sev.bg} ${sev.color}`}>
                                                    {sev.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-gray-500">{alert.region}</span>
                                                <span className="text-[8px] text-gray-700">|</span>
                                                <span className="text-[10px] text-gray-500">{alert.category}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[9px] text-gray-600 font-mono">
                                                    {new Date(alert.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {!alert.acknowledged && onAcknowledge && (
                                                    <button
                                                        onClick={() => onAcknowledge(alert.id)}
                                                        className="text-[9px] text-[#39ff14] hover:text-white font-mono transition-colors cursor-pointer"
                                                    >
                                                        إقرار
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-[#1a3a2a] text-[9px] text-gray-600 font-mono text-center">
                <span>REAL-TIME ALERT FEED // {alerts.length} ACTIVE</span>
            </div>
        </div>
    );
}