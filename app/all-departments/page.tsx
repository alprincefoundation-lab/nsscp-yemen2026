'use client'

import { useState } from 'react'
import Link from 'next/link'
import { departments } from '@/lib/departments-schema'
import { BilingualHeader } from '@/components/ui/bilingual-header'
import DepartmentHierarchy from '@/components/department-hierarchy'
import DepartmentForm from '@/components/department-form'

export default function AllDepartmentsPage() {
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0].id)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'hierarchy' | 'form'>('grid')
  const [searchTerm, setSearchTerm] = useState('')

  const selectedDept = departments.find(d => d.id === selectedDeptId) || departments[0]
  
  const filteredDepts = departments.filter(
    dept => dept.nameAr.includes(searchTerm) || dept.code.includes(searchTerm.toUpperCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <header className="sticky top-16 z-30 bg-card/95 backdrop-blur-sm border-b border-border/50 px-6 md:px-12 py-6">
        <BilingualHeader
          arabicTitle="الإدارات المتخصصة"
          englishTitle="Specialized Departments"
          icon="🏢"
          description="نظام متكامل لإدارة الإدارات والأقسام مع ربط البيانات المركزي والإحصائيات الشاملة"
        />

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mt-6">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="ابحث بالاسم أو الكود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <span className="absolute right-4 top-3 text-muted-foreground">🔍</span>
          </div>

          {/* View Mode Buttons */}
          <div className="flex gap-2 bg-border/20 rounded-lg p-1">
            {[
              { mode: 'grid' as const, icon: '⊞', label: 'عرض الشبكة' },
              { mode: 'list' as const, icon: '☰', label: 'عرض القائمة' },
              { mode: 'hierarchy' as const, icon: '🔗', label: 'الهيكل' },
              { mode: 'form' as const, icon: '📝', label: 'النموذج' }
            ].map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 rounded transition-all ${
                  viewMode === mode
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground hover:bg-border/50'
                }`}
                title={label}
              >
                <span className="text-lg">{icon}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-6 md:p-12 max-w-7xl mx-auto">
        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDepts.map((dept) => (
              <button
                key={dept.id}
                onClick={() => {
                  setSelectedDeptId(dept.id)
                  setViewMode('form')
                }}
                className="text-right p-6 bg-card border border-border/50 rounded-lg hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{dept.icon}</span>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">{dept.code}</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{dept.nameAr}</h3>
                <p className="text-sm text-foreground/70 mb-4">{dept.nameEn}</p>
                <p className="text-xs text-foreground/60 mb-4 line-clamp-2">{dept.description}</p>
                <div className="flex gap-2 justify-end text-xs">
                  <span className="bg-accent/10 text-accent px-2 py-1 rounded">{dept.staffCount} موظف</span>
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded">{(dept.budget / 1000000).toFixed(1)}M</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-3 max-w-2xl">
            {filteredDepts.map((dept) => (
              <button
                key={dept.id}
                onClick={() => {
                  setSelectedDeptId(dept.id)
                  setViewMode('form')
                }}
                className="w-full text-right p-4 bg-card border border-border/50 rounded-lg hover:border-primary/50 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 justify-end">
                    <div>
                      <h4 className="font-semibold text-foreground">{dept.nameAr}</h4>
                      <p className="text-sm text-foreground/70">{dept.nameEn}</p>
                    </div>
                    <span className="text-2xl">{dept.icon}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-foreground/60">
                  <p>{dept.code}</p>
                  <p>{dept.staffCount} موظف</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Hierarchy View */}
        {viewMode === 'hierarchy' && (
          <DepartmentHierarchy />
        )}

        {/* Form View */}
        {viewMode === 'form' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Department Header */}
            <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 rounded-xl p-8">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-foreground mb-2">{selectedDept.nameAr}</h2>
                  <p className="text-foreground/70 text-lg mb-4">{selectedDept.nameEn}</p>
                  <p className="text-foreground/60 text-base">{selectedDept.description}</p>
                </div>
                <div className="text-6xl">{selectedDept.icon}</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-card/50 rounded-lg p-4">
                  <p className="text-foreground/60 text-sm">الكود</p>
                  <p className="text-xl font-bold text-primary">{selectedDept.code}</p>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <p className="text-foreground/60 text-sm">الموظفون</p>
                  <p className="text-xl font-bold text-foreground">{selectedDept.staffCount}</p>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <p className="text-foreground/60 text-sm">الميزانية</p>
                  <p className="text-xl font-bold text-accent">{(selectedDept.budget / 1000000).toFixed(1)}M</p>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <p className="text-foreground/60 text-sm">المدير</p>
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{selectedDept.managerRank}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-card border border-border/50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-foreground mb-6">نموذج إدخال البيانات</h3>
              <DepartmentForm department={selectedDept} />
            </div>

            {/* Department Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border/50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-foreground mb-4">المدير</h4>
                <p className="font-semibold text-foreground">{selectedDept.managerName}</p>
                <p className="text-sm text-foreground/70">{selectedDept.managerRank}</p>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-foreground mb-4">مفاتيح ربط البيانات</h4>
                <div className="space-y-2">
                  {selectedDept.primaryKeys.map((key) => (
                    <div key={key} className="text-sm bg-primary/10 text-primary rounded px-3 py-2">
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Linked Departments */}
            {selectedDept.linkedDepartments.length > 0 && (
              <div className="bg-card border border-border/50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-foreground mb-4">الإدارات المرتبطة</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedDept.linkedDepartments.map((linkedId) => {
                    const linked = departments.find(d => d.id === linkedId)
                    return linked ? (
                      <button
                        key={linkedId}
                        onClick={() => setSelectedDeptId(linkedId)}
                        className="p-3 bg-border/20 rounded-lg hover:bg-accent/20 transition-colors text-right"
                      >
                        <p className="font-semibold text-foreground text-sm">{linked.nameAr}</p>
                        <p className="text-xs text-foreground/60">{linked.code}</p>
                      </button>
                    ) : null
                  })}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 justify-center pt-6">
              <button
                onClick={() => {
                  const currentIdx = departments.findIndex(d => d.id === selectedDeptId)
                  if (currentIdx > 0) {
                    setSelectedDeptId(departments[currentIdx - 1].id)
                  }
                }}
                className="px-6 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                السابقة
              </button>
              <button
                onClick={() => {
                  const currentIdx = departments.findIndex(d => d.id === selectedDeptId)
                  if (currentIdx < departments.length - 1) {
                    setSelectedDeptId(departments[currentIdx + 1].id)
                  }
                }}
                className="px-6 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                التالية
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card border border-border/50 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-primary">{departments.length}</p>
            <p className="text-foreground/70 mt-2">إدارة متخصصة</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-accent">{departments.reduce((sum, d) => sum + d.staffCount, 0)}</p>
            <p className="text-foreground/70 mt-2">موظف إجمالاً</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-primary">{(departments.reduce((sum, d) => sum + d.budget, 0) / 1000000).toFixed(0)}M</p>
            <p className="text-foreground/70 mt-2">ميزانية إجمالية</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-primary">{departments.reduce((sum, d) => sum + d.linkedDepartments.length, 0)}</p>
            <p className="text-foreground/70 mt-2">ارتباط بيانات</p>
          </div>
        </div>
      </main>
    </div>
  )
}
