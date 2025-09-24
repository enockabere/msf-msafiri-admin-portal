'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Shield, Trash2, FileText, Video } from 'lucide-react'

interface SecurityBriefing {
  id: number
  title: string
  content?: string
  document_url?: string
  video_url?: string
  created_by: string
  created_at: string
}

interface SecurityBriefingsProps {
  eventId: number
  tenantSlug: string
}

export default function SecurityBriefings({ eventId }: SecurityBriefingsProps) {
  const [briefings, setBriefings] = useState<SecurityBriefing[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newBriefing, setNewBriefing] = useState({
    title: '',
    content: '',
    document_url: '',
    video_url: ''
  })

  const fetchBriefings = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/events/${eventId}/security-briefings/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBriefings(data)
      }
    } catch (error) {
      console.error('Failed to fetch security briefings:', error)
    }
  }, [eventId])

  useEffect(() => {
    fetchBriefings()
  }, [fetchBriefings])

  const handleAddBriefing = async () => {
    if (!newBriefing.title.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/v1/events/${eventId}/security-briefings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newBriefing)
      })
      
      if (response.ok) {
        const briefing = await response.json()
        setBriefings([...briefings, briefing])
        setNewBriefing({ title: '', content: '', document_url: '', video_url: '' })
        setShowAddForm(false)
        
        const { toast } = await import('@/hooks/use-toast')
        toast({
          title: 'Success!',
          description: 'Security briefing added successfully.'
        })
      } else {
        const { toast } = await import('@/hooks/use-toast')
        toast({
          title: 'Error!',
          description: 'Failed to add security briefing. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to add security briefing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBriefing = async (briefingId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/events/${eventId}/security-briefings/${briefingId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        setBriefings(briefings.filter(b => b.id !== briefingId))
      }
    } catch (error) {
      console.error('Failed to remove security briefing:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Security Briefings ({briefings.length})</h3>
        <Button 
          onClick={() => setShowAddForm(true)} 
          size="sm"
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Briefing
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Add Security Briefing
          </h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Title *</label>
              <Input
                placeholder="Enter briefing title"
                value={newBriefing.title}
                onChange={(e) => setNewBriefing({...newBriefing, title: e.target.value})}
                className="border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Content</label>
              <Textarea
                placeholder="Enter briefing content or instructions"
                value={newBriefing.content}
                onChange={(e) => setNewBriefing({...newBriefing, content: e.target.value})}
                className="border-gray-300 focus:border-red-500 focus:ring-red-500 h-24"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Document URL</label>
                <Input
                  placeholder="Link to security document"
                  type="url"
                  value={newBriefing.document_url}
                  onChange={(e) => setNewBriefing({...newBriefing, document_url: e.target.value})}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Video URL</label>
                <Input
                  placeholder="Link to security video"
                  type="url"
                  value={newBriefing.video_url}
                  onChange={(e) => setNewBriefing({...newBriefing, video_url: e.target.value})}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleAddBriefing} 
              className="bg-green-600 hover:bg-green-700"
              disabled={!newBriefing.title || loading}
            >
              {loading ? 'Adding...' : 'Add Briefing'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {briefings.map((briefing) => (
          <div key={briefing.id} className="p-4 border rounded-lg bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <h4 className="font-medium text-gray-900">{briefing.title}</h4>
                </div>
                {briefing.content && (
                  <p className="text-sm text-gray-700 mb-3">{briefing.content}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span>Created by {briefing.created_by}</span>
                  <span>{new Date(briefing.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  {briefing.document_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(briefing.document_url, '_blank')}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Document
                    </Button>
                  )}
                  {briefing.video_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(briefing.video_url, '_blank')}
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Video
                    </Button>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveBriefing(briefing.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {briefings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No security briefings added yet</p>
          </div>
        )}
      </div>
    </div>
  )
}