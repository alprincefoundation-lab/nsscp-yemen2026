interface Metric {
  labelAr: string
  labelEn?: string
  value: string | number
  change?: string
  color?: string
}

interface MetricsDashboardProps {
  metrics?: Metric[]
}

export default function MetricsDashboard({ metrics = [] }: MetricsDashboardProps) {
  if (metrics.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground text-right" dir="rtl">لا توجد مؤشرات</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((m, i) => (
        <div key={i} className="rounded-lg border bg-card p-3">
          <div className={`text-2xl font-bold ${m.color || ""}`}>{m.value}</div>
          <div className="text-xs text-muted-foreground mt-1" dir="rtl">{m.labelAr}</div>
          {m.change && <div className="text-xs mt-1">{m.change}</div>}
        </div>
      ))}
    </div>
  )
}