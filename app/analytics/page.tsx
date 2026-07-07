'use client'

import Image from 'next/image'
import MainNav from '@/components/main-nav'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      <MainNav />
      
      <header className="w-full px-6 md:px-12 py-6 border-b border-border/50">
        <h1 className="text-3xl font-bold text-primary mb-2">التحليلات المتقدمة</h1>
        <p className="text-foreground/70">تحليل شامل لبيانات الأداء والعمليات</p>
      </header>

      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-xs text-foreground/60 mb-2">معدل الأداء</p>
              <p className="text-3xl font-bold text-primary">92%</p>
              <div className="mt-4 h-2 bg-border/30 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: '92%' }} />
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-xs text-foreground/60 mb-2">رضا المستخدمين</p>
              <p className="text-3xl font-bold text-accent">88%</p>
              <div className="mt-4 h-2 bg-border/30 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: '88%' }} />
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-xs text-foreground/60 mb-2">توفر النظام</p>
              <p className="text-3xl font-bold text-primary">99.7%</p>
              <div className="mt-4 h-2 bg-border/30 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: '99.7%' }} />
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-xs text-foreground/60 mb-2">معدل النمو</p>
              <p className="text-3xl font-bold text-green-600">+18%</p>
              <p className="text-xs text-foreground/60 mt-2">ربع على ربع</p>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">مؤشرات الأداء الشهرية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground mb-4">مقاييس العمليات</h3>
                {[
                  { label: 'البلاغات المعالجة', value: 45230 },
                  { label: 'متوسط زمن الاستجابة', value: '4:35' },
                  { label: 'معدل الإنجاز', value: '94%' }
                ].map((metric, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm text-foreground/70">{metric.label}</span>
                    <span className="font-semibold text-primary">{metric.value}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground mb-4">مقاييس الموارد</h3>
                {[
                  { label: 'عدد الموظفين النشطين', value: 1250 },
                  { label: 'نسبة الاستخدام', value: '87%' },
                  { label: 'مشاكل مسجلة', value: 23 }
                ].map((metric, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm text-foreground/70">{metric.label}</span>
                    <span className="font-semibold text-primary">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">الاتجاهات والتنبؤات</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-4">الحركة الشهرية</h3>
                <div className="flex items-end gap-2 h-40">
                  {[65, 78, 72, 85, 92, 88, 95, 87, 91, 89, 94, 96].map((val, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-primary rounded-t"
                      style={{ height: `${(val / 100) * 100}%`, minHeight: '2px' }}
                      title={`${val}%`}
                    />
                  ))}
                </div>
                <p className="text-xs text-foreground/60 mt-2">إجمالي السنة (آخر 12 شهر)</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
