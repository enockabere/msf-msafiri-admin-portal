'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, ExternalLink, Trash2, File} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Attachment {
  id: number
  name: string
  url: string
  description?: string
  uploaded_by: string
  created_at: string
}

interface EventAttachmentsProps {
  eventId: number
  tenantSlug: string
  onAttachmentsChange?: (count: number) => void
  eventHasEnded?: boolean
}

export default function EventAttachments({ eventId, onAttachmentsChange, eventHasEnded = false }: EventAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newAttachment, setNewAttachment] = useState({
    name: '',
    url: '',
    description: ''
  })
  const [selectedType, setSelectedType] = useState('')
  const [customName, setCustomName] = useState('')

  const fetchAttachments = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/attachments/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
        onAttachmentsChange?.(data.length)
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error)
    }
  }, [eventId, onAttachmentsChange])

  useEffect(() => {
    fetchAttachments()
  }, [fetchAttachments])

  const handleAddAttachment = async () => {
    if (!newAttachment.name.trim() || !newAttachment.url.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/attachments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newAttachment)
      })
      
      if (response.ok) {
        const attachment = await response.json()
        const newAttachments = [...attachments, attachment]
        setAttachments(newAttachments)
        onAttachmentsChange?.(newAttachments.length)
        setNewAttachment({ name: '', url: '', description: '' })
        setSelectedType('')
        setCustomName('')
        setShowAddForm(false)
        
        const { toast } = await import('@/hooks/use-toast')
        toast({
          title: 'Success!',
          description: 'Attachment added successfully.'
        })
      } else {
        const { toast } = await import('@/hooks/use-toast')
        toast({
          title: 'Error!',
          description: 'Failed to add attachment. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to add attachment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAttachment = async (attachmentId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/attachments/${attachmentId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const newAttachments = attachments.filter(a => a.id !== attachmentId)
        setAttachments(newAttachments)
        onAttachmentsChange?.(newAttachments.length)
      }
    } catch (error) {
      console.error('Failed to remove attachment:', error)
    }
  }



  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Event Attachments</h3>
          <p className="text-sm text-gray-600 mt-1">{attachments.length} attachments uploaded</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)} 
          disabled={eventHasEnded}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Attachment
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 space-y-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-red-600" />
            <h4 className="text-lg font-semibold text-gray-900">Add New Attachment</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Attachment Name *</label>
              <Select 
                value={selectedType} 
                onValueChange={(value) => {
                  setSelectedType(value)
                  if (value !== 'Other') {
                    setNewAttachment({...newAttachment, name: value})
                    setCustomName('')
                  } else {
                    setNewAttachment({...newAttachment, name: ''})
                  }
                }}
              >
                <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                  <SelectValue placeholder="Select attachment name" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                  <SelectItem value="eTA Requirements" className="hover:bg-red-50 focus:bg-red-50">eTA Requirements</SelectItem>
                  <SelectItem value="Other" className="hover:bg-red-50 focus:bg-red-50">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedType === 'Other' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Custom Name *</label>
                <Input
                  placeholder="Enter custom attachment name"
                  value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value)
                    setNewAttachment({...newAttachment, name: e.target.value})
                  }}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">URL/Link *</label>
            <Input
              placeholder="Enter URL or link"
              type="url"
              value={newAttachment.url}
              onChange={(e) => setNewAttachment({...newAttachment, url: e.target.value})}
              className="border-gray-300 focus:border-red-500 focus:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
            <Input
              placeholder="Enter description"
              value={newAttachment.description}
              onChange={(e) => setNewAttachment({...newAttachment, description: e.target.value})}
              className="border-gray-300 focus:border-red-500 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleAddAttachment} 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              disabled={!selectedType || !newAttachment.name || !newAttachment.url || loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attachment
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddForm(false)
                setNewAttachment({ name: '', url: '', description: '' })
                setSelectedType('')
                setCustomName('')
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg transition-all duration-200"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-200">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <File className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">{attachment.name}</div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span>Added by {attachment.uploaded_by}</span>
                  <span>{new Date(attachment.created_at).toLocaleDateString()}</span>
                </div>
                {attachment.description && (
                  <div className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">{attachment.description}</div>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(attachment.url, '_blank')}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveAttachment(attachment.id)}
                disabled={eventHasEnded}
                className="border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {attachments.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <File className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No attachments yet</h4>
              <p className="text-gray-500 mb-4">Get started by adding your first attachment</p>
              <Button 
                onClick={() => setShowAddForm(true)}
                disabled={eventHasEnded}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Attachment
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}