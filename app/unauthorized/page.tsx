"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, Lock, ArrowLeft, Home } from "lucide-react";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromPath = searchParams.get("from") || "/dashboard";

  return (
    <div className="min-h-screen bg-[#050b0e] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-red-500/5" />
          <div className="relative w-full h-full flex items-center justify-center">
            <Shield className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* Status */}
        <div>
          <h1 className="text-5xl font-black text-white tracking-tight">403</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Lock className="w-4 h-4 text-red-400" />
            <p className="text-lg font-bold text-red-400">وصول غير مصرح</p>
          </div>
        </div>

        {/* Message */}
        <div className="bg-[#0d141e] border border-[#1b2b3a] rounded-xl p-5 space-y-3">
          <p className="text-sm text-gray-300 leading-relaxed">
            ليس لديك الصلاحية الكافية للوصول إلى هذا المورد.
          </p>
          <p className="text-[11px] text-gray-500 font-mono leading-relaxed">
            تم تسجيل محاولة الوصول هذه في سجل التدقيق الأمني. إذا كنت تعتقد
            أن هذا خطأ، يرجى التواصل مع مدير النظام.
          </p>
          {fromPath && (
            <div className="text-[10px] text-gray-600 font-mono bg-[#0a1018] rounded px-3 py-1.5 inline-block">
              المسار المطلوب: <span className="text-gray-400">{fromPath}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#122320] border border-green-500/20 text-[#00ff66] text-sm hover:bg-[#122320]/80 transition-colors"
          >
            <Home className="w-4 h-4" />
            لوحة التحكم
          </button>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0d141e] border border-[#1b2b3a] text-gray-300 text-sm hover:bg-[#1a2744] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </button>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-gray-600 font-mono">
          NSSCP — Unified Smart Command & Control Platform
        </p>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense>
      <UnauthorizedContent />
    </Suspense>
  );
}