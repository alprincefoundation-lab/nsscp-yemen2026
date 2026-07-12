import Link from 'next/link'
import {
  Archive,
  ArrowUpRight,
  Building2,
  FileText,
  Key,
  Layers,
  Radio,
  Settings,
  Shield,
  Users,
} from 'lucide-react'

const stats = [
  { label: 'المحافظات', value: '22' },
  { label: 'الإدارات', value: '24' },
  { label: 'المستخدمون', value: '1,248' },
  { label: 'الأنظمة', value: '53+' },
]

const modules = [
  {
    href: '/dashboard/command-center',
    title: 'لوحة القيادة',
    description: 'مركز القيادة والسيطرة والإنذار المباشر.',
    icon: Radio,
  },
  {
    href: '/dashboard/operations',
    title: 'العمليات',
    description: 'متابعة العمليات الميدانية والتنبيهات العاجلة.',
    icon: Shield,
  },
  {
    href: '/dashboard/cases',
    title: 'القضايا',
    description: 'إدارة ملفات القضايا والتحقيقات المرتبطة بها.',
    icon: FileText,
  },
  {
    href: '/dashboard/wanted-persons',
    title: 'المطلوبون',
    description: 'قاعدة المطلوبين والملاحقات الأمنية.',
    icon: Users,
  },
  {
    href: '/dashboard/reports',
    title: 'التقارير',
    description: 'التقارير الدورية والتشغيلية والإحصائية.',
    icon: FileText,
  },
  {
    href: '/dashboard/archive',
    title: 'الأرشيف',
    description: 'الوصول إلى البيانات والسجلات المؤرشفة.',
    icon: Archive,
  },
  {
    href: '/dashboard/departments',
    title: 'الإدارات',
    description: 'عرض الإدارات والوحدات التنظيمية.',
    icon: Building2,
  },
  {
    href: '/dashboard/sections',
    title: 'الأقسام',
    description: 'تنظيم الأقسام والوحدات الفرعية داخل الهيكل.',
    icon: Layers,
  },
  {
    href: '/dashboard/users',
    title: 'المستخدمون',
    description: 'إدارة الحسابات والقيود التشغيلية.',
    icon: Users,
  },
  {
    href: '/dashboard/roles',
    title: 'الأدوار',
    description: 'إدارة الأدوار والصلاحيات المرتبطة بها.',
    icon: Key,
  },
  {
    href: '/dashboard/settings',
    title: 'الإعدادات',
    description: 'إعدادات المنظومة العامة والأمان.',
    icon: Settings,
  },
]

export default function DashboardHomePage() {
  return (
    <div dir="rtl" className="space-y-8 p-4 md:p-6 lg:p-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-800/80 bg-[linear-gradient(135deg,rgba(3,7,18,0.94),rgba(15,23,42,0.96))] p-6 shadow-[0_0_50px_rgba(15,23,42,0.4)] md:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold tracking-[0.28em] text-emerald-200">
              <Shield className="h-4 w-4" />
              NSSCP DASHBOARD
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                لوحة القيادة المركزية
              </h1>
              <p className="max-w-xl text-sm leading-7 text-slate-300 md:text-base">
                بوابة تشغيل موحدة لإدارة العمليات، المطلوبين، القضايا، الإدارات،
                التقارير، والصلاحيات ضمن بيئة حكومية مؤمّنة.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/command-center"
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/20"
              >
                فتح مركز القيادة
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/wanted-persons"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-slate-500"
              >
                الوصول إلى المطلوبين
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[420px]">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-4 text-right shadow-[0_0_24px_rgba(15,23,42,0.35)]"
              >
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-black text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon

          return (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-3xl border border-slate-800/80 bg-slate-950/70 p-5 shadow-[0_0_24px_rgba(15,23,42,0.25)] transition-transform duration-200 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-slate-900/90"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{module.title}</h2>
                    <p className="mt-1 text-sm text-slate-400">{module.description}</p>
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-500 transition-colors group-hover:text-cyan-300" />
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
