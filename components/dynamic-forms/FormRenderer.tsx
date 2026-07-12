'use client'

import { FormSchema, FormField } from '@/lib/forms/schemas'

interface FormRendererProps {
  schema: FormSchema
  formData: Record<string, any>
  onChange: (name: string, value: any) => void
}

function renderField(field: FormField, value: any, onChange: (name: string, value: any) => void) {
  const baseClasses = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-sm'
  const isRequired = field.required

  switch (field.type) {
    case 'TEXT':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          className={baseClasses}
          required={isRequired}
        />
      )

    case 'NUMBER':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(field.name, e.target.value)}
          className={baseClasses}
          required={isRequired}
        />
      )

    case 'DATE':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={e => onChange(field.name, e.target.value)}
          className={baseClasses}
          required={isRequired}
        />
      )

    case 'BOOLEAN':
      return (
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onChange(field.name, true)}
            className={`px-4 py-2 rounded-lg text-sm border transition-all ${
              value === true
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            ✅ نعم
          </button>
          <button
            type="button"
            onClick={() => onChange(field.name, false)}
            className={`px-4 py-2 rounded-lg text-sm border transition-all ${
              value === false
                ? 'bg-red-600/20 border-red-500 text-red-300'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            ❌ لا
          </button>
        </div>
      )

    case 'SELECT':
      return (
        <select
          value={value || ''}
          onChange={e => onChange(field.name, e.target.value)}
          className={baseClasses}
          required={isRequired}
        >
          <option value="">-- اختر --</option>
          {(field.options || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )

    case 'TEXTAREA':
      return (
        <textarea
          value={value || ''}
          onChange={e => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={baseClasses + ' resize-y'}
          required={isRequired}
        />
      )

    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(field.name, e.target.value)}
          className={baseClasses}
        />
      )
  }
}

export default function FormRenderer({ schema, formData, onChange }: FormRendererProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {schema.fields.map(field => (
        <div key={field.name} className={field.type === 'TEXTAREA' || field.type === 'BOOLEAN' ? 'md:col-span-2' : ''}>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            {field.label}
            {field.required && <span className="text-red-400 mr-1">*</span>}
          </label>
          {renderField(field, formData[field.name], onChange)}
        </div>
      ))}
    </div>
  )
}