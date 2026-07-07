'use client'

import { useState } from 'react'
import { departments } from '@/lib/departments-schema'

export default function DepartmentsAnalyticsPage() {
  const [selectedCategory, setSelectedCategory] = useState<'budget' | 'staff' | 'workload'>('budget')

  const totalStaff = departments.reduce((sum, d) => sum + d.staffCount, 0)
  const totalBudget = departments.reduce((sum, d) => sum + d.budget, 0)
  const avgStaffPerDept = Math.round(totalStaff / departments.length)
  const totalConnections = departments.reduce((sum, d) => sum + d.linkedDepartments.length, 0)

  // Sort departments by selected category
  const sortedDepts = [...departments].sort((a, b) => {
    if (selectedCategory === 'budget') return b.budget - a.budget
    if (selectedCategory === 'staff') return b.staffCount - a.staffCount
    return b.linkedDepartments.length - a.linkedDepartments.length
  })

  const getPercentage = (value: number, total: number) => ((value / total) * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <header className="w-full px-6 md:px-12 py-6 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-balance">تحليلات الإدارات</h1>
        <p className="text-foreground/70">إحصائيات شاملة عن جميع الإدارات المتخصصة</p>
      </header>

      <main className="p-6 md:p-12 space-y-12">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-xl p-6">
            <p className="text-foreground/70 text-sm font-medium mb-2">إجمالي الإدارات</p>
            <p className="text-4xl font-bold text-primary">{departments.length}</p>
            <p className="text-xs text-foreground/60 mt-2">إدارة متخصصة</p>
          </div>

          <div className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 rounded-xl p-6">
            <p className="text-foreground/70 text-sm font-medium mb-2">إجمالي الموظفين</p>
            <p className="text-4xl font-bold text-accent">{totalStaff.toLocaleString()}</p>
            <p className="text-xs text-foreground/60 mt-2">متوسط {avgStaffPerDept} لكل إدارة</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 rounded-xl p-6">
            <p className="text-foreground/70 text-sm font-medium mb-2">الميزانية الإجمالية</p>
            <p className="text-4xl font-bold text-green-400">{(totalBudget / 1000000).toFixed(0)}M</p>
            <p className="text-xs text-foreground/60 mt-2">متوسط {((totalBudget / departments.length) / 1000000).toFixed(1)}M</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 rounded-xl p-6">
            <p className="text-foreground/70 text-sm font-medium mb-2">الارتباطات</p>
            <p className="text-4xl font-bold text-blue-400">{totalConnections}</p>
            <p className="text-xs text-foreground/60 mt-2">ربط بين الإدارات</p>
          </div>
        </div>

        {/* Category Selector */}
        <div className="flex gap-4 justify-center flex-wrap">
          {[
            { value: 'budget' as const, label: 'حسب الميزانية' },
            { value: 'staff' as const, label: 'حسب عدد الموظفين' },
            { value: 'workload' as const, label: 'حسب الارتباطات' }
          ].map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-6 py-2 rounded-lg transition-all ${
                selectedCategory === cat.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-border/20 text-foreground hover:bg-border/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Departments Ranking */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">ترتيب الإدارات</h2>
          <div className="space-y-3">
            {sortedDepts.map((dept, index) => {
              let value = 0
              let total = 0
              let label = ''
              let color = ''

              if (selectedCategory === 'budget') {
                value = dept.budget
                total = totalBudget
                label = `${(value / 1000000).toFixed(1)}M`
                color = 'from-primary to-primary/50'
              } else if (selectedCategory === 'staff') {
                value = dept.staffCount
                total = totalStaff
                label = `${value} موظف`
                color = 'from-accent to-accent/50'
              } else {
                value = dept.linkedDepartments.length
                total = totalConnections
                label = `${value} ارتباط`
                color = 'from-blue-500 to-blue-500/50'
              }

              const percentage = getPercentage(value, total)

              return (
                <div key={dept.id} className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-primary w-8">{index + 1}</span>
                      <div>
                        <h4 className="font-semibold text-foreground">{dept.nameAr}</h4>
                        <p className="text-xs text-foreground/60">{dept.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{label}</p>
                      <p className="text-xs text-foreground/60">{percentage}%</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-border/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${color} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Department Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">أعلى الإدارات في الميزانية</h3>
            <div className="space-y-3">
              {[...departments].sort((a, b) => b.budget - a.budget).slice(0, 5).map((dept, idx) => (
                <div key={dept.id} className="flex items-center justify-between p-3 bg-border/20 rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{dept.nameAr}</p>
                    <p className="text-xs text-foreground/60">{dept.code}</p>
                  </div>
                  <span className="font-bold text-primary">{(dept.budget / 1000000).toFixed(1)}M</span>
                </div>
              ))}
            </div>
          </div>

          {/* Largest Teams */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">أكبر الفرق بعدد الموظفين</h3>
            <div className="space-y-3">
              {[...departments].sort((a, b) => b.staffCount - a.staffCount).slice(0, 5).map((dept, idx) => (
                <div key={dept.id} className="flex items-center justify-between p-3 bg-border/20 rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{dept.nameAr}</p>
                    <p className="text-xs text-foreground/60">{dept.code}</p>
                  </div>
                  <span className="font-bold text-accent">{dept.staffCount} موظف</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distribution Charts Info */}
        <div className="bg-card border border-border/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">التوزيع حسب الفئات</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Budget Distribution */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">توزيع الميزانية</h4>
              <div className="space-y-2">
                {[
                  { range: '> 1.5M', depts: departments.filter(d => d.budget > 1500000).length },
                  { range: '1-1.5M', depts: departments.filter(d => d.budget >= 1000000 && d.budget <= 1500000).length },
                  { range: '< 1M', depts: departments.filter(d => d.budget < 1000000).length }
                ].map(cat => (
                  <div key={cat.range} className="flex items-center justify-between text-sm">
                    <span className="text-foreground/70">{cat.range}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-border/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${(cat.depts / departments.length) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-foreground">{cat.depts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Distribution */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">توزيع الموظفين</h4>
              <div className="space-y-2">
                {[
                  { range: '> 200', depts: departments.filter(d => d.staffCount > 200).length },
                  { range: '100-200', depts: departments.filter(d => d.staffCount >= 100 && d.staffCount <= 200).length },
                  { range: '< 100', depts: departments.filter(d => d.staffCount < 100).length }
                ].map(cat => (
                  <div key={cat.range} className="flex items-center justify-between text-sm">
                    <span className="text-foreground/70">{cat.range}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-border/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent" 
                          style={{ width: `${(cat.depts / departments.length) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-foreground">{cat.depts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Connections Distribution */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">توزيع الارتباطات</h4>
              <div className="space-y-2">
                {[
                  { range: '> 5', depts: departments.filter(d => d.linkedDepartments.length > 5).length },
                  { range: '3-5', depts: departments.filter(d => d.linkedDepartments.length >= 3 && d.linkedDepartments.length <= 5).length },
                  { range: '< 3', depts: departments.filter(d => d.linkedDepartments.length < 3).length }
                ].map(cat => (
                  <div key={cat.range} className="flex items-center justify-between text-sm">
                    <span className="text-foreground/70">{cat.range}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-border/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(cat.depts / departments.length) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-foreground">{cat.depts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
