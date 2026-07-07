'use client'

import { useState } from 'react'
import MainNav from '@/components/main-nav'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications: true,
    autoRefresh: true,
    refreshInterval: 30,
    language: 'ar'
  })

  const handleChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      <MainNav />
      
      <header className="w-full px-6 md:px-12 py-6 border-b border-border/50">
        <h1 className="text-3xl font-bold text-primary mb-2">الإعدادات</h1>
        <p className="text-foreground/70">تخصيص تجربة استخدام المنظومة</p>
      </header>

      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* General Settings */}
          <div className="bg-card border border-border/50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">الإعدادات العامة</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">المظهر</label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="w-full px-4 py-2 bg-border/20 border border-border/50 rounded-lg text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="dark">مظهم داكن</option>
                  <option value="light">مظهم فاتح</option>
                  <option value="auto">تلقائي</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">اللغة</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-4 py-2 bg-border/20 border border-border/50 rounded-lg text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-card border border-border/50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">إعدادات الإشعارات</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">تفعيل الإشعارات</label>
                <button
                  onClick={() => handleChange('notifications', !settings.notifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.notifications ? 'bg-primary' : 'bg-border/50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">التحديث التلقائي</label>
                <button
                  onClick={() => handleChange('autoRefresh', !settings.autoRefresh)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.autoRefresh ? 'bg-primary' : 'bg-border/50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {settings.autoRefresh && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">فترة التحديث (بالثواني)</label>
                  <input
                    type="number"
                    value={settings.refreshInterval}
                    onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-border/20 border border-border/50 rounded-lg text-foreground focus:outline-none focus:border-primary"
                    min="10"
                    max="300"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-card border border-border/50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">حساب المستخدم</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">اسم المستخدم</label>
                <p className="text-foreground/70">SUPER_ADMIN</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">المستوى</label>
                <p className="text-foreground/70">مسؤول عام</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">البريد الإلكتروني</label>
                <p className="text-foreground/70">admin@nscp.gov.sa</p>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-card border border-border/50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">الأمان</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-border/20 text-foreground border border-border/50 rounded-lg hover:bg-border/40 transition-colors text-sm font-medium">
                تغيير كلمة المرور
              </button>
              <button className="w-full px-4 py-2 bg-border/20 text-foreground border border-border/50 rounded-lg hover:bg-border/40 transition-colors text-sm font-medium">
                إدارة الجلسات النشطة
              </button>
              <button className="w-full px-4 py-2 bg-red-500/20 text-red-600 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium">
                تسجيل خروج من جميع الأجهزة
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button className="flex-1 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
              حفظ التغييرات
            </button>
            <button className="flex-1 px-6 py-2 bg-border/20 text-foreground border border-border/50 rounded-lg hover:bg-border/40 transition-colors font-medium">
              إعادة تعيين
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
