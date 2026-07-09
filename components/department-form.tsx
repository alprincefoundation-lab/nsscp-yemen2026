interface DepartmentFormProps {
  onSubmit?: (data: any) => void
  initialData?: any
}

export default function DepartmentForm({ onSubmit, initialData }: DepartmentFormProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-3 text-right" dir="rtl">
        {initialData ? "تعديل الإدارة" : "إضافة إدارة جديدة"}
      </h3>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit?.({}); }} className="space-y-4">
        <div className="text-sm text-muted-foreground text-right" dir="rtl">
          نموذج الإدارة - قيد التطوير
        </div>
      </form>
    </div>
  )
}