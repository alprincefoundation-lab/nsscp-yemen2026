"use client"

interface MapMarker {
  id: string
  lat: number
  lng: number
  label?: string
}

interface LiveMapProps {
  markers?: MapMarker[]
  center?: { lat: number; lng: number }
  zoom?: number
}

export default function LiveMap({ markers = [] }: LiveMapProps) {
  return (
    <div className="rounded-lg border bg-card p-4 h-64 flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm font-medium text-right" dir="rtl">الخريطة المباشرة</p>
        <p className="text-xs text-muted-foreground mt-1">{markers.length} علامة</p>
      </div>
    </div>
  )
}