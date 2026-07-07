'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AlertTriangle, MapPin, Calendar, Clock, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WantedPersonDetail() {
  const params = useParams()
  const [person, setPerson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/wanted-persons/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch')
        setPerson(await res.json())
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPerson()
  }, [params.id])

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>
  if (!person) return <div className="p-6">Not found</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{person.name}</h1>
          <div className="flex gap-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm ${
              person.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
              person.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {person.severity}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              person.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
              person.status === 'CAPTURED' ? 'bg-gray-100 text-gray-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {person.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Report</Button>
          <Button variant="outline"><Share2 className="w-4 h-4 mr-2" /> Share</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Personal Information</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600">Nationality:</span>
              <div>{person.nationality}</div>
            </div>
            <div>
              <span className="text-gray-600">Gender:</span>
              <div>{person.gender}</div>
            </div>
            <div>
              <span className="text-gray-600">Date of Birth:</span>
              <div>{person.dateOfBirth ? new Date(person.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Charges</h3>
          <p className="text-sm text-gray-700">{person.charges}</p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Description</h3>
          <p className="text-sm text-gray-700">{person.physicalDescription || 'No description available'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Timeline</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <div className="font-medium">Record Created</div>
                <div className="text-sm text-gray-600">{new Date(person.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Actions</h3>
          <div className="space-y-2">
            <Button className="w-full" size="sm">Record Capture</Button>
            <Button className="w-full" size="sm" variant="outline">Edit Details</Button>
            <Button className="w-full" size="sm" variant="outline">Issue Notice</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
