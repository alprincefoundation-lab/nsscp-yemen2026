interface BilingualHeaderProps {
  titleAr: string
  titleEn?: string
  subtitleAr?: string
  subtitleEn?: string
}

export function BilingualHeader({ titleAr, titleEn, subtitleAr, subtitleEn }: BilingualHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-right" dir="rtl">{titleAr}</h1>
      {titleEn && <p className="text-sm text-muted-foreground text-left">{titleEn}</p>}
      {subtitleAr && <p className="text-sm text-muted-foreground text-right" dir="rtl">{subtitleAr}</p>}
      {subtitleEn && <p className="text-xs text-muted-foreground text-left">{subtitleEn}</p>}
    </div>
  )
}