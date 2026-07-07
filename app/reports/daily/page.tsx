'use client'

import Image from 'next/image'
import MainNav from '@/components/main-nav'
import Link from 'next/link'

export default function DailyReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      <MainNav />
      
      <header className="w-full px-6 md:px-12 py-6 border-b border-border/50">
        <h1 className="text-3xl font-bold text-primary mb-2">التقارير اليومية</h1>
        <p className="text-foreground/70">ملخص العمليات والبلاغات للـ 24 ساعة الماضية</p>
      </header>

      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-xs text-foreground/60 mb-2">إجمالي البلاغات</p>
              <p className="text-3xl font-bold text-primary">2,145</p>
              <p className="text-xs text-green-600 mt-2">↑ 12% من أمس</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-xs text-foreground/60 mb-2">البلاغات المحلولة</p>
              <p className="text-3xl font-bold text-accent">1,987</p>
              <p className="text-xs text-foreground/60 mt-2">معدل الإنجاز: 92%</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-xs text-foreground/60 mb-2">متوسط زمن الاستجابة</p>
              <p className="text-3xl font-bold text-primary">4:32</p>
              <p className="text-xs text-green-600 mt-2">↓ 8 دقائق من المعدل</p>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">توزيع البلاغات حسب النوع</h2>
            <div className="space-y-4">
              {[
                { type: 'أمني', count: 845, percent: 39 },
                { type: 'مروري', count: 756, percent: 35 },
                { type: 'طبي', count: 544, percent: 25 }
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
        </div>
      </main>
    </div>
  )
}
