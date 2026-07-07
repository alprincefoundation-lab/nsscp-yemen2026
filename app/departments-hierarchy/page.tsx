'use client'

import Link from 'next/link'
import Image from 'next/image'
import { departments } from '@/lib/departments-schema'
import { useState } from 'react'

export default function DepartmentsHierarchyPage() {
  const [expandedDept, setExpandedDept] = useState<string | null>(null)

  const mainDeptId = 'dept-001'
  const mainDept = departments.find(d => d.id === mainDeptId)

  const getDepartmentsByType = (type: string) => {
    return departments.filter(d => {
      if (type === 'operations') return ['dept-002', 'dept-003', 'dept-005'].includes(d.id)
      if (type === 'support') return ['dept-006', 'dept-007', 'dept-009', 'dept-010'].includes(d.id)
      if (type === 'technical') return ['dept-011', 'dept-012', 'dept-013', 'dept-014'].includes(d.id)
      if (type === 'admin') return ['dept-004', 'dept-008', 'dept-019', 'dept-020'].includes(d.id)
      if (type === 'specialized') return ['dept-015', 'dept-016', 'dept-017', 'dept-018', 'dept-021', 'dept-022', 'dept-023', 'dept-024'].includes(d.id)
      return false
    })
  }

  const categories = [
    { id: 'operations', nameAr: 'إدارات العمليات', color: 'border-red-500/50' },
    { id: 'support', nameAr: 'إدارات الدعم', color: 'border-blue-500/50' },
    { id: 'technical', nameAr: 'الإدارات التقنية', color: 'border-purple-500/50' },
    { id: 'admin', nameAr: 'الإدارات الإدارية', color: 'border-green-500/50' },
    { id: 'specialized', nameAr: 'الإدارات المتخصصة', color: 'border-amber-500/50' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: '#39ff14' }}>NSSCP</h1>
          <p className="text-foreground/80 text-sm md:text-base font-semibold mt-1">المنظومة الوطنية للأمن والسيطرة</p>
          <p className="text-foreground/60 text-xs md:text-sm mt-2">الهيكل التنظيمي والعلاقات بين الإدارات</p>
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

      <main className="flex-1 flex flex-col gap-6 p-6 md:p-12">
        {/* Main Department */}
        {mainDept && (
          <div className="w-full bg-card border-2 border-primary rounded-xl p-8 text-center mb-8">
            <h2 className="text-3xl font-bold text-primary mb-2">{mainDept.nameAr}</h2>
            <p className="text-foreground/70">{mainDept.description}</p>
            <p className="text-sm text-foreground/60 mt-4">إجمالي الموارد: {mainDept.staffCount} موظف</p>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const categoryDepts = getDepartmentsByType(category.id)
            return (
              <div key={category.id} className={`bg-card border-2 ${category.color} rounded-xl p-6`}>
                <h3 className="text-xl font-bold text-foreground mb-4">{category.nameAr}</h3>
                <div className="space-y-3">
                  {categoryDepts.map((dept) => (
                    <Link
                      key={dept.id}
                      href={`/departments-full/${dept.id}`}
                      className="block p-3 bg-input border border-border rounded-lg hover:border-primary transition-all group"
                    >
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {dept.nameAr}
                      </div>
                      <div className="text-xs text-foreground/60 mt-1">{dept.code}</div>
                      <div className="text-xs text-foreground/50 mt-1">{dept.staffCount} موظف</div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Statistics */}
        <div className="mt-12 bg-card border border-border/50 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-foreground mb-6">إحصائيات النظام</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{departments.length}</p>
              <p className="text-foreground/70 text-sm mt-2">إجمالي الإدارات</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {departments.reduce((sum, d) => sum + d.staffCount, 0)}
              </p>
              <p className="text-foreground/70 text-sm mt-2">إجمالي الموظفين</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {(departments.reduce((sum, d) => sum + d.budget, 0) / 1000000).toFixed(1)}M
              </p>
              <p className="text-foreground/70 text-sm mt-2">إجمالي الميزانية</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {Math.round(departments.reduce((sum, d) => sum + d.linkedDepartments.length, 0) / departments.length)}
              </p>
              <p className="text-foreground/70 text-sm mt-2">متوسط الروابط</p>
            </div>
          </div>
        </div>

        {/* Data Integration Info */}
        <div className="bg-card border border-border/50 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-foreground mb-4">ربط البيانات المركزي</h3>
          <p className="text-foreground/70 mb-4">يتم ربط بيانات جميع الإدارات من خلال ثلاثة مفاتيح أساسية:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-input p-4 rounded-lg border border-primary/30">
              <p className="font-bold text-primary mb-2">1. الرقم العسكري (Military ID)</p>
              <p className="text-foreground/70 text-sm">معرّف فريد لكل عنصر عسكري يربط جميع سجلاته عبر الإدارات</p>
            </div>
            <div className="bg-input p-4 rounded-lg border border-primary/30">
              <p className="font-bold text-primary mb-2">2. الرقم الوطني (National ID)</p>
              <p className="text-foreground/70 text-sm">معرّف المواطن الوطني للمتعاملين والمشبوهين وضحايا الجرائم</p>
            </div>
            <div className="bg-input p-4 rounded-lg border border-primary/30">
              <p className="font-bold text-primary mb-2">3. رقم القضية (Case Number)</p>
              <p className="text-foreground/70 text-sm">معرّف فريد لكل قضية يجمع جميع البيانات المتعلقة بها</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
