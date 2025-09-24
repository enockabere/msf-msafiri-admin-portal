'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, ExternalLink, Save, Edit, X } from 'lucide-react'
import { toast } from '@/components/ui/toast'

interface EventAgendaProps {
  eventId: number
  tenantSlug: string
}

export default function EventAgenda({ eventId }: EventAgendaProps) {
  const [documentUrl, setDocumentUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tempUrl, setTempUrl] = useState('')

  useEffect(() => {
    const fetchAgendaDocument = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/events/${eventId}/agenda/document`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setDocumentUrl(data.document_url || '')
          setTempUrl(data.document_url || '')
        }
      } catch (error) {
        console.error('Failed to fetch agenda document:', error)
      }
    }
    fetchAgendaDocument()
  }, [eventId])

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/v1/events/${eventId}/agenda/document`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          document_url: tempUrl
        })
      })
      
      if (response.ok) {
        setDocumentUrl(tempUrl)
        setIsEditing(false)
        toast({
          title: 'Success',
          description: 'Agenda document URL updated successfully'
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update agenda document URL',
          variant: 'destructive'
        })
      }
    } catch  {
      toast({
        title: 'Error',
        description: 'Failed to update agenda document URL',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setTempUrl(documentUrl)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Event Agenda</h3>
          <p className="text-sm text-gray-600 mt-1">Share the agenda document for this event</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Agenda Document</h4>
            <p className="text-sm text-gray-600">Provide a link to the event agenda document</p>
          </div>
        </div>

        {!isEditing ? (
          <div className="space-y-4">
            {documentUrl ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Agenda Document</p>
                    <p className="text-sm text-gray-600 truncate max-w-md">{documentUrl}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(documentUrl, '_blank')}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No agenda document</h4>
                <p className="text-gray-600 mb-4">Add a link to the event agenda document</p>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Document URL
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document URL *
              </label>
              <Input
                type="url"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://example.com/agenda-document.pdf"
                className="border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide a direct link to the agenda document (PDF, Google Docs, etc.)
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={loading || !tempUrl.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}