'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { provinces, ministryDepartments } from '@/lib/data'

export default function TacticalDashboard() {
  const [selectedProvince, setSelectedProvince] = useState<string>('prov-1')
  const [expandedDept, setExpandedDept] = useState<string | null>(null)

  const handleDepartmentClick = (deptId: string) => {
    setExpandedDept(expandedDept === deptId ? null : deptId)
  }

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
          <p className="text-foreground/60 text-xs md:text-sm mt-2">لوحة مركز القيادة التكتيكية</p>
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
          <h2 className="text-lg font-bold text-primary mb-4">المحافظات والأقسام</h2>
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
          <div className="max-w-6xl">
            {/* Breadcrumb */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <Link href="/" className="text-primary hover:text-primary/80 text-sm">
                  العودة للرئيسية
                </Link>
              </div>
              <h2 className="text-2xl font-bold text-foreground">المهام والخدمات الرئيسية</h2>
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ministryDepartments.map((dept) => (
                <Link
                  key={dept.id}
                  href={`/departments/${dept.id}`}
                >
                  <div
                    onClick={() => handleDepartmentClick(dept.id)}
                    className="group relative p-6 bg-card border border-border/50 rounded-xl hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer h-full"
                  >
                  <div className="absolute -inset-px bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300 -z-10" />
                  
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {dept.name}
                    </h3>
                    <p className="text-primary text-sm font-medium">{dept.code}</p>
                  </div>

                  <p className="text-foreground/70 text-sm mb-4 line-clamp-2">
                    {dept.description}
                  </p>

                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    <span>الدخول</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  </div>
                </Link>
                ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
