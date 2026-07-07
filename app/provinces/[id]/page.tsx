'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'

export default function ProvinceDetail() {
  const params = useParams()
  const provinceId = params.id as string

  const provinceData: Record<string, any> = {
    'riyadh': {
      nameAr: 'الرياض',
      nameEn: 'Riyadh',
      activeReports: 125,
      onDutyOfficers: 450,
      responseTime: '4:30',
      description: 'المقر الرئيسي للعاصمة والمركز الإداري الأكبر'
    },
    'jeddah': {
      nameAr: 'جدة',
      nameEn: 'Jeddah',
      activeReports: 89,
      onDutyOfficers: 320,
      responseTime: '5:15',
      description: 'المركز الإقليمي الغربي والبوابة السياحية'
    },
    'dammam': {
      nameAr: 'الدمام',
      nameEn: 'Dammam',
      activeReports: 67,
      onDutyOfficers: 280,
      responseTime: '4:45',
      description: 'المركز الإقليمي الشرقي ومنطقة الزيت والصناعة'
    }
  }

  const province = provinceData[provinceId] || {
    nameAr: 'محافظة',
    nameEn: 'Province',
    activeReports: 50,
    onDutyOfficers: 200,
    responseTime: '5:00',
    description: 'مركز إقليمي'
  }

  const [selectedTab, setSelectedTab] = useState<'overview' | 'reports' | 'units' | 'performance'>('overview')

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 md:px-12 py-6 border-b border-border/50 sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Link href="/provinces" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-4">
          <span>←</span>
          <span>العودة إلى المحافظات</span>
        </Link>
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center justify-start flex-shrink-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-FMZYi0WL6JLMKkX7WP94vLkq4tU9xe.png"
              alt="Ministry of Interior"
              width={80}
              height={80}
              className="h-16 w-auto"
            />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">{province.nameAr}</h1>
            <p className="text-foreground/80 text-sm font-semibold mt-1">{province.nameEn}</p>
          </div>

          <div className="flex items-center justify-end flex-shrink-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-wyCF4MHimWpEuWCgujMveUt5HdEcjQ.png"
              alt="National Emblem"
              width={80}
              height={80}
              className="h-16 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full">
          {/* Quick Stats */}
          <div className="bg-card border-b border-border/50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
              <p className="text-foreground/70 mb-6">{province.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-border/20 rounded-lg p-6">
                  <p className="text-xs text-foreground/60 mb-2">البلاغات النشطة</p>
                  <p className="text-3xl font-bold text-primary">{province.activeReports}</p>
                  <p className="text-xs text-foreground/60 mt-2">بلاغ قيد المعالجة</p>
                </div>
                <div className="bg-border/20 rounded-lg p-6">
                  <p className="text-xs text-foreground/60 mb-2">أفراد الخدمة</p>
                  <p className="text-3xl font-bold text-accent">{province.onDutyOfficers}</p>
                  <p className="text-xs text-foreground/60 mt-2">أفراد متاحين الآن</p>
                </div>
                <div className="bg-border/20 rounded-lg p-6">
                  <p className="text-xs text-foreground/60 mb-2">متوسط الاستجابة</p>
                  <p className="text-3xl font-bold text-green-600">{province.responseTime}</p>
                  <p className="text-xs text-foreground/60 mt-2">دقائق</p>
                </div>
                <div className="bg-border/20 rounded-lg p-6">
                  <p className="text-xs text-foreground/60 mb-2">كفاءة الأداء</p>
                  <p className="text-3xl font-bold text-accent">92%</p>
                  <p className="text-xs text-foreground/60 mt-2">معدل الإنجاز</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border/50">
            <div className="max-w-6xl mx-auto px-6 md:px-12 flex gap-8">
              {(['overview', 'reports', 'units', 'performance'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`py-4 px-4 font-medium text-sm md:text-base transition-colors border-b-2 -mb-px ${
                    selectedTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-foreground/60 hover:text-foreground'
                  }`}
                >
                  {tab === 'overview' && 'النظرة العامة'}
                  {tab === 'reports' && 'البلاغات'}
                  {tab === 'units' && 'الوحدات'}
                  {tab === 'performance' && 'الأداء'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
              {selectedTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card border border-border/50 rounded-lg p-6">
                      <h3 className="font-bold text-foreground mb-4">البيانات الأساسية</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-foreground/60">المقر الإقليمي</span>
                          <span className="font-semibold text-foreground">{province.nameAr}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">الوحدات التابعة</span>
                          <span className="font-semibold text-foreground">12</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">الدوريات النشطة</span>
                          <span className="font-semibold text-foreground">28</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">مراكز العمليات</span>
                          <span className="font-semibold text-foreground">4</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card border border-border/50 rounded-lg p-6">
                      <h3 className="font-bold text-foreground mb-4">الحالة الحالية</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          <span className="text-foreground">النظام يعمل بشكل طبيعي</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          <span className="text-foreground">جميع الأفراد متاحين</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          <span className="text-foreground">معدل الاستجابة طبيعي</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                          <span className="text-foreground">3 بلاغات حرجة بالمعالجة</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'reports' && (
                <div className="space-y-4">
                  {[
                    { id: 1, type: 'أمني', time: 'منذ 5 دقائق', status: 'قيد المعالجة' },
                    { id: 2, type: 'مروري', time: 'منذ 12 دقيقة', status: 'قيد التنسيق' },
                    { id: 3, type: 'طبي', time: 'منذ 20 دقيقة', status: 'مُنهى' }
                  ].map(report => (
                    <div key={report.id} className="bg-card border border-border/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary">{report.type}</span>
                        <span className="text-xs text-foreground/60">{report.time}</span>
                      </div>
                      <p className="text-sm text-foreground mt-2">تقرير رقم {report.id}</p>
                      <p className="text-xs text-foreground/60 mt-1">الحالة: {report.status}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedTab === 'units' && (
                <div className="space-y-4">
                  {[
                    { name: 'دورية مرور 101', status: 'متاح', location: 'شارع الملك فهد' },
                    { name: 'فرقة أمن 205', status: 'منشغل', location: 'وسط المدينة' },
                    { name: 'سيارة إسعاف 401', status: 'متاح', location: 'المستشفى العام' }
                  ].map((unit, idx) => (
                    <div key={idx} className="bg-card border border-border/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">{unit.name}</h4>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          unit.status === 'متاح' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                        }`}>
                          {unit.status}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/60 mt-2">{unit.location}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedTab === 'performance' && (
                <div className="space-y-6">
                  <div className="bg-card border border-border/50 rounded-lg p-6">
                    <h3 className="font-bold text-foreground mb-4">معدل الأداء</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'معدل الاستجابة', value: 92 },
                        { label: 'معدل الإنجاز', value: 88 },
                        { label: 'رضا المستخدمين', value: 85 }
                      ].map((metric, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-foreground">{metric.label}</span>
                            <span className="text-sm font-semibold text-primary">{metric.value}%</span>
                          </div>
                          <div className="w-full bg-border/30 rounded-full h-3">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${metric.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
