'use client'

import Link from 'next/link'
import Image from 'next/image'
import { departments } from '@/lib/departments-schema'
import { useState } from 'react'

export default function DepartmentsPage() {
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredDepts = departments.filter(dept =>
    dept.nameAr.includes(searchTerm) || 
    dept.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.includes(searchTerm)
  )

  const selected = selectedDept 
    ? departments.find(d => d.id === selectedDept)
    : null

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
          <p className="text-foreground/60 text-xs md:text-sm mt-2">الإدارات المتخصصة الـ 24</p>
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

      <main className="flex-1 flex flex-col md:flex-row gap-6 p-6 md:p-12">
        {/* Departments List */}
        <div className="w-full md:w-2/5">
          <div className="sticky top-24">
            <div className="mb-4">
              <input
                type="text"
                placeholder="ابحث عن إدارة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-card border border-primary/30 rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {filteredDepts.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.id)}
                  className={`w-full text-right p-4 rounded-lg transition-all duration-200 border-2 ${
                    selectedDept === dept.id
                      ? 'border-primary bg-primary/20'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="font-bold text-foreground">{dept.nameAr}</div>
                  <div className="text-sm text-foreground/70">{dept.code}</div>
                  <div className="text-xs text-foreground/50 mt-1">{dept.staffCount} موظف</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Department Details */}
        <div className="w-full md:w-3/5">
          {selected ? (
            <div className="space-y-6">
              {/* Department Header */}
              <div className="bg-card border border-border/50 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">{selected.nameAr}</h2>
                <p className="text-primary text-sm font-semibold mb-4">{selected.nameEn}</p>
                <p className="text-foreground/70 mb-6">{selected.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-foreground/60 text-sm">مدير الإدارة</p>
                    <p className="text-foreground font-semibold">{selected.managerName}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm">عدد الموظفين</p>
                    <p className="text-foreground font-semibold">{selected.staffCount}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm">الميزانية</p>
                    <p className="text-foreground font-semibold">{(selected.budget / 1000).toFixed(0)} ألف</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm">كود الإدارة</p>
                    <p className="text-primary font-semibold">{selected.code}</p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="bg-card border border-border/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">نموذج البيانات</h3>
                <div className="space-y-4">
                  {selected.formFields.map((field) => (
                    <div key={field.id}>
                      <label className="text-foreground/80 font-semibold block mb-2">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          disabled
                          placeholder={field.placeholder || `أدخل ${field.label}`}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground/70 text-sm"
                          rows={3}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          disabled
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground/70 text-sm"
                        >
                          <option>اختر {field.label}</option>
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          disabled
                          placeholder={field.placeholder || `أدخل ${field.label}`}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground/70 text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Departments */}
              {selected.linkedDepartments.length > 0 && (
                <div className="bg-card border border-border/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">الإدارات المرتبطة</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selected.linkedDepartments.map((deptId) => {
                      const linkedDept = departments.find(d => d.id === deptId)
                      return linkedDept ? (
                        <button
                          key={deptId}
                          onClick={() => setSelectedDept(deptId)}
                          className="text-right p-3 bg-primary/10 border border-primary/30 rounded-lg hover:border-primary transition-all"
                        >
                          <div className="font-semibold text-foreground text-sm">{linkedDept.nameAr}</div>
                          <div className="text-xs text-primary">{linkedDept.code}</div>
                        </button>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-card border border-border/50 rounded-xl">
              <p className="text-foreground/60">اختر إدارة لعرض التفاصيل</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
