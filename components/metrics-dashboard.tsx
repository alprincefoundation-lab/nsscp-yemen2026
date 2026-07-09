interface Metric {
  labelAr: string
  labelEn?: string
  value: string | number
  change?: string
}

interface MetricsDashboardProps {
  metrics?: Metric[]
}

export default function MetricsDashboard({ metrics = [] }: MetricsDashboardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-3 text-right" dir="rtl">المؤشرات</h3>
      {metrics.length === 0 ? (
        <p className="text-sm text-muted-foreground text-right" dir="rtl">لا توجد مؤشرات</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {metrics.map((m, i) => (
            <div key={i} className="p-2 bg-muted rounded text-center">
              <div className="text-lg font-bold">{m.value}</div>
              <div className="text-xs text-muted-foreground" dir="rtl">{m.labelAr}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}