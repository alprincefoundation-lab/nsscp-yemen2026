'use client'

import Image from 'next/image'
import DepartmentsGrid from '@/components/departments-grid'

export default function DepartmentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 md:px-12 py-6 border-b border-border/50 flex items-center justify-between gap-8 sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-start flex-shrink-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-FMZYi0WL6JLMKkX7WP94vLkq4tU9xe.png"
            alt="Ministry of Interior"
            width={80}
            height={80}
            className="h-16 w-auto"
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">NSSCP</h1>
          <p className="text-foreground/80 text-sm font-semibold mt-1">الإدارات والأقسام</p>
        </div>

        <div className="flex items-center justify-end flex-shrink-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-wyCF4MHimWpEuWCgujMveUt5HdEcjQ.png"
            alt="National Emblem"
            width={80}
            height={80}
            className="h-16 w-auto"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full">
          {/* Info Section */}
          <div className="bg-card border-b border-border/50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-foreground">مركز الإدارات والأقسام</h2>
              <p className="text-foreground/70">
                منصة متكاملة لإدارة جميع الأقسام والإدارات التابعة للمنظومة الوطنية للأمن والسيطرة. يمكنك متابعة أداء كل إدارة والدخول إلى تفاصيلها الكاملة.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-border/20 rounded-lg p-4">
                  <p className="text-xs text-foreground/60 mb-1">عدد الإدارات</p>
                  <p className="text-2xl font-bold text-primary">25</p>
                </div>
                <div className="bg-border/20 rounded-lg p-4">
                  <p className="text-xs text-foreground/60 mb-1">إجمالي الموظفين</p>
                  <p className="text-2xl font-bold text-primary">1,250+</p>
                </div>
                <div className="bg-border/20 rounded-lg p-4">
                  <p className="text-xs text-foreground/60 mb-1">متوسط الكفاءة</p>
                  <p className="text-2xl font-bold text-primary">90%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Departments Grid Section */}
          <div className="p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
              <DepartmentsGrid />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
