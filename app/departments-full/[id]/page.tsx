'use client'

import Link from 'next/link'
import Image from 'next/image'
import { departments } from '@/lib/departments-schema'
import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function DepartmentFormPage() {
  const params = useParams()
  const deptId = params.id as string
  const dept = departments.find(d => d.id === deptId)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)

  if (!dept) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">الإدارة غير موجودة</h1>
          <Link href="/departments-full" className="text-primary hover:underline">
            العودة للإدارات
          </Link>
        </div>
      </div>
    )
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    console.log('Form submitted:', { department: dept.nameAr, data: formData })
    
    setTimeout(() => {
      setSubmitted(false)
      setFormData({})
    }, 3000)
  }

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
          <p className="text-foreground/60 text-xs md:text-sm mt-2">نموذج إدخال البيانات</p>
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

      <main className="flex-1 flex flex-col gap-6 p-6 md:p-12 max-w-4xl mx-auto">
        {/* Department Info */}
        <div className="bg-card border border-border/50 rounded-xl p-6">
          <Link href="/departments-full" className="text-primary text-sm hover:underline mb-4 inline-block">
            ← العودة للإدارات
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">{dept.nameAr}</h1>
          <p className="text-primary text-lg font-semibold mb-4">{dept.nameEn}</p>
          <p className="text-foreground/70">{dept.description}</p>
        </div>

        {/* Manager Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <p className="text-foreground/60 text-sm mb-2">مدير الإدارة</p>
            <p className="text-foreground font-bold text-lg">{dept.managerName}</p>
            <p className="text-primary text-sm mt-2">{dept.managerRank}</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <p className="text-foreground/60 text-sm mb-2">الموارد</p>
            <p className="text-foreground font-bold text-lg">{dept.staffCount} موظف</p>
            <p className="text-primary text-sm mt-2">ميزانية: {(dept.budget / 1000).toFixed(0)} ألف</p>
          </div>
        </div>

        {/* Form */}
        {submitted ? (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 text-center">
            <p className="text-green-400 font-bold text-lg">تم استلام البيانات بنجاح!</p>
            <p className="text-foreground/70 mt-2">سيتم معالجة المعلومات من قبل الإدارة المختصة</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-xl p-6 space-y-6">
            <h2 className="text-2xl font-bold text-foreground">نموذج إدخال البيانات</h2>

            <div className="space-y-4">
              {dept.formFields.map((field) => (
                <div key={field.id}>
                  <label className="text-foreground/80 font-semibold block mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder || `أدخل ${field.label}`}
                      required={field.required}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary"
                      rows={4}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      required={field.required}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">اختر {field.label}</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={formData[field.id] || false}
                      onChange={(e) => handleInputChange(field.id, e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder || `أدخل ${field.label}`}
                      required={field.required}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                تقديم النموذج
              </button>
              <button
                type="reset"
                onClick={() => setFormData({})}
                className="px-6 py-3 bg-border/30 text-foreground font-semibold rounded-lg hover:bg-border/50 transition-colors"
              >
                إعادة تعيين
              </button>
            </div>
          </form>
        )}

        {/* Primary Keys Info */}
        <div className="bg-card border border-border/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">مفاتيح البيانات الأساسية</h3>
          <p className="text-foreground/70 text-sm mb-4">تستخدم هذه المفاتيح لربط البيانات عبر الإدارات المختلفة:</p>
          <div className="flex flex-wrap gap-2">
            {dept.primaryKeys.map((key, idx) => (
              <span key={idx} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                {key === 'militaryId' ? 'الرقم العسكري' : 
                 key === 'nationalId' ? 'الرقم الوطني' :
                 key === 'caseNumber' ? 'رقم القضية' : key}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
