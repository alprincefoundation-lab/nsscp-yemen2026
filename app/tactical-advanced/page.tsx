'use client'

import Image from 'next/image'
import CallPanel from '@/components/call-panel'
import LiveMap from '@/components/live-map'
import MetricsDashboard from '@/components/metrics-dashboard'

export default function TacticalAdvancedDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
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
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">NSSCP</h1>
          <p className="text-foreground/80 text-sm md:text-base font-semibold mt-1">المنظومة الوطنية للأمن والسيطرة</p>
          <p className="text-foreground/60 text-xs md:text-sm mt-2">غرفة العمليات المركزية</p>
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

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Section: Call Panel and Live Map */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Call Panel */}
            <div className="lg:col-span-1">
              <CallPanel />
            </div>

            {/* Center-Right: Live Map */}
            <div className="lg:col-span-2 h-96 lg:h-full min-h-96">
              <LiveMap />
            </div>
          </div>

          {/* Bottom Section: Metrics Dashboard */}
          <div className="border-t border-border/50 pt-8">
            <MetricsDashboard />
          </div>
        </div>
      </main>
    </div>
  )
}
