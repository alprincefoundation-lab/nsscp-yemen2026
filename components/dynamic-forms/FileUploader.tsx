'use client'

import { useRef, useState } from 'react'

interface FileUploaderProps {
  files: File[]
  onFilesChange: (files: File[]) => void
}

const MAX_FILE_SIZE_MB = 50

export default function FileUploader({ files, onFilesChange }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleAddFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const validFiles: File[] = []
    for (let i = 0; i < newFiles.length; i++) {
      const f = newFiles[i]
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(`الملف ${f.name} كبير جداً — الحد الأقصى ${MAX_FILE_SIZE_MB}MB`)
        continue
      }
      validFiles.push(f)
    }
    onFilesChange([...files, ...validFiles])
  }

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')) return '🖼️'
    if (['pdf'].includes(ext || '')) return '📄'
    if (['doc', 'docx'].includes(ext || '')) return '📝'
    if (['xls', 'xlsx'].includes(ext || '')) return '📊'
    if (['mp3', 'wav', 'ogg', 'aac'].includes(ext || '')) return '🎵'
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) return '🎬'
    return '📎'
  }

  return (
    <div>
      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleAddFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-gray-700 hover:border-gray-500 bg-gray-800/30'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => handleAddFiles(e.target.files)}
        />
        <div className="text-3xl mb-2">📤</div>
        <p className="text-sm text-gray-400">اسحب الملفات هنا أو اضغط للاختيار</p>
        <p className="text-xs text-gray-600 mt-1">صور، PDF، Word، Excel، تسجيلات — الحد الأقصى {MAX_FILE_SIZE_MB}MB</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">{getFileIcon(file.name)}</span>
                <div className="min-w-0">
                  <p className="text-sm text-gray-200 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB — {file.type || 'غير معروف'}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded border border-red-800 hover:border-red-600 transition-all shrink-0 mr-2"
              >
                ✕ حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}