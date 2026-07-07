'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { provinces } from '@/lib/data'

export default function OrganizationalHierarchy() {
  const [selectedProvince, setSelectedProvince] = useState<string>('prov-1')

  const hierarchyStructure = [
    {
      title: 'مدير عام أمن المحافظة',
      level: 1,
      units: [
        { name: 'إدارة نظم المعلومات', units: 6 },
        { name: 'إدارة العمليات', units: 5 },
        { name: 'إدارة البحث الجنائي', units: 8 },
        { name: 'إدارة أقسام الشرطة', units: 6 },
        { name: 'إدارة شرطة المرور', units: 7 },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 md:px-12 py-6 border-b border-border/50 flex items-center justify-between gap-8">
        <div className="flex items-center justify-start flex-shrink-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-FMZYi0WL6JLMKkX7WP94vLkq4tU9xe.png"
            alt="Ministry of Interior"
            width={100}
            height={100}
            className="h-20 w-auto"
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">NSSCP</h1>
          <p className="text-foreground/80 text-sm md:text-base font-semibold mt-1">المنظومة الوطنية للأمن والسيطرة</p>
          <p className="text-foreground/60 text-xs md:text-sm mt-2">الهيكل التنظيمي العام</p>
        </div>

        <div className="flex items-center justify-end flex-shrink-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-wyCF4MHimWpEuWCgujMveUt5HdEcjQ.png"
            alt="National Emblem"
            width={100}
            height={100}
            className="h-20 w-auto"
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-row-reverse">
        {/* Left Sidebar - Provinces */}
        <aside className="w-64 bg-card border-l border-border/50 p-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          <h2 className="text-lg font-bold text-primary mb-4">المحافظات</h2>
          <div className="space-y-2">
            {provinces.map((province) => (
              <button
                key={province.id}
                onClick={() => setSelectedProvince(province.id)}
                className={`w-full text-right px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedProvince === province.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-border/20 text-foreground hover:bg-border/40'
                }`}
              >
                <span className="text-sm font-medium">{province.name}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto max-h-[calc(100vh-120px)]">
          <div className="max-w-4xl">
            {/* Breadcrumb */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <Link href="/" className="text-primary hover:text-primary/80 text-sm">
                  العودة للرئيسية
                </Link>
              </div>
              <h2 className="text-2xl font-bold text-foreground">الهيكل التنظيمي</h2>
            </div>

            {/* Organizational Tree */}
            <div className="bg-card border border-border/50 rounded-xl p-8">
              <div className="space-y-8">
                {hierarchyStructure.map((level, idx) => (
                  <div key={idx} className="border-l-4 border-primary/30 pl-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-primary mb-2">{level.title}</h3>
                      <p className="text-foreground/70 text-sm">المستوى {level.level}</p>
                    </div>

                    <div className="space-y-3">
                      {level.units.map((unit, uIdx) => (
                        <div
                          key={uIdx}
                          className="p-4 bg-border/20 rounded-lg hover:bg-border/40 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{unit.name}</h4>
                              <p className="text-sm text-foreground/60 mt-1">{unit.units} وحدات فرعية</p>
                            </div>
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="p-6 bg-card border border-border/50 rounded-xl text-center">
                <p className="text-3xl font-bold text-primary mb-2">25</p>
                <p className="text-foreground/70 text-sm">إدارة رئيسية</p>
              </div>
              <div className="p-6 bg-card border border-border/50 rounded-xl text-center">
                <p className="text-3xl font-bold text-primary mb-2">22</p>
                <p className="text-foreground/70 text-sm">محافظة وفرع</p>
              </div>
              <div className="p-6 bg-card border border-border/50 rounded-xl text-center">
                <p className="text-3xl font-bold text-primary mb-2">100+</p>
                <p className="text-foreground/70 text-sm">وحدة فرعية</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
