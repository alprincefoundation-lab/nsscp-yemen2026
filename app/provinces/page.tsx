'use client'

import Image from 'next/image'
import ProvincesGrid from '@/components/provinces-grid'

export default function ProvincesPage() {
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
          <p className="text-foreground/80 text-sm font-semibold mt-1">لوحات المحافظات الإقليمية</p>
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
              <h2 className="text-2xl font-bold text-foreground">مركز المحافظات والمناطق</h2>
              <p className="text-foreground/70">
                مراقبة شاملة لأداء جميع المحافظات الإقليمية والمراكز العملياتية. يمكنك الوصول إلى تفاصيل كل محافظة ومراقبة أداء الفرق والوحدات العاملة بها.
              </p>
            </div>
          </div>

          {/* Provinces Grid Section */}
          <div className="p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
              <ProvincesGrid />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
