interface DepartmentNode {
  id: string
  nameAr: string
  nameEn?: string
  children?: DepartmentNode[]
}

interface DepartmentHierarchyProps {
  data?: DepartmentNode[]
}

export default function DepartmentHierarchy({ data = [] }: DepartmentHierarchyProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-3 text-right" dir="rtl">التسلسل الهرمي للإدارات</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-right" dir="rtl">لا توجد بيانات</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {data.map((node) => (
            <li key={node.id} className="p-1" dir="rtl">{node.nameAr}</li>
          ))}
        </ul>
      )}
    </div>
  )
}