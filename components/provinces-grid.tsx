interface Province {
  id: string
  nameAr: string
  nameEn?: string
  population?: number
}

interface ProvincesGridProps {
  provinces?: Province[]
}

export default function ProvincesGrid({ provinces = [] }: ProvincesGridProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-3 text-right" dir="rtl">المحافظات</h3>
      {provinces.length === 0 ? (
        <p className="text-sm text-muted-foreground text-right" dir="rtl">لا توجد محافظات</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {provinces.map((p) => (
            <div key={p.id} className="p-2 bg-muted rounded text-sm text-right" dir="rtl">
              {p.nameAr}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}