'use client'

import Link from 'next/link'
import Image from 'next/image'
import OrgChart from '@/components/org-chart'

export default function OrganizationalHierarchyAdvanced() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 md:px-12 py-6 border-b border-border/50 flex items-center justify-between gap-8 sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
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
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">NSSCP</h1>
          <p className="text-foreground/80 text-sm font-semibold mt-1">الهيكل التنظيمي التفاعلي</p>
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
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-full">
          {/* Info Section */}
          <div className="bg-card border-b border-border/50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-foreground">الهيكل التنظيمي للمنظومة</h2>
              <p className="text-foreground/70">
                عرض تفاعلي كامل لهيكل المنظومة الوطنية للأمن والسيطرة، يمكنك النقر على أي إدارة للاطلاع على تفاصيلها الكاملة.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-border/20 rounded-lg">
                  <p className="text-xs text-foreground/60 mb-1">عدد الإدارات الرئيسية</p>
                  <p className="text-2xl font-bold text-primary">24</p>
                </div>
                <div className="p-4 bg-border/20 rounded-lg">
                  <p className="text-xs text-foreground/60 mb-1">عدد المحافظات</p>
                  <p className="text-2xl font-bold text-primary">22</p>
                </div>
                <div className="p-4 bg-border/20 rounded-lg">
                  <p className="text-xs text-foreground/60 mb-1">الوحدات الفرعية</p>
                  <p className="text-2xl font-bold text-primary">100+</p>
                </div>
              </div>
            </div>
          </div>

          {/* OrgChart Section */}
          <div className="p-6 md:p-12">
            <div className="max-w-full overflow-x-auto">
              <OrgChart />
            </div>
          </div>

          {/* Legend Section */}
          <div className="bg-card border-t border-border/50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-bold text-foreground mb-6">شرح الألوان</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="p-3 bg-primary/20 border-2 border-primary rounded text-center">
                    <p className="font-semibold text-foreground">المستوى الأول</p>
                    <p className="text-xs text-foreground/60 mt-1">وزارة الداخلية</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-accent/20 border-2 border-accent rounded text-center">
                    <p className="font-semibold text-foreground">الإدارات الرئيسية</p>
                    <p className="text-xs text-foreground/60 mt-1">قابلة للتوسع</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-border/30 border-2 border-border/50 rounded text-center">
                    <p className="font-semibold text-foreground">الأقسام الفرعية</p>
                    <p className="text-xs text-foreground/60 mt-1">وحدات تشغيلية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="border-t border-border/50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto flex justify-between">
              <Link
                href="/organizational-hierarchy"
                className="px-6 py-2 bg-border/20 text-foreground border border-border/50 rounded-lg hover:bg-border/40 transition-colors text-sm font-medium"
              >
                العودة
              </Link>
              <Link
                href="/tactical-dashboard"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                إلى لوحة القيادة
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
