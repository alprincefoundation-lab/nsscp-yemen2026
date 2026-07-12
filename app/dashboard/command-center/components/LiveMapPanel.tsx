"use client";

import { MapPin, Loader2, Layers, Target } from 'lucide-react';

interface LiveMapPanelProps {
    isLoading?: boolean;
    governorates?: { id: string; name: string; status: 'ACTIVE' | 'STANDBY' | 'ALERT' | 'OFFLINE' }[];
}

export default function LiveMapPanel({ isLoading = false, governorates = [] }: LiveMapPanelProps) {
    if (isLoading) {
        return (
            <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm p-6 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin mb-3" />
                <span className="text-xs text-gray-500 font-mono">جاري تحميل الخريطة الحية...</span>
            </div>
        );
    }

    return (
        <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm tactical-card">
            <div className="p-4 border-b border-[#1a3a2a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#39ff14]" />
                    <h3 className="text-xs font-bold text-white font-mono tracking-wider">الخريطة الحية / LIVE MAP</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 font-mono flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        LIVE DATA
                    </span>
                </div>
            </div>

            <div className="p-6 min-h-[400px] relative">
                <div className="absolute inset-0 tactical-grid-bg opacity-30"></div>
                <div className="scanline"></div>

                <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[350px]">
                    <div className="text-center max-w-md">
                        <div className="relative inline-block mb-4">
                            <MapPin className="w-16 h-16 text-[#39ff14]/20 mx-auto" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Target className="w-8 h-8 text-[#39ff14]/40" />
                            </div>
                        </div>

                        <h4 className="text-sm font-bold text-gray-400 mb-2 font-mono tracking-wider">
                            GOVERNORATE STATUS OVERVIEW
                        </h4>
                        <p className="text-[11px] text-gray-600 leading-relaxed mb-4">
                            تعرض هذه اللوحة الحالة التشغيلية الحالية للمحافظات والمدن عبر البيانات الفعلية المتوفرة في النظام.
                        </p>

                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a3a2a]/30 border border-[#39ff14]/10 text-[10px] text-gray-500 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            CONNECTED TO LIVE GOVERNORATE DATA
                        </div>
                    </div>

                    {/* Governorate Status Overview */}
                    {governorates.length > 0 && (
                        <div className="w-full mt-6 pt-4 border-t border-[#1a3a2a]/50">
                            <div className="text-[9px] text-gray-600 font-mono mb-2 text-center">
                                GOVERNORATE STATUS OVERVIEW
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {governorates.map((gov) => (
                                    <div
                                        key={gov.id}
                                        className="p-2 bg-[#0f1922] border border-[#1a3a2a] rounded text-center"
                                    >
                                        <span className="block text-[10px] text-gray-300 font-medium truncate">{gov.name}</span>
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1 ${gov.status === 'ACTIVE' ? 'bg-[#39ff14]' :
                                                gov.status === 'STANDBY' ? 'bg-amber-500' :
                                                    gov.status === 'ALERT' ? 'bg-red-500' : 'bg-gray-600'
                                            }`}></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Footer */}
                <div className="relative z-10 mt-4 pt-3 border-t border-[#1a3a2a] flex justify-between text-[9px] text-gray-600 font-mono">
                    <span>GRID: YEMEN SOVEREIGN TERRITORY</span>
                    <span>{governorates.length} GOVERNORATES</span>
                </div>
            </div>
        </div>
    );
}
