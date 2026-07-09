interface EmergencyCall {
  id: string
  callerName: string
  location: string
  priority: "high" | "medium" | "low"
  timestamp: string
  description: string
}

interface CallPanelProps {
  calls?: EmergencyCall[]
}

export default function CallPanel({ calls = [] }: CallPanelProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-3 text-right" dir="rtl">المكالمات الطارئة</h3>
      {calls.length === 0 ? (
        <p className="text-sm text-muted-foreground text-right" dir="rtl">لا توجد مكالمات طارئة</p>
      ) : (
        <ul className="space-y-2">
          {calls.map((call) => (
            <li key={call.id} className="text-sm p-2 bg-muted rounded">
              <span className="font-medium">{call.callerName}</span> - {call.location}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}