'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertTriangle, Zap } from 'lucide-react'

export default function WorkflowDashboard() {
  const [workflowType, setWorkflowType] = useState('COMPLAINT')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pendings, setPendings] = useState<any[]>([])

  useEffect(() => {
    fetchStats()
    fetchPendingApprovals()
  }, [workflowType])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workflows?workflowType=${workflowType}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('[v0] Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/workflows/approvals', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      const data = await response.json()
      setPendings(data)
    } catch (error) {
      console.error('[v0] Error fetching approvals:', error)
    }
  }

  return (
    <div className="p-6 bg-background">
      <h1 className="text-3xl font-bold mb-6">Workflow Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Transitions</p>
              <p className="text-2xl font-bold">{stats?.totalTransitions || 0}</p>
            </div>
            <Zap className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Approvals</p>
              <p className="text-2xl font-bold">{pendings.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">SLA Violations</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Escalations</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Workflow Type</label>
        <select
          value={workflowType}
          onChange={(e) => setWorkflowType(e.target.value)}
          className="px-4 py-2 border rounded-md w-full md:w-48"
        >
          <option value="COMPLAINT">Complaint</option>
          <option value="INVESTIGATION">Investigation</option>
          <option value="OPERATION">Operation</option>
          <option value="PRISONER">Prisoner</option>
          <option value="EVIDENCE">Evidence</option>
        </select>
      </div>

      {pendings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Pending Approvals ({pendings.length})</h2>
          <div className="grid grid-cols-1 gap-4">
            {pendings.slice(0, 5).map((approval) => (
              <div key={approval.id} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{approval.entityId}</p>
                  <p className="text-sm text-gray-500">Required Role: {approval.requiredRole}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Review</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
