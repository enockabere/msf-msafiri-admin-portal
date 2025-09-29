'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, Shield, Trash2, FileText, Video, Edit, Eye, Calendar, 
  Clock, CheckCircle, Archive, Users, Building, Globe, Search, Download, ArrowUpDown
} from 'lucide-react'

interface SecurityBriefing {
  id: number
  title: string
  type: 'hr_security' | 'event_related' | 'general'
  content_type: 'text' | 'rich_text' | 'document_link' | 'video_link'
  content?: string
  document_url?: string
  video_url?: string
  status: 'draft' | 'published' | 'archived'
  publish_start_date?: string
  publish_end_date?: string
  event_id?: number
  created_by: string
  created_at: string
  updated_at?: string
}

interface SecurityBriefingsProps {
  eventId?: number
  tenantSlug: string
}

export default function SecurityBriefings({ eventId, tenantSlug }: SecurityBriefingsProps) {
  const [briefings, setBriefings] = useState<SecurityBriefing[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingBriefing, setEditingBriefing] = useState<SecurityBriefing | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('published')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<keyof SecurityBriefing>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'general' as SecurityBriefing['type'],
    content_type: 'text' as SecurityBriefing['content_type'],
    content: '',
    document_url: '',
    video_url: '',
    publish_start_date: '',
    publish_end_date: ''
  })

  const briefingTypes = [
    { value: 'hr_security', label: 'HR Security', icon: Users },
    { value: 'event_related', label: 'Event Related', icon: Calendar },
    { value: 'general', label: 'General Security', icon: Globe }
  ]

  const contentTypes = [
    { value: 'text', label: 'Plain Text' },
    { value: 'rich_text', label: 'Rich Text' },
    { value: 'document_link', label: 'Document Link' },
    { value: 'video_link', label: 'Video Link' }
  ]

  const fetchBriefings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const endpoint = eventId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/security-briefings/`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/security-briefings/?tenant=${tenantSlug}`
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBriefings(data)
      }
    } catch (error) {
      console.error('Failed to fetch security briefings:', error)
    }
  }, [eventId, tenantSlug])

  useEffect(() => {
    fetchBriefings()
  }, [fetchBriefings])

  const handleSubmit = async (isDraft = false) => {
    if (!formData.title.trim()) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const payload = {
        ...formData,
        status: isDraft ? 'draft' : 'published',
        event_id: eventId || null
      }

      const url = editingBriefing 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/security-briefings/${editingBriefing.id}/`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/security-briefings/`
      
      const response = await fetch(url, {
        method: editingBriefing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        await fetchBriefings()
        setShowModal(false)
        setEditingBriefing(null)
        setFormData({
          title: '',
          type: 'general',
          content_type: 'text',
          content: '',
          document_url: '',
          video_url: '',
          publish_start_date: '',
          publish_end_date: ''
        })
        
        const { toast } = await import('@/hooks/use-toast')
        toast({
          title: 'Success!',
          description: `Security briefing ${editingBriefing ? 'updated' : 'created'} successfully.`
        })
      }
    } catch (error) {
      console.error('Failed to save security briefing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (briefingId: number) => {
    const { default: Swal } = await import('sweetalert2')
    
    const result = await Swal.fire({
      title: 'Delete Security Briefing?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/security-briefings/${briefingId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        await fetchBriefings()
        const { toast } = await import('@/hooks/use-toast')
        toast({
          title: 'Deleted!',
          description: 'Security briefing deleted successfully.'
        })
      }
    } catch (error) {
      console.error('Failed to delete security briefing:', error)
    }
  }

  const handleStatusChange = async (briefingId: number, newStatus: SecurityBriefing['status']) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/security-briefings/${briefingId}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        await fetchBriefings()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const openEditModal = (briefing: SecurityBriefing) => {
    setEditingBriefing(briefing)
    setFormData({
      title: briefing.title,
      type: briefing.type,
      content_type: briefing.content_type,
      content: briefing.content || '',
      document_url: briefing.document_url || '',
      video_url: briefing.video_url || '',
      publish_start_date: briefing.publish_start_date || '',
      publish_end_date: briefing.publish_end_date || ''
    })
    setShowModal(true)
  }

  const getStatusColor = (status: SecurityBriefing['status']) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: SecurityBriefing['status']) => {
    switch (status) {
      case 'published': return <CheckCircle className="h-4 w-4" />
      case 'draft': return <Clock className="h-4 w-4" />
      case 'archived': return <Archive className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: SecurityBriefing['type']) => {
    const typeData = briefingTypes.find(t => t.value === type)
    const IconComponent = typeData?.icon || Shield
    return <IconComponent className="h-4 w-4" />
  }

  const getFilteredAndSortedBriefings = () => {
    let filtered = briefings.filter(briefing => {
      const matchesSearch = !searchTerm || 
        briefing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        briefing.content?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = typeFilter === 'all' || briefing.type === typeFilter
      const matchesTab = briefing.status === activeTab
      
      return matchesSearch && matchesType && matchesTab
    })
    
    return filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1
      
      if (sortField === 'created_at' || sortField === 'updated_at') {
        const dateA = new Date(aValue as string).getTime()
        const dateB = new Date(bValue as string).getTime()
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
      }
      
      const strA = String(aValue).toLowerCase()
      const strB = String(bValue).toLowerCase()
      
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const exportToCSV = (briefings: SecurityBriefing[]) => {
    const headers = [
      "Title", "Type", "Content Type", "Status", 
      "Publish Start", "Publish End", "Created By", "Created At"
    ]
    
    const csvData = [
      headers.join(","),
      ...briefings.map(briefing => [
        `"${briefing.title}"`,
        `"${briefing.type}"`,
        `"${briefing.content_type}"`,
        `"${briefing.status}"`,
        `"${briefing.publish_start_date || ''}"`,
        `"${briefing.publish_end_date || ''}"`,
        `"${briefing.created_by}"`,
        `"${new Date(briefing.created_at).toLocaleDateString()}"`
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvData], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "security-briefings.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSort = (field: keyof SecurityBriefing) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredBriefings = getFilteredAndSortedBriefings()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Security Briefings</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage security briefings and communications
          </p>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Briefing
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="published" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Published ({briefings.filter(b => b.status === 'published').length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Drafts ({briefings.filter(b => b.status === 'draft').length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archived ({briefings.filter(b => b.status === 'archived').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search briefings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm border-gray-200"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {briefingTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportToCSV(filteredBriefings)} 
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          {filteredBriefings.length > 0 ? (
            <div className="border rounded-lg bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort('title')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Title
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Content Type</TableHead>
                    <TableHead>Publish Dates</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBriefings.map((briefing) => (
                    <TableRow key={briefing.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-100">
                            {getTypeIcon(briefing.type)}
                          </div>
                          <div>
                            <div className="font-medium">{briefing.title}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(briefing.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getTypeIcon(briefing.type)}
                          {briefingTypes.find(t => t.value === briefing.type)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {contentTypes.find(t => t.value === briefing.content_type)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {briefing.publish_start_date && (
                            <div>Start: {new Date(briefing.publish_start_date).toLocaleDateString()}</div>
                          )}
                          {briefing.publish_end_date && (
                            <div>End: {new Date(briefing.publish_end_date).toLocaleDateString()}</div>
                          )}
                          {!briefing.publish_start_date && !briefing.publish_end_date && (
                            <span className="text-gray-400">No dates set</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{briefing.created_by}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(briefing)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {briefing.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(briefing.id, 'published')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {briefing.status === 'published' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(briefing.id, 'archived')}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(briefing.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} briefings</h4>
              <p className="text-gray-500 mb-4">Create your first security briefing to get started</p>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Briefing
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-xl rounded-lg p-6" style={{backgroundColor: 'white', zIndex: 9999}}>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingBriefing ? 'Edit Security Briefing' : 'Create Security Briefing'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter briefing title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type *</label>
                <Select value={formData.type} onValueChange={(value: SecurityBriefing['type']) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {briefingTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content Type *</label>
              <Select value={formData.content_type} onValueChange={(value: SecurityBriefing['content_type']) => setFormData({...formData, content_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(formData.content_type === 'text' || formData.content_type === 'rich_text') && (
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Enter briefing content"
                  rows={6}
                />
              </div>
            )}

            {formData.content_type === 'document_link' && (
              <div>
                <label className="block text-sm font-medium mb-2">Document URL</label>
                <Input
                  type="url"
                  value={formData.document_url}
                  onChange={(e) => setFormData({...formData, document_url: e.target.value})}
                  placeholder="https://example.com/document.pdf"
                />
              </div>
            )}

            {formData.content_type === 'video_link' && (
              <div>
                <label className="block text-sm font-medium mb-2">Video URL</label>
                <Input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                  placeholder="https://example.com/video.mp4"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Publish Start Date</label>
                <Input
                  type="datetime-local"
                  value={formData.publish_start_date}
                  onChange={(e) => setFormData({...formData, publish_start_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Publish End Date</label>
                <Input
                  type="datetime-local"
                  value={formData.publish_end_date}
                  onChange={(e) => setFormData({...formData, publish_end_date: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowModal(false)}
              className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleSubmit(true)}
              disabled={!formData.title || loading}
              className="px-6 py-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              Save as Draft
            </Button>
            <Button 
              onClick={() => handleSubmit(false)}
              disabled={!formData.title || loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm"
            >
              {loading ? 'Publishing...' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}