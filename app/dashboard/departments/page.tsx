'use client'

import Image from 'next/image'
import DepartmentsGrid from '@/components/departments-grid'

export default function DepartmentsPage() {
  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6 lg:p-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-800/80 bg-[linear-gradient(135deg,rgba(3,7,18,0.94),rgba(15,23,42,0.96))] p-6 shadow-[0_0_50px_rgba(15,23,42,0.35)] md:p-8">
        <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="flex items-center justify-start flex-shrink-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-FMZYi0WL6JLMKkX7WP94vLkq4tU9xe.png"
              alt="Ministry of Interior"
              width={80}
              height={80}
              className="h-16 w-auto"
            />
          </div>

          <div className="flex-1 space-y-3 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold tracking-[0.28em] text-emerald-200">
              NSSCP
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                الإدارات والأقسام
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                عرض موحد للإدارات والوحدات التنظيمية داخل المنظومة
              </p>
            </div>
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
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800/80 bg-slate-950/70 p-6 shadow-[0_0_30px_rgba(15,23,42,0.25)] md:p-8">
        <div className="max-w-6xl space-y-4">
          <h2 className="text-2xl font-bold text-white">مركز الإدارات والأقسام</h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-400">
            منصة متكاملة لإدارة جميع الأقسام والإدارات التابعة للمنظومة الوطنية للأمن
            والسيطرة. يمكنك متابعة الأداء العام والدخول إلى تفاصيل كل إدارة من
            داخل نفس الواجهة الموحدة.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="mb-1 text-xs text-slate-400">عدد الإدارات</p>
              <p className="text-2xl font-bold text-cyan-300">25</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="mb-1 text-xs text-slate-400">إجمالي الموظفين</p>
              <p className="text-2xl font-bold text-cyan-300">1,250+</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="mb-1 text-xs text-slate-400">متوسط الكفاءة</p>
              <p className="text-2xl font-bold text-emerald-300">90%</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800/80 bg-slate-950/70 p-4 md:p-6">
        <DepartmentsGrid />
      </section>
    </div>
  )
}
