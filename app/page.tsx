'use client'

import Link from 'next/link'
import Image from 'next/image'
import MainNav from '@/components/main-nav'
import { BilingualHeader } from '@/components/ui/bilingual-header'
import { BilingualCard } from '@/components/ui/bilingual-card'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 flex flex-col">
      <MainNav />
      
      {/* Header with Logos */}
      <header className="w-full px-6 md:px-12 py-8 border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-6 max-w-6xl mx-auto">
          {/* Left: Ministry Emblem */}
          <div className="flex items-center justify-start flex-shrink-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-FMZYi0WL6JLMKkX7WP94vLkq4tU9xe.png"
              alt="Ministry of Interior"
              width={90}
              height={90}
              className="h-20 w-auto"
            />
          </div>

          {/* Center: System Title */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: '#39ff14' }}>
                NSSCP
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold text-foreground text-center">
              المنظومة الوطنية للأمن والسيطرة
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              National Security & Control System Platform
            </p>
          </div>

          {/* Right: National Emblem */}
          <div className="flex items-center justify-end flex-shrink-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-wyCF4MHimWpEuWCgujMveUt5HdEcjQ.png"
              alt="National Emblem"
              width={90}
              height={90}
              className="h-20 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-6 md:px-12 py-12 max-w-6xl mx-auto w-full">
        {/* Status Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-foreground">النظام يعمل بكفاءة عالية</span>
          </div>
        </div>

        {/* Main Title Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
            لوحة التحكم المركزية
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Central Control Dashboard
          </p>
          <p className="text-foreground/70 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            مرحباً بك في المنظومة الوطنية للأمن والسيطرة. اختر البوابة المطلوبة لمراقبة وتنسيق العمليات الأمنية والسيادية.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 w-full mb-12">
          {/* Card 1: Tactical Dashboard */}
          <BilingualCard
            href="/tactical-dashboard"
            arabicTitle="غرفة العمليات التكتيكية"
            englishTitle="Tactical Command Center"
            arabicDescription="مراقبة شاملة للعمليات الأمنية والميدانية مع التحكم الفوري بالبلاغات والدوريات والحوادث في الوقت الحقيقي."
            icon="🎯"
            variant="highlighted"
          />

          {/* Card 2: Organizational Hierarchy */}
          <BilingualCard
            href="/organizational-hierarchy"
            arabicTitle="الهيكل التنظيمي"
            englishTitle="Organizational Structure"
            arabicDescription="عرض كامل للهيكل الإداري والإدارات والأقسام والوحدات مع العلاقات التنظيمية والصلاحيات المختلفة."
            icon="📊"
            variant="highlighted"
          />
        </div>

        {/* Second Row of Cards */}
        <div className="grid md:grid-cols-3 gap-6 w-full mb-12">
          {/* Card 3: Provinces */}
          <BilingualCard
            href="/provinces"
            arabicTitle="المحافظات الإقليمية"
            englishTitle="Regional Provinces"
            arabicDescription="مراقبة أداء المحافظات وعمليات القوات الإقليمية والتقارير الجغرافية."
            icon="🗺️"
            stat={{ label: 'المحافظات النشطة', value: '22' }}
          />

          {/* Card 4: All Departments */}
          <BilingualCard
            href="/all-departments"
            arabicTitle="الإدارات المتخصصة"
            englishTitle="Specialized Departments"
            arabicDescription="الوصول الكامل إلى جميع الإدارات والأقسام المتخصصة وإدارة الموارد."
            icon="🏢"
            stat={{ label: 'الإدارات', value: '24' }}
          />

          {/* Card 5: Data Integration */}
          <BilingualCard
            href="/data-integration"
            arabicTitle="ربط البيانات"
            englishTitle="Data Integration"
            arabicDescription="نظام موحد لربط البيانات بين جميع الإدارات والمحافظات بمفاتيح مركزية."
            icon="🔗"
            stat={{ label: 'الربطات النشطة', value: '53+' }}
          />
        </div>

        {/* User Info Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-card border border-border rounded-lg p-6">
          <div className="text-right flex-1">
            <p className="text-sm text-muted-foreground mb-1">المستخدم الحالي</p>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">مسؤول رئيسي</span>
              <span className="text-sm text-muted-foreground">(SUPER_ADMIN)</span>
            </div>
          </div>
          <button className="px-6 py-2 bg-primary text-primary-foreground border border-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
            تسجيل خروج
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 md:px-12 py-6 border-t border-border/30 flex items-center justify-center">
        <p className="text-foreground/50 text-xs text-center">
          © 2024 - المنظومة الوطنية للأمن والسيطرة (NSSCP) | جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  )
}
