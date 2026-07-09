interface Department {
  id: string
  nameAr: string
  nameEn?: string
  staffCount?: number
}

interface DepartmentsGridProps {
  departments?: Department[]
}

export default function DepartmentsGrid({ departments = [] }: DepartmentsGridProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-3 text-right" dir="rtl">الإدارات</h3>
      {departments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-right" dir="rtl">لا توجد إدارات</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {departments.map((dept) => (
            <div key={dept.id} className="p-2 bg-muted rounded text-sm text-right" dir="rtl">
              {dept.nameAr}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}