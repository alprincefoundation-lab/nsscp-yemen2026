'use client'

import MainNav from '@/components/main-nav'

export default function StaffMapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      <MainNav />
      
      <header className="w-full px-6 md:px-12 py-6 border-b border-border/50">
        <h1 className="text-3xl font-bold text-primary mb-2">خريطة الموارد البشرية</h1>
        <p className="text-foreground/70">توزيع وتوفر الموارد البشرية عبر الإدارات والمحافظات</p>
      </header>

      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-card border border-border/50 rounded-lg p-4">
              <p className="text-xs text-foreground/60 mb-1">إجمالي الموظفين</p>
              <p className="text-2xl font-bold text-primary">1,250</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-4">
              <p className="text-xs text-foreground/60 mb-1">الموظفون بالعمل</p>
              <p className="text-2xl font-bold text-green-600">1,087</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-4">
              <p className="text-xs text-foreground/60 mb-1">الموظفون في الإجازة</p>
              <p className="text-2xl font-bold text-yellow-600">89</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-4">
              <p className="text-xs text-foreground/60 mb-1">معدل التوفر</p>
              <p className="text-2xl font-bold text-accent">86.9%</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-4">
              <p className="text-xs text-foreground/60 mb-1">الأقسام المتأثرة</p>
              <p className="text-2xl font-bold text-primary">3</p>
            </div>
          </div>

          {/* Distribution by Department */}
          <div className="bg-card border border-border/50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">توزيع الموظفين حسب الإدارة</h2>
            <div className="space-y-4">
              {[
                { dept: 'إدارة العمليات', total: 120, available: 105, percent: 87 },
                { dept: 'شرطة المرور', total: 245, available: 210, percent: 86 },
                { dept: 'الخدمات الطارئة', total: 89, available: 82, percent: 92 },
                { dept: 'إدارة نظم المعلومات', total: 85, available: 78, percent: 92 },
                { dept: 'الأمن السيبراني', total: 45, available: 42, percent: 93 }
              ].map((item, idx) => (
                <div key={idx} className="border-b border-border/30 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{item.dept}</span>
                    <span className="text-sm text-primary">{item.available}/{item.total}</span>
                  </div>
                  <div className="w-full bg-border/30 rounded-full h-3 overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution by Region */}
          <div className="bg-card border border-border/50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">توزيع الموظفين حسب المنطقة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { region: 'أمانة العاصمة', total: 450, available: 410 },
                { region: 'عدن', total: 320, available: 285 },
                { region: 'تعز', total: 280, available: 235 }
              ].map((item, idx) => (
                <div key={idx} className="bg-border/20 rounded-lg p-4">
                  <div className="flex justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{item.region}</h3>
                    <span className="text-primary font-bold">{item.available}/{item.total}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/70">متوفرون الآن</span>
                      <span className="text-foreground">{item.available}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">في إجازة/غياب</span>
                      <span className="text-foreground">{item.total - item.available}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shift Information */}
          <div className="bg-card border border-border/50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">توزيع الفترات</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { shift: 'الفترة الصباحية (6 ص - 2 م)', staff: 420, status: 'نشطة' },
                { shift: 'الفترة المسائية (2 م - 10 م)', staff: 390, status: 'نشطة' },
                { shift: 'الفترة الليلية (10 م - 6 ص)', staff: 277, status: 'نشطة' }
              ].map((item, idx) => (
                <div key={idx} className="bg-border/20 rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">{item.shift}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-foreground/70">الموظفون</span>
                      <span className="font-bold text-primary">{item.staff}</span>
                    </div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      item.status === 'نشطة' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {item.status}
                    </span>
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
