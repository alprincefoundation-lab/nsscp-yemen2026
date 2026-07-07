'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'

export default function DepartmentDetail() {
  const params = useParams()
  const deptId = params.id as string

  const departmentData: Record<string, any> = {
    'dept-1': {
      name: 'إدارة نظم المعلومات',
      shortName: 'IT',
      description: 'قسم تكنولوجيا المعلومات والشبكات',
      staff: 85,
      reports: 1250,
      efficiency: 94,
      budget: 2500000
    },
    'dept-5': {
      name: 'إدارة العمليات',
      shortName: 'OPS',
      description: 'قسم العمليات الأمنية والتنسيق',
      staff: 120,
      reports: 2105,
      efficiency: 92,
      budget: 4200000
    },
    'dept-10': {
      name: 'إدارة شرطة المرور',
      shortName: 'TRAFFIC',
      description: 'قسم تنظيم المرور والحوادث',
      staff: 245,
      reports: 3421,
      efficiency: 87,
      budget: 5800000
    }
  }

  const department = departmentData[deptId] || {
    name: 'إدارة',
    shortName: 'DEPT',
    description: 'قسم تابع للمنظومة',
    staff: 50,
    reports: 500,
    efficiency: 85,
    budget: 1000000
  }

  const [selectedTab, setSelectedTab] = useState<'overview' | 'team' | 'performance' | 'budget'>('overview')

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 md:px-12 py-6 border-b border-border/50 sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Link href="/departments" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-4">
          <span>←</span>
          <span>العودة إلى الإدارات</span>
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
            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">{department.name}</h1>
            <p className="text-foreground/80 text-sm font-semibold mt-1">{department.shortName}</p>
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
              <p className="text-foreground/70 mb-6">{department.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-border/20 rounded-lg p-6">
                  <p className="text-xs text-foreground/60 mb-2">عدد الموظفين</p>
                  <p className="text-3xl font-bold text-primary">{department.staff}</p>
                  <p className="text-xs text-foreground/60 mt-2">موظف نشط</p>
                </div>
                <div className="bg-border/20 rounded-lg p-6">
                  <p className="text-xs text-foreground/60 mb-2">إجمالي البلاغات</p>
                  <p className="text-3xl font-bold text-accent">{department.reports}</p>
                  <p className="text-xs text-foreground/60 mt-2">بلاغ معالج</p>
                </div>
                <div className="bg-border/20 rounded-lg p-6">
                  <p className="text-xs text-foreground/60 mb-2">كفاءة الأداء</p>
                  <p className="text-3xl font-bold text-green-600">{department.efficiency}%</p>
                  <p className="text-xs text-foreground/60 mt-2">معدل الأداء</p>
                </div>
                <div className="bg-border/20 rounded-lg p-6">
                  <p className="text-xs text-foreground/60 mb-2">الميزانية السنوية</p>
                  <p className="text-2xl font-bold text-primary">{(department.budget / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-foreground/60 mt-2">بالريال</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border/50">
            <div className="max-w-6xl mx-auto px-6 md:px-12 flex gap-8">
              {(['overview', 'team', 'performance', 'budget'] as const).map(tab => (
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
                  {tab === 'team' && 'الفريق'}
                  {tab === 'performance' && 'الأداء'}
                  {tab === 'budget' && 'الميزانية'}
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
                      <h3 className="font-bold text-foreground mb-4">الأقسام الفرعية</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-foreground/70">• قسم تطوير النظم</p>
                        <p className="text-sm text-foreground/70">• قسم إدارة القواعد</p>
                        <p className="text-sm text-foreground/70">• قسم الدعم الفني</p>
                        <p className="text-sm text-foreground/70">• قسم الاختبار والجودة</p>
                      </div>
                    </div>

                    <div className="bg-card border border-border/50 rounded-lg p-6">
                      <h3 className="font-bold text-foreground mb-4">المسؤوليات الرئيسية</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-foreground/70">✓ تطوير وصيانة الأنظمة</p>
                        <p className="text-sm text-foreground/70">✓ دعم العمليات اليومية</p>
                        <p className="text-sm text-foreground/70">✓ تدريب الموظفين</p>
                        <p className="text-sm text-foreground/70">✓ ضمان الجودة والأمان</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border/50 rounded-lg p-6">
                    <h3 className="font-bold text-foreground mb-4">المشاريع الجارية</h3>
                    <div className="space-y-4">
                      {[
                        { name: 'تحديث نظام الأمن السيبراني', progress: 75 },
                        { name: 'تطوير بوابة خدمات جديدة', progress: 60 },
                        { name: 'دمج الأنظمة المركزية', progress: 45 }
                      ].map((proj, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-semibold text-foreground">{proj.name}</span>
                            <span className="text-sm text-primary">{proj.progress}%</span>
                          </div>
                          <div className="w-full bg-border/30 rounded-full h-2">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'team' && (
                <div className="space-y-4">
                  {[
                    { name: 'م.د أحمد محمد', position: 'مدير الإدارة', level: 'عام' },
                    { name: 'د. فاطمة علي', position: 'نائب المدير', level: 'متخصص' },
                    { name: 'م. سارة حسن', position: 'رئيس قسم التطوير', level: 'متخصص' },
                    { name: 'م. محمود إبراهيم', position: 'رئيس قسم الدعم', level: 'متخصص' }
                  ].map((member, idx) => (
                    <div key={idx} className="bg-card border border-border/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">{member.name}</h4>
                          <p className="text-sm text-foreground/60">{member.position}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          member.level === 'عام' ? 'text-purple-600 bg-purple-100' : 'text-blue-600 bg-blue-100'
                        }`}>
                          {member.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedTab === 'performance' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card border border-border/50 rounded-lg p-6">
                      <h3 className="font-bold text-foreground mb-4">مؤشرات الأداء الرئيسية</h3>
                      <div className="space-y-4">
                        {[
                          { label: 'إنتاجية العمل', value: 88 },
                          { label: 'جودة الخدمة', value: 92 },
                          { label: 'رضا المستخدمين', value: 86 }
                        ].map((metric, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-foreground">{metric.label}</span>
                              <span className="text-sm font-semibold text-primary">{metric.value}%</span>
                            </div>
                            <div className="w-full bg-border/30 rounded-full h-2">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${metric.value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-card border border-border/50 rounded-lg p-6">
                      <h3 className="font-bold text-foreground mb-4">الإحصائيات الشهرية</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-foreground/70">البلاغات المعالجة</span>
                          <span className="font-semibold text-primary">342</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/70">متوسط وقت الاستجابة</span>
                          <span className="font-semibold text-primary">2.5 ساعة</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/70">نسبة الإنجاز</span>
                          <span className="font-semibold text-primary">94%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/70">الأخطاء المرصودة</span>
                          <span className="font-semibold text-primary">3</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'budget' && (
                <div className="space-y-6">
                  <div className="bg-card border border-border/50 rounded-lg p-6">
                    <h3 className="font-bold text-foreground mb-4">تفصيل الميزانية</h3>
                    <div className="space-y-4">
                      {[
                        { item: 'الموارد البشرية', amount: 1200000, percent: 48 },
                        { item: 'التجهيزات والمعدات', amount: 700000, percent: 28 },
                        { item: 'برامج وتراخيص', amount: 400000, percent: 16 },
                        { item: 'التدريب والتطوير', amount: 200000, percent: 8 }
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-semibold text-foreground">{item.item}</span>
                            <span className="text-sm text-primary">{(item.amount / 1000).toFixed(0)}K - {item.percent}%</span>
                          </div>
                          <div className="w-full bg-border/30 rounded-full h-2">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${item.percent}%` }} />
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
