interface BilingualCardProps {
  titleAr: string
  titleEn?: string
  children: React.ReactNode
  className?: string
}

export function BilingualCard({ titleAr, titleEn, children, className }: BilingualCardProps) {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm p-4 ${className || ""}`}>
      <div className="mb-2">
        <h3 className="font-semibold text-right" dir="rtl">{titleAr}</h3>
        {titleEn && <p className="text-xs text-muted-foreground text-left">{titleEn}</p>}
      </div>
      {children}
    </div>
  )
}