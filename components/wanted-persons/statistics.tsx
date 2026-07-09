interface WantedStatistics {
  total: number
  active: number
  captured: number
  critical: number
}

interface WantedPersonsStatisticsProps {
  statistics?: WantedStatistics
}

export default function WantedPersonsStatistics({ statistics }: WantedPersonsStatisticsProps) {
  if (!statistics) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground text-right" dir="rtl">لا توجد إحصائيات</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-lg border bg-card p-3 text-center">
        <div className="text-2xl font-bold">{statistics.total}</div>
        <div className="text-xs text-muted-foreground" dir="rtl">المجموع</div>
      </div>
      <div className="rounded-lg border bg-card p-3 text-center">
        <div className="text-2xl font-bold text-red-600">{statistics.active}</div>
        <div className="text-xs text-muted-foreground" dir="rtl">نشط</div>
      </div>
      <div className="rounded-lg border bg-card p-3 text-center">
        <div className="text-2xl font-bold text-green-600">{statistics.captured}</div>
        <div className="text-xs text-muted-foreground" dir="rtl">مقبوض عليه</div>
      </div>
      <div className="rounded-lg border bg-card p-3 text-center">
        <div className="text-2xl font-bold text-orange-600">{statistics.critical}</div>
        <div className="text-xs text-muted-foreground" dir="rtl">خطير</div>
      </div>
    </div>
  )
}