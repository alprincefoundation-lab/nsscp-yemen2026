import Link from "next/link"

interface NavItem {
  href: string
  labelAr: string
  labelEn?: string
  icon?: string
}

interface MainNavProps {
  items?: NavItem[]
}

const defaultItems: NavItem[] = [
  { href: "/", labelAr: "الرئيسية", labelEn: "Home" },
  { href: "/dashboard", labelAr: "لوحة القيادة", labelEn: "Dashboard" },
  { href: "/departments", labelAr: "الإدارات", labelEn: "Departments" },
  { href: "/wanted-persons", labelAr: "المطلوبين", labelEn: "Wanted Persons" },
  { href: "/reports", labelAr: "التقارير", labelEn: "Reports" },
  { href: "/settings", labelAr: "الإعدادات", labelEn: "Settings" },
]

export default function MainNav({ items = defaultItems }: MainNavProps) {
  return (
    <nav className="flex items-center gap-4 px-4 py-2 border-b">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          {item.labelAr}
        </Link>
      ))}
    </nav>
  )
}