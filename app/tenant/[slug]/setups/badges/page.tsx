'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2, Edit, Plus, Upload, Eye, Award } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/dashboard-layout'

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
  const { data: session } = useSession()
  const params = useParams()
  const tenantSlug = params.slug as string

  const [templates, setTemplates] = useState<BadgeTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<BadgeTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_content: '',
    logo_url: '',
    background_url: '',
    enable_qr_code: true,
    is_active: true,
    badge_size: 'standard',
    orientation: 'portrait'
  })

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/${tenantSlug}/badge-templates`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching badge templates:', error)
      toast.error('Failed to load badge templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.accessToken) {
      fetchTemplates()
    }
  }, [session, tenantSlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = isEditing && selectedTemplate
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/${tenantSlug}/badge-templates/${selectedTemplate.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/${tenantSlug}/badge-templates`

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(isEditing ? 'Badge template updated successfully' : 'Badge template created successfully')
        fetchTemplates()
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to save badge template')
      }
    } catch (error) {
      console.error('Error saving badge template:', error)
      toast.error('Failed to save badge template')
    }
  }

  const handleDelete = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this badge template?')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/${tenantSlug}/badge-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })

      if (response.ok) {
        toast.success('Badge template deleted successfully')
        fetchTemplates()
      } else {
        toast.error('Failed to delete badge template')
      }
    } catch (error) {
      console.error('Error deleting badge template:', error)
      toast.error('Failed to delete badge template')
    }
  }

  const handleEdit = (template: BadgeTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      template_content: template.template_content || '',
      logo_url: template.logo_url || '',
      background_url: template.background_url || '',
      enable_qr_code: template.enable_qr_code,
      is_active: template.is_active,
      badge_size: template.badge_size,
      orientation: template.orientation
    })
    setIsEditing(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template_content: '',
      logo_url: '',
      background_url: '',
      enable_qr_code: true,
      is_active: true,
      badge_size: 'standard',
      orientation: 'portrait'
    })
    setSelectedTemplate(null)
    setIsEditing(false)
    setShowPreview(false)
  }

  const handleImageUpload = async (file: File, type: 'logo' | 'background') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'badge-templates')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          [`${type}_url`]: data.secure_url,
          [`${type}_public_id`]: data.public_id
        }))
        toast.success(`${type} uploaded successfully`)
      } else {
        toast.error(`Failed to upload ${type}`)
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error)
      toast.error(`Failed to upload ${type}`)
    }
  }

  const defaultBadgeTemplate = `
<div style="width: 300px; height: 400px; border: 2px solid #ccc; padding: 20px; background: white; font-family: Arial, sans-serif; position: relative;">
  {{background_image}}
  
  <div style="text-align: center; margin-bottom: 20px;">
    {{logo}}
  </div>
  
  <div style="text-align: center; margin-bottom: 15px;">
    <h2 style="margin: 0; font-size: 18px; color: #333;">{{eventName}}</h2>
    <p style="margin: 5px 0; font-size: 12px; color: #666;">{{eventDates}}</p>
    <p style="margin: 5px 0; font-size: 12px; color: #666;">{{eventLocation}}</p>
  </div>
  
  <div style="text-align: center; margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
    <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #333;">{{participantName}}</h3>
    <p style="margin: 0; font-size: 12px; color: #666;">{{participantRole}}</p>
    <p style="margin: 0; font-size: 12px; color: #666;">{{participantOrganization}}</p>
  </div>
  
  <div style="text-align: center; margin-top: 20px;">
    {{qr_code}}
  </div>
  
  <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #999;">
    MSF Event Badge
  </div>
</div>
  `.trim()

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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Badge Design Templates</h1>
          <p className="text-gray-600">Design event badges for participants</p>
        </div>
        <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          {(isEditing || showPreview) && <TabsTrigger value="design">Design</TabsTrigger>}
          {showPreview && <TabsTrigger value="preview">Preview</TabsTrigger>}
        </TabsList>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Badge Templates</CardTitle>
              <CardDescription>Manage your event badge templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <tr key={template.id}>
                        <td className="border border-gray-300 px-4 py-2">{template.name}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {new Date(template.created_at).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTemplate(template)
                                setShowPreview(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing && selectedTemplate ? 'Edit Badge Template' : 'Create Badge Template'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="badge_size">Badge Size</Label>
                        <Select value={formData.badge_size} onValueChange={(value) => setFormData(prev => ({ ...prev, badge_size: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="orientation">Orientation</Label>
                        <Select value={formData.orientation} onValueChange={(value) => setFormData(prev => ({ ...prev, orientation: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enable_qr_code"
                        checked={formData.enable_qr_code}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_qr_code: checked }))}
                      />
                      <Label htmlFor="enable_qr_code">Enable QR Code</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="is_active">Active Template</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Logo Upload</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file, 'logo')
                          }}
                        />
                        <Upload className="h-4 w-4" />
                      </div>
                      {formData.logo_url && (
                        <img src={formData.logo_url} alt="Logo" className="mt-2 h-16 object-contain" />
                      )}
                    </div>

                    <div>
                      <Label>Background Image Upload</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file, 'background')
                          }}
                        />
                        <Upload className="h-4 w-4" />
                      </div>
                      {formData.background_url && (
                        <img src={formData.background_url} alt="Background" className="mt-2 h-16 object-contain" />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="template_content">Badge Template HTML</Label>
                  <Textarea
                    id="template_content"
                    value={formData.template_content || defaultBadgeTemplate}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Available variables: {'{'}participantName{'}'}, {'{'}eventName{'}'}, {'{'}eventDates{'}'}, {'{'}eventLocation{'}'}, {'{'}participantRole{'}'}, {'{'}participantOrganization{'}'}, {'{'}logo{'}'}, {'{'}background_image{'}'}, {'{'}qr_code{'}'}
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button type="submit">
                    {isEditing && selectedTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
                    Preview
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Badge Preview</CardTitle>
              <CardDescription>Preview of your badge template with sample data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div
                  dangerouslySetInnerHTML={{
                    __html: (formData.template_content || defaultBadgeTemplate)
                      .replace(/\{\{participantName\}\}/g, 'John Doe')
                      .replace(/\{\{eventName\}\}/g, 'MSF Kenya Strategic Planning Workshop')
                      .replace(/\{\{eventDates\}\}/g, '2026-01-05 to 2026-01-09')
                      .replace(/\{\{eventLocation\}\}/g, 'Nairobi')
                      .replace(/\{\{participantRole\}\}/g, 'Participant')
                      .replace(/\{\{participantOrganization\}\}/g, 'MSF')
                      .replace(/\{\{logo\}\}/g, formData.logo_url ? `<img src="${formData.logo_url}" alt="Logo" style="max-width: 100px; height: auto;" />` : 'Organization Logo')
                      .replace(/\{\{background_image\}\}/g, formData.background_url ? `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('${formData.background_url}'); background-size: cover; background-position: center; opacity: 0.1; z-index: -1;"></div>` : '')
                      .replace(/\{\{qr_code\}\}/g, formData.enable_qr_code ? '<div style="border: 1px solid #ccc; padding: 10px; display: inline-block;"><div style="font-size: 12px;">QR CODE</div><div style="font-size: 10px;">(Preview Only)</div></div>' : '')
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}