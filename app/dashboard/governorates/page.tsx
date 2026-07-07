"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { Shield, Activity, RefreshCw } from 'lucide-react';

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0b0f14] text-gray-100 p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-[#11161d] p-6 rounded-xl border border-gray-800 flex justify-between items-center shadow-xl">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Shield className="h-8 w-8 text-[#00ff66]" />
          <div>
            <h1 className="text-xl font-black text-white">إدارة المحافظات</h1>
            <p className="text-xs text-gray-400">منظومة القيادة والسيطرة الاستراتيجية الموحدة</p>
          </div>
        </div>
        <div className="bg-[#17202a] px-4 py-2 rounded border border-gray-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00ff66]" />
          <span className="text-xs text-[#00ff66]">الحالة: متصل بالخادم المركزي</span>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-[#11161d] p-6 rounded-xl border border-gray-800 text-center space-y-3">
        <RefreshCw className="h-12 w-12 text-[#00ff66] mx-auto animate-spin" style={{ animationDuration: '4s' }} />
        <h3 className="text-lg font-bold text-white">جاري مزامنة قاعدة البيانات السيادية</h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          يتم الآن تحميل السجلات وتحديث الهيكل الهرمي من الخوادم الوطنية المركزية.
        </p>
      </div>
    </div>
  );
}
