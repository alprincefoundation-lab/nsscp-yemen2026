interface OrgNode {
  id: string
  nameAr: string
  nameEn?: string
  role?: string
  children?: OrgNode[]
}

interface OrgChartProps {
  data?: OrgNode | null
}

export default function OrgChart({ data }: OrgChartProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-3 text-right" dir="rtl">الهيكل التنظيمي</h3>
      {!data ? (
        <p className="text-sm text-muted-foreground text-right" dir="rtl">لا توجد بيانات</p>
      ) : (
        <div className="text-sm text-right" dir="rtl">
          <div className="font-medium">{data.nameAr}</div>
          {data.role && <div className="text-xs text-muted-foreground">{data.role}</div>}
        </div>
      )}
    </div>
  )
}