'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface DataRecord {
  militaryId: string
  nationalId: string
  caseNumber: string
  linkedDepartments: string[]
  lastUpdated: string
}

export default function DataIntegrationPage() {
  const [searchType, setSearchType] = useState<'military' | 'national' | 'case'>('military')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<DataRecord[]>([])
  const [searching, setSearching] = useState(false)

  // Mock data for demonstration
  const mockData: Record<string, DataRecord[]> = {
    military: [
      {
        militaryId: 'MIL-001-2024',
        nationalId: '1234567890123',
        caseNumber: 'CASE-2024-001',
        linkedDepartments: ['dept-001', 'dept-002', 'dept-003'],
        lastUpdated: '2024-01-15'
      },
      {
        militaryId: 'MIL-002-2024',
        nationalId: '1234567890124',
        caseNumber: 'CASE-2024-002',
        linkedDepartments: ['dept-001', 'dept-005', 'dept-006'],
        lastUpdated: '2024-01-14'
      }
    ],
    national: [
      {
        militaryId: 'MIL-003-2024',
        nationalId: '1234567890123',
        caseNumber: 'CASE-2024-003',
        linkedDepartments: ['dept-002', 'dept-017'],
        lastUpdated: '2024-01-13'
      }
    ],
    case: [
      {
        militaryId: 'MIL-001-2024',
        nationalId: '1234567890123',
        caseNumber: 'CASE-2024-001',
        linkedDepartments: ['dept-001', 'dept-002'],
        lastUpdated: '2024-01-15'
      }
    ]
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)
    
    setTimeout(() => {
      if (searchQuery) {
        const mockResults = mockData[searchType] || []
        setResults(mockResults.filter(record => {
          if (searchType === 'military') return record.militaryId.includes(searchQuery)
          if (searchType === 'national') return record.nationalId.includes(searchQuery)
          if (searchType === 'case') return record.caseNumber.includes(searchQuery)
          return false
        }))
      } else {
        setResults([])
      }
      setSearching(false)
    }, 500)
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
          <p className="text-foreground/80 text-sm md:text-base font-semibold mt-1">نظام ربط البيانات المركزي</p>
          <p className="text-foreground/60 text-xs md:text-sm mt-2">البحث والربط بين الإدارات</p>
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

      <main className="flex-1 flex flex-col gap-6 p-6 md:p-12 max-w-5xl mx-auto">
        {/* Search Form */}
        <div className="bg-card border border-border/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">البحث في النظام المركزي</h2>
          
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Search Type Selector */}
            <div className="flex gap-4 flex-wrap">
              {[
                { value: 'military' as const, label: 'البحث برقم عسكري' },
                { value: 'national' as const, label: 'البحث برقم وطني' },
                { value: 'case' as const, label: 'البحث برقم قضية' }
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    value={option.value}
                    checked={searchType === option.value}
                    onChange={(e) => setSearchType(e.target.value as typeof searchType)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-foreground">{option.label}</span>
                </label>
              ))}
            </div>

            {/* Search Input */}
            <div className="flex gap-4">
              <input
                type="text"
                placeholder={
                  searchType === 'military' ? 'أدخل الرقم العسكري (مثال: MIL-001-2024)' :
                  searchType === 'national' ? 'أدخل الرقم الوطني (13 رقم)' :
                  'أدخل رقم القضية (مثال: CASE-2024-001)'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {searching ? 'جاري البحث...' : 'بحث'}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-foreground">نتائج البحث ({results.length})</h3>
            {results.map((record, idx) => (
              <div key={idx} className="bg-card border border-border/50 rounded-xl p-6">
                {/* Record Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">الرقم العسكري</p>
                    <p className="text-foreground font-semibold text-lg">{record.militaryId}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">الرقم الوطني</p>
                    <p className="text-foreground font-semibold text-lg">{record.nationalId}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">رقم القضية</p>
                    <p className="text-foreground font-semibold text-lg">{record.caseNumber}</p>
                  </div>
                </div>

                {/* Linked Departments */}
                <div className="mb-6">
                  <p className="text-foreground/70 font-semibold mb-3">الإدارات المرتبطة ({record.linkedDepartments.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {record.linkedDepartments.map((dept, deptIdx) => {
                      const deptNames: Record<string, string> = {
                        'dept-001': 'العمليات المركزية',
                        'dept-002': 'التحقيقات والبحث',
                        'dept-003': 'الاستخبارات',
                        'dept-004': 'التقارير والإحصائيات',
                        'dept-005': 'الاستجابة الميدانية',
                        'dept-006': 'الموارد البشرية',
                        'dept-007': 'التدريب والتطوير',
                        'dept-008': 'التخطيط والاستراتيجية',
                        'dept-009': 'الشؤون المالية',
                        'dept-010': 'الإمدادات واللوجستيات',
                        'dept-011': 'تقنية المعلومات',
                        'dept-012': 'الأمن السيبراني',
                        'dept-013': 'الاتصالات',
                        'dept-014': 'النقل والأسطول',
                        'dept-015': 'الخدمات الطبية',
                        'dept-016': 'العلاقات العامة',
                        'dept-017': 'الشؤون القانونية',
                        'dept-018': 'الأرشيف والوثائق',
                        'dept-019': 'التفتيش والرقابة',
                        'dept-020': 'التقييم والأداء',
                        'dept-021': 'السلامة والصحة المهنية',
                        'dept-022': 'الشؤون الاجتماعية',
                        'dept-023': 'الشؤون الإدارية',
                        'dept-024': 'التطوير والابتكار'
                      }
                      return (
                        <span key={deptIdx} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                          {deptNames[dept] || dept}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Last Updated */}
                <div className="text-foreground/60 text-sm border-t border-border/30 pt-4">
                  آخر تحديث: {new Date(record.lastUpdated).toLocaleDateString('ar-YE')}
                </div>
              </div>
            ))}
          </div>
        ) : searching ? (
          <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
            <p className="text-foreground/70">جاري البحث...</p>
          </div>
        ) : searchQuery ? (
          <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
            <p className="text-foreground/70">لم يتم العثور على نتائج</p>
          </div>
        ) : null}

        {/* System Information */}
        <div className="bg-card border border-border/50 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-foreground mb-6">معلومات النظام</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-input p-4 rounded-lg">
              <p className="text-primary font-semibold mb-2">مفاتيح ربط البيانات</p>
              <ul className="text-foreground/70 text-sm space-y-2">
                <li>• الرقم العسكري</li>
                <li>• الرقم الوطني</li>
                <li>• رقم القضية</li>
              </ul>
            </div>

            <div className="bg-input p-4 rounded-lg">
              <p className="text-primary font-semibold mb-2">الإدارات المتصلة</p>
              <p className="text-foreground/70 text-sm">
                يتم ربط البيانات بين جميع الإدارات المتخصصة عبر هذه المفاتيح الثلاثة
              </p>
            </div>

            <div className="bg-input p-4 rounded-lg">
              <p className="text-primary font-semibold mb-2">الأمان والخصوصية</p>
              <p className="text-foreground/70 text-sm">
                جميع البيانات محمية بتشفير قوي وصلاحيات وصول محدودة
              </p>
            </div>
          </div>

          {/* Integration Info */}
          <div className="border-t border-border/30 pt-8">
            <h4 className="text-lg font-bold text-foreground mb-4">كيفية عمل النظام</h4>
            <div className="space-y-4 text-foreground/70">
              <p>
                <span className="font-semibold text-foreground">1. البحث المركزي:</span> يمكن البحث عن أي عنصر أو قضية باستخدام أحد المفاتيح الثلاثة
              </p>
              <p>
                <span className="font-semibold text-foreground">2. الربط الديناميكي:</span> يتم ربط جميع السجلات المتعلقة بنفس الشخص أو القضية تلقائياً
              </p>
              <p>
                <span className="font-semibold text-foreground">3. التحديث الفوري:</span> أي تحديث في إدارة ينعكس على جميع الإدارات الأخرى المرتبطة
              </p>
              <p>
                <span className="font-semibold text-foreground">4. التقارير المتكاملة:</span> يمكن الحصول على تقرير شامل يجمع بيانات من جميع الإدارات
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
