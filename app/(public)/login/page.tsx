'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Loader2, Lock, Shield } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [militaryId, setMilitaryId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ militaryId, password }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'فشل تسجيل الدخول')
      }

      const accessToken = payload?.data?.accessToken
      const refreshToken = payload?.data?.refreshToken

      if (accessToken) {
        localStorage.setItem('token', accessToken)
      }

      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }

      router.replace('/dashboard')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(57,255,20,0.14),_transparent_32%),linear-gradient(135deg,#020617_0%,#08111f_45%,#020617_100%)] text-slate-100"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-stretch lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex flex-col justify-between gap-12 p-6 md:p-10 lg:p-14">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-slate-900/70 px-4 py-2 text-xs font-semibold text-sky-200 transition-colors hover:bg-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة للرئيسية
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[11px] font-semibold tracking-[0.24em] text-emerald-200">
              <Shield className="h-4 w-4" />
              NSSCP
            </div>
          </div>

          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-medium text-sky-100">
              <Lock className="h-4 w-4" />
              بوابة الدخول الرسمية
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                المنظومة الوطنية الذكية للأمن والسيطرة
              </h1>
              <p className="text-sm leading-7 text-slate-300 md:text-base">
                دخول آمن إلى منصة NSSCP لإدارة العمليات، المطلوبين، التقارير،
                الإدارات، والأدوار والصلاحيات ضمن بيئة موحدة ومحمية.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                'JWT Session Management',
                'RBAC Controlled Access',
                'Audit-Ready Actions',
                'Unified Dashboard Layout',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-300 shadow-[0_0_30px_rgba(15,23,42,0.3)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-400">
            <p className="font-semibold text-slate-200">الدخول محمي ومؤرخ.</p>
            <p>
              يتم إنشاء جلسة NSSCP عبر الكوكيز المشفرة ثم توجيه المستخدم مباشرة
              إلى لوحة التحكم الموحدة.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 md:p-10 lg:p-14">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-800/80 bg-slate-950/85 p-6 shadow-[0_0_80px_rgba(15,23,42,0.55)] backdrop-blur-xl md:p-8">
            <div className="mb-8 space-y-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-[0_0_30px_rgba(57,255,20,0.18)]">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">تسجيل الدخول</h2>
                <p className="mt-1 text-sm text-slate-400">
                  أدخل الرقم العسكري وكلمة المرور للوصول إلى المنظومة.
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="militaryId" className="text-sm font-medium text-slate-200">
                  الرقم العسكري
                </label>
                <input
                  id="militaryId"
                  name="militaryId"
                  value={militaryId}
                  onChange={(event) => setMilitaryId(event.target.value)}
                  autoComplete="username"
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                  placeholder="أدخل الرقم العسكري"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-200">
                  كلمة المرور
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                  placeholder="أدخل كلمة المرور"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'جارٍ التحقق...' : 'دخول'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
