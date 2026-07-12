import Link from 'next/link'

interface BilingualCardProps {
  titleAr?: string
  titleEn?: string
  children?: React.ReactNode
  className?: string
  href?: string
  arabicTitle?: string
  englishTitle?: string
  arabicDescription?: string
  icon?: React.ReactNode
  variant?: 'default' | 'highlighted'
  stat?: {
    label: string
    value: string
  }
}

export function BilingualCard(props: BilingualCardProps) {
  const {
    titleAr,
    titleEn,
    children,
    className,
    href,
    arabicTitle,
    englishTitle,
    arabicDescription,
    icon,
    variant = 'default',
    stat,
  } = props

  const isLegacyCard = Boolean(
    href || arabicTitle || englishTitle || arabicDescription || icon || stat
  )

  if (isLegacyCard) {
    const card = (
      <div
        className={`group flex h-full flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all ${
          variant === 'highlighted'
            ? 'border-primary/40 bg-primary/5 hover:-translate-y-1 hover:border-primary/60'
            : 'border-border hover:-translate-y-0.5 hover:border-border/80'
        } ${className || ''}`}
      >
        <div className="flex h-full flex-col gap-4 p-5">
          {icon ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-2xl">
              {icon}
            </div>
          ) : null}

          <div className="space-y-2 text-right" dir="rtl">
            <h3 className="text-lg font-semibold text-foreground">
              {arabicTitle || titleAr || ''}
            </h3>
            {(englishTitle || titleEn) && (
              <p className="text-sm text-muted-foreground text-left">
                {englishTitle || titleEn}
              </p>
            )}
            {arabicDescription && (
              <p className="text-sm leading-6 text-foreground/75">
                {arabicDescription}
              </p>
            )}
          </div>
        </div>

        {(stat || href) && (
          <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-4 text-sm">
            {stat ? (
              <div className="text-right" dir="rtl">
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="font-semibold text-foreground">{stat.value}</div>
              </div>
            ) : (
              <span className="text-muted-foreground">NSSCP</span>
            )}
            {href ? (
              <span className="text-xs font-semibold text-primary transition-transform group-hover:translate-x-1">
                عرض التفاصيل
              </span>
            ) : null}
          </div>
        )}
      </div>
    )

    if (href) {
      return (
        <Link href={href} className="block h-full">
          {card}
        </Link>
      )
    }

    return card
  }

  return (
    <div className={`rounded-lg border bg-card p-4 text-card-foreground shadow-sm ${className || ''}`}>
      <div className="mb-2">
        <h3 className="font-semibold text-right" dir="rtl">
          {titleAr}
        </h3>
        {titleEn && <p className="text-xs text-muted-foreground text-left">{titleEn}</p>}
      </div>
      {children}
    </div>
  )
}
