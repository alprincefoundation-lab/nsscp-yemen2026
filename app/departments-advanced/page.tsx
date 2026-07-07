'use client'

import { useState } from 'react'
import Link from 'next/link'
import { departments } from '@/lib/departments-schema'

export default function DepartmentsAdvancedPage() {
  const [selectedDept, setSelectedDept] = useState(departments[0])
  const [searchTerm, setSearchTerm] = useState('')

  const filteredDepts = departments.filter(
    dept => dept.nameAr.includes(searchTerm) || dept.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 md:px-12 py-6 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-balance">الإدارات التخصصية</h1>
        <p className="text-foreground/70">24 إدارة متخصصة مع نماذج بيانات متكاملة</p>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 md:p-12">
        {/* Departments List */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border/50 rounded-xl p-4 sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <input
              type="text"
              placeholder="ابحث عن إدارة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground mb-4 text-sm"
            />

            <div className="space-y-2">
              {filteredDepts.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept)}
                  className={`w-full text-right px-4 py-3 rounded-lg transition-all duration-200 ${
                    selectedDept.id === dept.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-border/20 text-foreground hover:bg-border/40'
                  }`}
                >
                  <div className="font-medium text-sm">{dept.nameAr}</div>
                  <div className="text-xs opacity-70">{dept.code}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Department Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-xl p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="text-5xl mb-4">{selectedDept.icon}</div>
                <h2 className="text-3xl font-bold text-foreground mb-2">{selectedDept.nameAr}</h2>
                <p className="text-foreground/70 text-lg mb-4">{selectedDept.nameEn}</p>
                <p className="text-foreground/60">{selectedDept.description}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary mb-2">{selectedDept.code}</div>
                <div className="space-y-2 text-sm">
                  <div><span className="text-foreground/60">الموظفون:</span> <span className="font-semibold text-foreground">{selectedDept.staffCount}</span></div>
                  <div><span className="text-foreground/60">الميزانية:</span> <span className="font-semibold text-foreground">{(selectedDept.budget / 1000000).toFixed(1)}M</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Department Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Manager Info */}
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span>👤</span> مدير الإدارة
              </h3>
              <p className="font-medium text-foreground">{selectedDept.managerName}</p>
              <p className="text-foreground/70 text-sm">{selectedDept.managerRank}</p>
            </div>

            {/* Data Keys */}
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span>🔑</span> مفاتيح البيانات
              </h3>
              <div className="space-y-2">
                {selectedDept.primaryKeys.map((key) => (
                  <span key={key} className="block text-sm bg-primary/10 text-primary rounded px-2 py-1">
                    {key}
                  </span>
                ))}
              </div>
            </div>

            {/* Linked Departments */}
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span>🔗</span> إدارات مرتبطة
              </h3>
              <div className="space-y-2">
                {selectedDept.linkedDepartments.slice(0, 3).map((linkedId) => {
                  const linked = departments.find(d => d.id === linkedId)
                  return (
                    <span key={linkedId} className="block text-sm bg-accent/10 text-accent rounded px-2 py-1">
                      {linked?.nameAr}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-card border border-border/50 rounded-xl p-8">
            <h3 className="text-xl font-bold text-foreground mb-6">حقول النموذج</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDept.formFields.map((field) => (
                <div key={field.id} className="p-4 bg-border/20 rounded-lg">
                  <div className="font-medium text-foreground">{field.label}</div>
                  <div className="text-sm text-foreground/60 mt-1">النوع: {field.type}</div>
                  <div className={`text-xs mt-2 ${field.required ? 'text-red-400' : 'text-green-400'}`}>
                    {field.required ? '✓ مطلوب' : '○ اختياري'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Link
              href={`/departments/${selectedDept.id}`}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              فتح الإدارة
            </Link>
            <button
              className="px-6 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
            >
              طلب الدخول
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
