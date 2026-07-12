'use client'

import { useState } from 'react'
import { ALL_DEPARTMENT_SCHEMAS, DEPARTMENT_NAMES } from '@/lib/forms/schemas'
import FormRenderer from './FormRenderer'
import FileUploader from './FileUploader'
import { useAuth } from '@/lib/contexts/AuthContext'

export default function DynamicFormContainer() {
  const { user } = useAuth()
  const officerId = user?.id || ''
  const officerRole = user?.role || ''

  const [selectedDept, setSelectedDept] = useState('CRI')
  const [selectedForm, setSelectedForm] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [files, setFiles] = useState<File[]>([])
  const [level6UnitId, setLevel6UnitId] = useState('L6-ADN-01')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const deptSchemas = ALL_DEPARTMENT_SCHEMAS[selectedDept] || []
  const currentSchema = deptSchemas[selectedForm]

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!currentSchema || !officerId) return
    setIsSubmitting(true)
    setResult(null)

    try {
      const recordRes = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-officer-id': officerId },
        body: JSON.stringify({
          level6UnitId,
          recordType: currentSchema.recordType,
          data: { ...formData, submittedBy: officerId, submittedAt: new Date().toISOString() },
          securityLevel: 'internal',
        }),
      })
      const recordJson = await recordRes.json()

      if (!recordJson.success) {
        setResult({ success: false, message: recordJson.error || 'فشل حفظ السجل' })
        return
      }

      const recordId = recordJson.data.id
      let uploadedCount = 0
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('recordId', recordId)
        fd.append('type', getFileType(file.type))
        const attRes = await fetch('/api/attachments', {
          method: 'POST',
          headers: { 'x-officer-id': officerId },
          body: fd,
        })
        if (attRes.ok) uploadedCount++
      }

      setResult({ success: true, message: `✅ تم حفظ ${currentSchema.title} بنجاح${uploadedCount > 0 ? ` مع ${uploadedCount} مرفق` : ''}` })
      setFormData({})
      setFiles([])
    } catch (err: any) {
      setResult({ success: false, message: `❌ خطأ: ${err.message}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        الرجاء تسجيل الدخول للوصول إلى لوحة الاستمارات
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <h1 className="text-lg font-bold text-amber-400">لوحة الاستمارات التكتيكية</h1>
              <p className="text-xs text-gray-500">نظام الاستمارات الديناميكية — NSSCP</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs bg-gray-800 rounded-lg px-3 py-1.5">
            <span className="text-gray-400">{user.fullName}</span>
            <span className="text-gray-600">|</span>
            <span className="text-emerald-400">{user.role}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Object.entries(DEPARTMENT_NAMES).map(([code, name]) => (
            <button
              key={code}
              onClick={() => { setSelectedDept(code); setSelectedForm(0); setResult(null) }}
              className={`p-3 rounded-lg border text-sm font-semibold transition-all ${selectedDept === code ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'}`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {deptSchemas.map((schema, idx) => (
            <button
              key={idx}
              onClick={() => { setSelectedForm(idx); setResult(null) }}
              className={`px-4 py-2 rounded-lg text-sm border transition-all ${selectedForm === idx ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'}`}
            >
              {schema.title}
            </button>
          ))}
        </div>

        {currentSchema && (
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 backdrop-blur">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">{currentSchema.title}</h2>
              <p className="text-sm text-gray-500">{currentSchema.description}</p>
            </div>
            <FormRenderer schema={currentSchema} formData={formData} onChange={handleFieldChange} />
            <div className="mt-6 pt-6 border-t border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">📎 المرفقات والأدلة</h3>
              <FileUploader files={files} onFilesChange={setFiles} />
            </div>
            <div className="mt-8 flex items-center gap-4">
              <button onClick={handleSubmit} disabled={isSubmitting} className={`px-8 py-3 rounded-lg font-bold text-sm transition-all ${isSubmitting ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}>
                {isSubmitting ? '⏳ جاري الحفظ...' : '💾 حفظ الاستمارة'}
              </button>
              <button onClick={() => { setFormData({}); setFiles([]); setResult(null) }} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-600">
                🔄 مسح النموذج
              </button>
            </div>
            {result && (
              <div className={`mt-4 p-4 rounded-lg border text-sm ${result.success ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300' : 'bg-red-900/30 border-red-700 text-red-300'}`}>
                {result.message}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'IMAGE'
  if (mimeType.startsWith('video/')) return 'VIDEO'
  if (mimeType.startsWith('audio/')) return 'AUDIO'
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'WORD'
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'EXCEL'
  return 'OTHER'
}