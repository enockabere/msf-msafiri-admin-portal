'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth, useAuthenticatedApi } from '@/lib/auth'
import { toast } from '@/hooks/use-toast'
import DashboardLayout from '@/components/layout/dashboard-layout'
import Swal from 'sweetalert2'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, Save, X, Edit, Trash2, Award } from 'lucide-react'

interface BadgeTemplate {
  id: number
  name: string
  description: string
  template_content: string
  logo_url: string | null
  logo_public_id: string | null
  background_url: string | null
  background_public_id: string | null
  enable_qr_code: boolean
  is_active: boolean
  badge_size: string
  orientation: string
  created_at: string
  updated_at: string
}

export default function BadgeDesignPage() {
  const params = useParams()
  const tenantSlug = params.slug as string
  const { user, loading: authLoading } = useAuth()
  const { apiClient } = useAuthenticatedApi()

  const [templates, setTemplates] = useState<BadgeTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<BadgeTemplate | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canEdit = Boolean(user?.role && ['super_admin', 'SUPER_ADMIN', 'mt_admin', 'hr_admin', 'event_admin'].includes(user.role))

  const loadTemplates = useCallback(async () => {
    if (!tenantSlug) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/tenants/${tenantSlug}/badge-templates`, {
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      } else {
        console.error('Failed to load templates:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }, [apiClient, tenantSlug])

  useEffect(() => {
    if (!authLoading && tenantSlug) {
      loadTemplates()
    }
  }, [authLoading, tenantSlug, loadTemplates])

  const handleDelete = async (templateId: number) => {
    const result = await Swal.fire({
      title: 'Delete Template?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    })
    
    if (!result.isConfirmed) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/tenants/${tenantSlug}/badge-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`
        }
      })
      
      if (response.ok) {
        toast({ title: 'Success', description: 'Template deleted successfully' })
        loadTemplates()
      } else {
        throw new Error('Failed to delete template')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({ title: 'Error', description: 'Failed to delete template', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Award className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-600">Loading badge templates...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Badge Design Templates</h1>
              <p className="text-sm text-gray-600">Design event badges for participants</p>
            </div>
            {canEdit && (
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                    <span className="sr-only">Close</span>
                  </button>

                  <div className="p-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-bold text-gray-900">
                          {editingTemplate ? 'Edit Badge Template' : 'Create Badge Template'}
                        </DialogTitle>
                        <p className="text-gray-600 text-sm mt-1">
                          Design a reusable badge template for events
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">Template Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter template name"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                        <Input
                          id="description"
                          placeholder="Brief description of the badge template"
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Badge Size</Label>
                          <select className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                            <option value="standard">Standard</option>
                            <option value="large">Large</option>
                            <option value="small">Small</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Orientation</Label>
                          <select className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="qr_code" className="rounded" defaultChecked />
                        <Label htmlFor="qr_code" className="text-sm text-gray-700">Include QR Code</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="active" className="rounded" defaultChecked />
                        <Label htmlFor="active" className="text-sm text-gray-700">Active Template</Label>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex justify-end space-x-3">
                          <Button variant="outline" onClick={() => setModalOpen(false)}>
                            Cancel
                          </Button>
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            Create Template
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">No badge templates yet</h3>
                <p className="text-xs text-gray-500 mb-4">Create your first badge template</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{new Date(template.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {template.is_active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingTemplate(template)
                              setModalOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}