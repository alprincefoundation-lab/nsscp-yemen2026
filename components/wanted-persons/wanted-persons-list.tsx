"use client"

interface WantedPerson {
  id: string
  firstName: string
  lastName: string
  reason?: string
  status?: string
  severity?: string
}

interface WantedPersonsListProps {
  persons?: WantedPerson[]
  onSelect?: (person: WantedPerson) => void
}

export default function WantedPersonsList({ persons = [], onSelect }: WantedPersonsListProps) {
  if (persons.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground text-right" dir="rtl">لا توجد نتائج</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="divide-y">
        {persons.map((person) => (
          <div
            key={person.id}
            className="p-3 hover:bg-muted cursor-pointer text-right"
            dir="rtl"
            onClick={() => onSelect?.(person)}
          >
            <div className="font-medium">{person.firstName} {person.lastName}</div>
            {person.reason && <div className="text-xs text-muted-foreground">{person.reason}</div>}
            <div className="flex gap-2 mt-1">
              {person.status && (
                <span className="text-xs px-2 py-0.5 rounded bg-muted">{person.status}</span>
              )}
              {person.severity && (
                <span className="text-xs px-2 py-0.5 rounded bg-muted">{person.severity}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}