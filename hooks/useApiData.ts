import { useState, useEffect, useCallback } from "react"

interface UseApiDataResult<T> {
  data: T | null
  records: T[]
  total: number
  totalPages: number
  loading: boolean
  isLoading: boolean
  error: string | null
  refetch: () => void
  mutate: () => void
}

type UseApiDataParams = Record<string, string | number | boolean | undefined>

function buildUrl(url: string, params?: UseApiDataParams) {
  if (!params) return url

  const filteredEntries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  if (filteredEntries.length === 0) return url

  const searchParams = new URLSearchParams()
  for (const [key, value] of filteredEntries) {
    searchParams.set(key, String(value))
  }

  return `${url}${url.includes('?') ? '&' : '?'}${searchParams.toString()}`
}

export function useApiData<T = any>(url: string, params?: UseApiDataParams): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [records, setRecords] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const resolvedUrl = buildUrl(url, params)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(resolvedUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)

      if (Array.isArray(json)) {
        setRecords(json)
        setTotal(json.length)
        setTotalPages(1)
      } else {
        const nextRecords = Array.isArray(json?.records)
          ? json.records
          : Array.isArray(json?.data)
            ? json.data
            : []
        setRecords(nextRecords)
        setTotal(typeof json?.total === 'number' ? json.total : nextRecords.length)
        setTotalPages(typeof json?.totalPages === 'number' ? json.totalPages : 1)
      }
    } catch (err: any) {
      setError(err.message || "Unknown error")
      setRecords([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [resolvedUrl])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    records,
    total,
    totalPages,
    loading,
    isLoading: loading,
    error,
    refetch: fetchData,
    mutate: fetchData,
  }
}

export async function apiCreate(url: string, body: any) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function apiUpdate(url: string, body: any) {
  const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function apiDelete(url: string, body?: any) {
  const res = await fetch(url, {
    method: "DELETE",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
