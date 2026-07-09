"use client";

import { useEffect, useState } from "react";
import CallPanel from "@/components/tactical-ui/call-panel";
import DepartmentsGrid from "@/components/tactical-ui/departments-grid";
import Header from "@/components/tactical-ui/header";
import type { Breadcrumb } from "@/components/tactical-ui/breadcrumb";
import LiveMap from "@/components/live-map";
import MainNav from "@/components/tactical-ui/main-nav";
import MetricsDashboard from "@/components/tactical-ui/metrics-dashboard";
import OrgChart from "@/components/tactical-ui/org-chart";
import ProvincesGrid from "@/components/provinces-grid";

// ─── Types ──────────────────────────────────────────────────────────

interface TacticalData {
    metrics: MetricsData;
    emergencyCalls: EmergencyCallData[];
    mapMarkers: MapMarkerData[];
    departments: DepartmentData[];
    provinces: ProvinceData[];
    orgChart: OrgChartData | null;
}

interface MetricsData {
    activeReports: number;
    averageResponseMinutes: number;
    averageResponseSeconds: number;
    completionRate: number;
    availablePatrols: number;
    activeOperations: number;
    totalOfficers: number;
    totalDepartments: number;
    reportDistribution: {
        security: number;
        traffic: number;
        health: number;
    };
    activeOperationsList: OperationItem[];
}

interface OperationItem {
    id: string;
    type: string;
    description: string;
    status: string;
    time: string;
    location: string;
}

interface EmergencyCallData {
    id: string;
    phone: string;
    name: string;
    language: string;
    type: string;
    description: string;
    location: string;
    status: string;
    time: string;
    priority: string;
}

interface MapMarkerData {
    id: string;
    lat: number;
    lng: number;
    type: "report" | "ambulance" | "fire" | "police";
    name: string;
    distance: string;
}

interface DepartmentData {
    id: string;
    name: string;
    description: string;
    icon: string;
    status: "active" | "maintenance" | "inactive";
    staff: number;
    reports: number;
    efficiency: number;
}

interface ProvinceData {
    id: string;
    nameAr: string;
    nameEn: string;
    activeReports: number;
    onDutyOfficers: number;
    responseTime: string;
    status: "active" | "warning" | "critical";
}

interface OrgChartData {
    id: string;
    name: string;
    title: string;
    level: number;
    children?: OrgChartData[];
    link?: string;
}

// ─── Loading Skeleton ───────────────────────────────────────────────

function LoadingSkeleton() {
    return (
        <div className="w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="bg-card border border-border/50 rounded-xl p-6 animate-pulse"
                    >
                        <div className="h-4 bg-border/30 rounded w-1/2 mb-4" />
                        <div className="h-8 bg-border/30 rounded w-1/3 mb-2" />
                        <div className="h-3 bg-border/30 rounded w-2/3" />
                    </div>
                ))}
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-border/30 rounded w-1/4 mb-4" />
                <div className="h-64 bg-border/20 rounded" />
            </div>
        </div>
    );
}

// ─── Main Page Component ────────────────────────────────────────────

export default function TacticalDashboardPage() {
    const [data, setData] = useState<TacticalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<
        "all" | "metrics" | "map" | "departments" | "provinces" | "org" | "calls"
    >("all");

    useEffect(() => {
        fetchTacticalData();
    }, []);

    async function fetchTacticalData() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/tactical-dashboard");
            const json = await res.json();

            if (!json.success) {
                setError(json.error || "فشل جلب البيانات");
                return;
            }

            setData(json.data);
        } catch (err) {
            console.error("Tactical dashboard fetch error:", err);
            setError("حدث خطأ أثناء جلب البيانات من الخادم");
        } finally {
            setLoading(false);
        }
    }

    // ─── Render ────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-background" dir="rtl">
            {/* Main Navigation */}
            <MainNav />

            {/* Header */}
            <Header
                title="لوحة القيادة التكتيكية"
                subtitle="مركز العمليات الذكي — إدارة البلاغات والموارد الميدانية"
                showBackButton={false}
            />

            {/* Breadcrumb + Refresh */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-4">
                <div className="flex items-center justify-between">
                    <Breadcrumb
                        items={[
                            { label: "الرئيسية", href: "/" },
                            { label: "لوحة القيادة", href: "/dashboard" },
                            { label: "المركز التكتيكي" },
                        ]}
                    />
                    <button
                        onClick={fetchTacticalData}
                        disabled={loading}
                        className="px-3 py-1.5 text-sm bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                        {loading ? "⏳ جاري التحديث..." : "🔄 تحديث البيانات"}
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-4">
                <div className="flex flex-wrap gap-2 border-b border-border/50 pb-2">
                    {(
                        [
                            { key: "all", label: "📊 الكل" },
                            { key: "metrics", label: "📈 المؤشرات" },
                            { key: "calls", label: "📞 البلاغات" },
                            { key: "map", label: "🗺️ الخريطة" },
                            { key: "departments", label: "🏢 الإدارات" },
                            { key: "provinces", label: "📍 المحافظات" },
                            { key: "org", label: "🏛️ الهيكل" },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-border/10 text-foreground/70 hover:bg-border/30"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
                {loading && <LoadingSkeleton />}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                        <p className="text-red-500 text-lg mb-2">⚠️ {error}</p>
                        <button
                            onClick={fetchTacticalData}
                            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                            إعادة المحاولة
                        </button>
                    </div>
                )}

                {data && !loading && (
                    <>
                        {/* Metrics Dashboard — always shown */}
                        {(activeTab === "all" || activeTab === "metrics") && (
                            <section>
                                <MetricsDashboard
                                    externalMetrics={{
                                        activeReports: data.metrics.activeReports,
                                        averageResponseMinutes: data.metrics.averageResponseMinutes,
                                        averageResponseSeconds: data.metrics.averageResponseSeconds,
                                        completionRate: data.metrics.completionRate,
                                        availablePatrols: data.metrics.availablePatrols,
                                    }}
                                    externalDistribution={data.metrics.reportDistribution}
                                    externalOperations={data.metrics.activeOperationsList}
                                />
                            </section>
                        )}

                        {/* Call Panel — emergency calls */}
                        {(activeTab === "all" || activeTab === "calls") && (
                            <section>
                                <CallPanel externalCalls={data.emergencyCalls} />
                            </section>
                        )}

                        {/* Live Map */}
                        {(activeTab === "all" || activeTab === "map") && (
                            <section>
                                <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                                        <div className="w-1 h-4 bg-[#00e5ff] rounded-full" />
                                        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
                                            الخريطة التكتيكية الحية
                                        </h2>
                                        <span className="text-xs text-foreground/60 font-mono ml-auto">
                                            LIVE MAP
                                        </span>
                                    </div>
                                    <div className="h-[500px]">
                                        <LiveMap externalData={data.mapMarkers} />
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Departments Grid */}
                        {(activeTab === "all" || activeTab === "departments") && (
                            <section>
                                <DepartmentsGrid externalDepartments={data.departments} />
                            </section>
                        )}

                        {/* Provinces Grid */}
                        {(activeTab === "all" || activeTab === "provinces") && (
                            <section>
                                <ProvincesGrid externalProvinces={data.provinces} />
                            </section>
                        )}

                        {/* Org Chart */}
                        {(activeTab === "all" || activeTab === "org") && (
                            <section>
                                <div className="w-full space-y-4">
                                    <h2 className="text-2xl font-bold text-foreground">
                                        الهيكل التنظيمي
                                    </h2>
                                    <OrgChart externalOrgData={data.orgChart} />
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}