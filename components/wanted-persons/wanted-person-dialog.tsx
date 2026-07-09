"use client"

interface WantedPersonDialogProps {
  open?: boolean
  onClose?: () => void
  person?: any
  onSubmit?: (data: any) => void
}

export default function WantedPersonDialog({ open, onClose, person, onSubmit }: WantedPersonDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4 text-right" dir="rtl">
          {person ? "تعديل بيانات المطلوب" : "إضافة مطلوب جديد"}
        </h2>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit?.({}); }} className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">نموذج المطلوبين - قيد التطوير</div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded border">إلغاء</button>
            <button type="submit" className="px-4 py-2 text-sm rounded bg-primary text-white">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  )
}