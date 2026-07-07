'use client'

import MainNav from '@/components/main-nav'

export default function MonthlyReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      <MainNav />
      
      <header className="w-full px-6 md:px-12 py-6 border-b border-border/50">
        <h1 className="text-3xl font-bold text-primary mb-2">التقارير الشهرية</h1>
        <p className="text-foreground/70">ملخص الإحصائيات والأداء الشهري الشامل</p>
      </header>

      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-xs text-foreground/60 mb-2">إجمالي البلاغات</p>
              <p className="text-3xl font-bold text-primary">64,350</p>
              <p className="text-xs text-foreground/60 mt-2">تقريباً 2,145 يومياً</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-xs text-foreground/60 mb-2">نسبة الحل</p>
              <p className="text-3xl font-bold text-accent">94.2%</p>
              <p className="text-xs text-green-600 mt-2">↑ من 92% الشهر الماضي</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-xs text-foreground/60 mb-2">متوسط الاستجابة</p>
              <p className="text-3xl font-bold text-primary">4:28</p>
              <p className="text-xs text-foreground/60 mt-2">أقل من المتوسط</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-xs text-foreground/60 mb-2">رضا المستخدمين</p>
              <p className="text-3xl font-bold text-green-600">91%</p>
              <p className="text-xs text-foreground/60 mt-2">من 456 استطلاع</p>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">توزيع البلاغات الشهري</h2>
            <div className="space-y-4">
              {[
                { type: 'البلاغات الأمنية', count: 25056, percent: 39 },
                { type: 'البلاغات المرورية', count: 22523, percent: 35 },
                { type: 'البلاغات الطبية', count: 16771, percent: 26 }
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{item.type}</span>
                    <span className="text-sm text-primary">{item.count} ({item.percent}%)</span>
                  </div>
                  <div className="w-full bg-border/30 rounded-full h-3">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <h3 className="font-bold text-foreground mb-4">أداء المحافظات</h3>
              <div className="space-y-3">
                {[
                  { name: 'أمانة العاصمة', score: 94 },
                  { name: 'محافظة عدن', score: 92 },
                  { name: 'محافظة تعز', score: 88 }
                ].map((prov, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{prov.name}</span>
                    <span className="text-sm font-semibold text-primary">{prov.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-lg p-6">
              <h3 className="font-bold text-foreground mb-4">أداء الإدارات</h3>
              <div className="space-y-3">
                {[
                  { name: 'إدارة العمليات', score: 96 },
                  { name: 'شرطة المرور', score: 89 },
                  { name: 'الخدمات الطارئة', score: 94 }
                ].map((dept, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{dept.name}</span>
                    <span className="text-sm font-semibold text-primary">{dept.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
