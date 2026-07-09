interface HeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
}

export default function Header({ title, subtitle, showBackButton }: HeaderProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button className="p-2 rounded-lg hover:bg-border/30 transition-colors">
            ←
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-right" dir="rtl">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground text-right mt-1" dir="rtl">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}