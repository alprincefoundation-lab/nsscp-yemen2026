'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, AlertTriangle, Globe, Users, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import WantedPersonsList from '@/components/wanted-persons/wanted-persons-list'
import WantedPersonDialog from '@/components/wanted-persons/wanted-person-dialog'
import WantedPersonsStatistics from '@/components/wanted-persons/statistics'

export default function WantedPersonsPage() {
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/wanted-persons/statistics', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setStatistics(await response.json())
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wanted Persons Database</h1>
          <p className="text-muted-foreground mt-2">Search and manage wanted individuals</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Wanted Person
        </Button>
      </div>

      {statistics && <WantedPersonsStatistics data={statistics} />}

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, ID, or wanted number..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <WantedPersonsList
        search={search}
        severity={severity}
        status={status}
        onRefresh={fetchStatistics}
      />

      <WantedPersonDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          setIsDialogOpen(false)
          fetchStatistics()
        }}
      />
    </div>
  )
}
