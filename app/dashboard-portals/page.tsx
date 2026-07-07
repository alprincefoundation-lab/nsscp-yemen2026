"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Zap,
  BookOpen,
  BarChart3,
  Users,
  Shield,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function DashboardPortalsPage() {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const cardElements = document.querySelectorAll("[data-card]");
    cardElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const cardIndex = parseInt((el as HTMLElement).dataset.card || "0");
      if (rect.top < window.innerHeight * 0.75) {
        setVisibleCards((prev) => new Set(prev).add(cardIndex));
      }
    });
  }, [scrollY]);

  const portals = [
    {
      id: 0,
      title: "دليل مهندس المنظومات الأمنية",
      description:
        "منصة توثيق وتحليل شاملة لتصميم المنظومات الأمنية المركزية مع التركيز على تكامل البيانات",
      icon: BookOpen,
      href: "/architect-guide",
      features: [
        "تحليل الهيكل التنظيمي",
        "تصميم استمارات البيانات",
        "توثيق العلاقات",
        "عروض تقديمية",
      ],
      color: "from-blue-500 to-blue-600",
      badge: "التوثيق",
    },
    {
      id: 1,
      title: "لوحة التحكم التكتيكية (NSSCP)",
      description:
        "منظومة القيادة والسيطرة الوطنية للأمن - لوحة تحكم متقدمة للعمليات الأمنية الميدانية",
      icon: Zap,
      href: "/tactical-dashboard",
      features: [
        "مراقبة العمليات الحية",
        "إدارة الدوريات",
        "تقارير فورية",
        "خرائط تفاعلية",
      ],
      color: "from-emerald-500 to-emerald-600",
      badge: "التطبيق",
    },
    {
      id: 2,
      title: "التحليلات والإحصائيات",
      description:
        "لوحة بيانات شاملة لتحليل الأداء والإحصائيات الأمنية على مستوى المحافظات والإدارات",
      icon: BarChart3,
      href: "/analytics",
      features: [
        "تقارير يومية",
        "إحصائيات شهرية",
        "رسوم بيانية متقدمة",
        "تصدير البيانات",
      ],
      color: "from-amber-500 to-amber-600",
      badge: "التحليل",
    },
    {
      id: 3,
      title: "إدارة الموارد البشرية",
      description:
        "نظام متكامل لإدارة الكوادر الأمنية والضباط والأفراد مع تتبع الترقيات والنقل",
      icon: Users,
      href: "/organizational-hierarchy",
      features: [
        "إدارة الموظفين",
        "تتبع الترقيات",
        "إدارة الإجازات",
        "التقييمات السنوية",
      ],
      color: "from-purple-500 to-purple-600",
      badge: "الموارد",
    },
  ];

  const stats = [
    { label: "إدارات تخصصية", value: "24", icon: Shield },
    { label: "محافظات مراقبة", value: "16", icon: BarChart3 },
    { label: "موظفين نشطين", value: "5,200", icon: Users },
    { label: "عمليات يومية", value: "1,250", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom duration-700">
          <div className="mb-6 inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
            <span className="text-blue-400 text-sm font-medium">
              منظومة أمنية متكاملة
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            المنظومة الوطنية للأمن
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              {" "}
              والسيطرة المركزية
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            منصة متكاملة تجمع بين التوثيق الاحترافي والتطبيق العملي لإدارة المنظومات
            الأمنية المركزية مع ضمان تكامل البيانات والعمليات
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-700/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="text-center animate-in fade-in duration-700"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portals Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-16 animate-in fade-in slide-in-from-left duration-700">
            <h2 className="text-4xl font-bold mb-4">البوابات الرئيسية</h2>
            <p className="text-slate-300 text-lg">
              اختر البوابة المناسبة للوصول إلى الخدمات والأدوات التي تحتاجها
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {portals.map((portal) => {
              const Icon = portal.icon;
              const isVisible = visibleCards.has(portal.id);
              return (
                <a
                  key={portal.id}
                  href={portal.href}
                  data-card={portal.id}
                  className={`group relative bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-xl p-8 hover:border-slate-500/50 transition-all duration-500 overflow-hidden hover:scale-105 hover:shadow-xl ${
                    isVisible
                      ? "animate-in fade-in slide-in-from-left duration-700"
                      : "opacity-0 translate-x-8"
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${portal.id * 100}ms` : "0ms",
                  }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${portal.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-6 h-6 text-blue-400 group-hover:rotate-12 transition-transform duration-300" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs bg-slate-700/50 border border-slate-600/50 text-slate-300 group-hover:bg-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300">
                        {portal.badge}
                      </span>
                    </div>

                    {/* Title and Description */}
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors duration-300">
                      {portal.title}
                    </h3>
                    <p className="text-slate-300 mb-6 group-hover:text-slate-200 transition-colors duration-300">
                      {portal.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {portal.features.map((feature, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-slate-300 group-hover:text-slate-200 transition-colors duration-300"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center text-blue-400 font-medium group-hover:gap-2 transition-all duration-300">
                      <span>الدخول إلى البوابة</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integration Benefits */}
      <section className="py-20 border-t border-slate-700/50">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-16 animate-in fade-in slide-in-from-right duration-700">
            <h2 className="text-4xl font-bold mb-4">مميزات النظام المتكامل</h2>
            <p className="text-slate-300 text-lg">
              منصة موحدة توفر جميع الأدوات اللازمة لإدارة المنظومات الأمنية بكفاءة عالية
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "توثيق شامل",
                description:
                  "توثيق كامل للمنظومات الأمنية مع تحليل تفصيلي للهياكل والعلاقات",
                icon: BookOpen,
              },
              {
                title: "تطبيق عملي",
                description:
                  "لوحة تحكم متقدمة لتطبيق المنظومات على أرض الواقع مع مراقبة فورية",
                icon: Zap,
              },
              {
                title: "تكامل البيانات",
                description:
                  "ربط سلس بين جميع الإدارات والعمليات مع ضمان سلاسة تدفق المعلومات",
                icon: Shield,
              },
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-xl p-8 hover:border-slate-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-in fade-in duration-700"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-slate-300">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-slate-700/50">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center animate-in fade-in slide-in-from-bottom duration-700">
            <h2 className="text-4xl font-bold mb-6">ابدأ الآن</h2>
            <p className="text-xl text-slate-300 mb-8">
              اختر البوابة المناسبة واستكشف جميع الميزات المتاحة
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg px-8 py-6 hover:scale-105 transition-transform duration-300 active:scale-95">
                دخول دليل المهندس
                <ArrowRight className="w-5 h-5 mr-2" />
              </Button>
              <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-lg px-8 py-6 hover:scale-105 transition-transform duration-300 active:scale-95">
                دخول لوحة التحكم
                <Zap className="w-5 h-5 mr-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-12 bg-slate-900/50 animate-in fade-in duration-700">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center hover:rotate-12 transition-transform duration-300">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-semibold">المنظومة الوطنية للأمن والسيطرة</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2026 جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
