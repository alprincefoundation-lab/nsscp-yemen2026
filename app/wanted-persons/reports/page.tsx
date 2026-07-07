'use client'

import { useEffect, useState } from 'react'
import { Download, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WantedPersonsReports() {
  const [summary, setSummary] = useState<any>(null)
  const [captures, setCaptures] = useState<any>(null)
  const [notices, setNotices] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = { Authorization: `Bearer ${token}` }

        const [summaryRes, capturesRes, noticesRes] = await Promise.all([
          fetch('/api/wanted-persons/reports/summary', { headers }),
          fetch('/api/wanted-persons/reports/captures', { headers }),
          fetch('/api/wanted-persons/reports/notices', { headers }),
        ])

        if (summaryRes.ok) setSummary(await summaryRes.json())
        if (capturesRes.ok) setCaptures(await capturesRes.json())
        if (noticesRes.ok) setNotices(await noticesRes.json())
      } catch (err) {
        console.error('Failed to fetch reports', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  if (loading) return <div className="p-6">Loading reports...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Wanted Persons Reports
        </h1>
        <Button><Download className="w-4 h-4 mr-2" /> Export All</Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="text-gray-600 text-sm">Total Wanted</div>
          <div className="text-3xl font-bold">{summary?.statistics?.totalWanted || 0}</div>
        </div>
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="text-gray-600 text-sm">Captured</div>
          <div className="text-3xl font-bold text-green-600">{summary?.statistics?.captured || 0}</div>
        </div>
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="text-gray-600 text-sm">Active</div>
          <div className="text-3xl font-bold text-blue-600">{summary?.statistics?.active || 0}</div>
        </div>
        <div className="border rounded-lg p-4 bg-orange-50">
          <div className="text-gray-600 text-sm">Capture Rate</div>
          <div className="text-3xl font-bold text-orange-600">{summary?.statistics?.captureRate?.toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">By Severity</h3>
          <div className="space-y-2">
            {summary?.bySeverity?.map((item: any) => (
              <div key={item.severity} className="flex justify-between">
                <span>{item.severity}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Recent Captures</h3>
          <div className="space-y-2 text-sm">
            {captures?.topOfficers?.map((officer: any) => (
              <div key={officer.officer} className="flex justify-between">
                <span>{officer.officer}</span>
                <span className="font-semibold">{officer.captures} captures</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
