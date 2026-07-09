export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground" dir="rtl">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1">/</span>}
          {item.href ? (
            <a href={item.href} className="hover:text-foreground transition-colors">{item.label}</a>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}