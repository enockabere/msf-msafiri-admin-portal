'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useAuth, useAuthenticatedApi } from '@/lib/auth'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/dashboard-layout'
import Swal from 'sweetalert2'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Save, X, Edit, Trash2, Award, Eye, Settings, Upload, Image } from 'lucide-react'

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
  contact_phone: string | null
  website_url: string | null
  avatar_url: string | null
  include_avatar: boolean
  created_at: string
  updated_at: string
}


interface BadgeFormData {
  name: string
  description: string
  template_content: string
  badge_size: 'small' | 'standard' | 'large'
  orientation: 'portrait' | 'landscape'
  enable_qr_code: boolean
  include_avatar: boolean
  contact_phone: string
  website_url: string
  logo_url: string
  avatar_url: string
}

// Badge Preview Component with Responsive Design
function BadgePreview({
  size,
  orientation,
  showQR,
  showAvatar,
  contactPhone,
  websiteUrl,
  logoUrl,
  avatarUrl
}: {
  size: 'small' | 'standard' | 'large'
  orientation: 'portrait' | 'landscape'
  showQR: boolean
  showAvatar: boolean
  contactPhone: string
  websiteUrl: string
  logoUrl: string
  avatarUrl: string
}) {
  console.log('BadgePreview component rendering with props:', { size, orientation, showQR, showAvatar });
  const getDimensions = () => {
    const sizes = {
      small: { portrait: { width: 200, height: 280 }, landscape: { width: 280, height: 200 } },
      standard: { portrait: { width: 280, height: 360 }, landscape: { width: 360, height: 280 } },
      large: { portrait: { width: 320, height: 420 }, landscape: { width: 420, height: 320 } }
    }
    return sizes[size][orientation]
  }

  // Get scaling factor based on size
  const getScale = () => {
    const scales = { small: 0.7, standard: 1, large: 1.15 }
    return scales[size]
  }

  const dimensions = getDimensions()
  const scale = getScale()
  const isLandscape = orientation === 'landscape'

  // Adjust spacing for landscape orientation and avatar
  const spacing = {
    padding: showAvatar
      ? (isLandscape ? 8 * scale : 10 * scale)
      : (isLandscape ? 12 * scale : 16 * scale),
    logoSize: showAvatar
      ? (isLandscape ? 36 * scale : 48 * scale)
      : (isLandscape ? 48 * scale : 64 * scale),
    logoMargin: showAvatar
      ? (isLandscape ? 4 * scale : 6 * scale)
      : (isLandscape ? 6 * scale : 12 * scale),
    sectionMargin: showAvatar
      ? (isLandscape ? 4 * scale : 6 * scale)
      : (isLandscape ? 6 * scale : 12 * scale),
    qrSize: showAvatar
      ? (isLandscape ? 32 * scale : 35 * scale)
      : (isLandscape ? 40 * scale : 45 * scale),
    qrInner: showAvatar
      ? (isLandscape ? 28 * scale : 32 * scale)
      : (isLandscape ? 34 * scale : 42 * scale),
    avatarSize: showAvatar ? (isLandscape ? 45 * scale : 55 * scale) : 0,
    avatarMargin: isLandscape ? 4 * scale : 6 * scale
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
      <div
        className="bg-white rounded-xl shadow-2xl transition-all duration-500 ease-in-out transform hover:scale-105"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
        <div className="h-full flex flex-col relative overflow-hidden">
          {/* Red header section - 65% of badge */}
          <div
            className="absolute top-0 left-0 right-0 bg-gradient-to-br from-red-600 to-red-700"
            style={{
              height: isLandscape ? '55%' : '65%',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}
          />

          {/* Hanging hole */}
          <div
            className="absolute bg-white rounded-full shadow-lg"
            style={{
              width: `${14 * scale}px`,
              height: `${14 * scale}px`,
              top: `${10 * scale}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              border: '1px solid rgba(0,0,0,0.1)'
            }}
          />

          {/* Avatar positioned at the boundary between red and white */}
          {showAvatar && (
            <div
              className="absolute left-1/2 flex justify-center"
              style={{
                top: isLandscape ? '55%' : '65%',
                transform: 'translate(-50%, -50%)',
                zIndex: 20
              }}
            >
              <div
                className="rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-4 border-white flex items-center justify-center overflow-hidden shadow-lg"
                style={{
                  width: `${spacing.avatarSize}px`,
                  height: `${spacing.avatarSize}px`
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="text-gray-500"
                    style={{
                      width: `${spacing.avatarSize * 0.6}px`,
                      height: `${spacing.avatarSize * 0.6}px`
                    }}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Top section with logo/event name */}
          <div
            className="relative z-10 flex flex-col items-center justify-center"
            style={{
              height: isLandscape ? '55%' : '65%',
              paddingLeft: `${spacing.padding}px`,
              paddingRight: `${spacing.padding}px`,
              paddingTop: `${(showAvatar ? 16 : 20) * scale}px`,
              paddingBottom: showAvatar ? `${spacing.avatarSize * 0.5}px` : `${spacing.padding}px`
            }}
          >
            <div className="text-center flex flex-col items-center w-full">
              {/* Logo placeholder */}
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  style={{
                    maxHeight: `${(showAvatar ? (isLandscape ? 60 : 70) : (isLandscape ? 70 : 80)) * scale}px`,
                    maxWidth: `${(showAvatar ? (isLandscape ? 80 : 90) : (isLandscape ? 90 : 100)) * scale}px`,
                    objectFit: 'contain',
                    marginBottom: `${(showAvatar ? 4 : 6) * scale}px`
                  }}
                />
              ) : (
                <div
                  className="bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center mb-2 border border-white/20"
                  style={{
                    width: `${(showAvatar ? (isLandscape ? 60 : 70) : (isLandscape ? 70 : 80)) * scale}px`,
                    height: `${(showAvatar ? (isLandscape ? 50 : 60) : (isLandscape ? 60 : 70)) * scale}px`,
                    marginBottom: `${(showAvatar ? 4 : 6) * scale}px`
                  }}
                >
                  <span
                    className="font-bold text-white/80"
                    style={{
                      fontSize: `${(showAvatar ? (isLandscape ? 8 : 10) : (isLandscape ? 10 : 12)) * scale}px`
                    }}
                  >
                    LOGO
                  </span>
                </div>
              )}

              <h2
                className="font-bold text-white tracking-wide"
                style={{
                  fontSize: `${showAvatar ? (isLandscape ? 13 : 15) * scale : (isLandscape ? 15 : 18) * scale}px`,
                  marginBottom: `${(showAvatar ? 1 : 2) * scale}px`,
                  lineHeight: '1.2',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {`{{eventTitle}}`}
              </h2>
              <p
                className="text-white/90 font-medium"
                style={{
                  fontSize: `${showAvatar ? (isLandscape ? 7 : 9) * scale : (isLandscape ? 9 : 10) * scale}px`,
                  lineHeight: '1.3'
                }}
              >
                {`{{startDate}} - {{endDate}}`}
              </p>
            </div>
          </div>

          {/* Bottom white section */}
          <div
            className="relative z-10 flex flex-col justify-between bg-white"
            style={{
              height: isLandscape ? '45%' : '35%',
              paddingLeft: `${spacing.padding}px`,
              paddingRight: `${spacing.padding}px`,
              paddingTop: showAvatar ? `${spacing.avatarSize * 0.55}px` : `${spacing.padding * 1.5}px`,
              paddingBottom: showAvatar ? `${spacing.padding * 0.8}px` : `${spacing.padding}px`,
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px'
            }}
          >
            <div className="flex-1">
              <h3
                className="font-bold text-gray-900 text-center"
                style={{
                  fontSize: `${showAvatar ? (isLandscape ? 11 : 13) * scale : (isLandscape ? 14 : 16) * scale}px`,
                  marginBottom: `${(showAvatar ? 1 : 2) * scale}px`,
                  lineHeight: '1.2'
                }}
              >
                {(() => {
                  console.log('Rendering participantName template variable');
                  return `{{participantName}}`;
                })()}
              </h3>
              <p
                className="text-gray-600 text-center font-medium"
                style={{
                  fontSize: `${showAvatar ? (isLandscape ? 7 : 9) * scale : (isLandscape ? 9 : 11) * scale}px`,
                  lineHeight: '1.3',
                  marginBottom: `${(showAvatar ? 1 : 2) * scale}px`
                }}
              >
                {`{{participantRole}}`}
              </p>
              <p
                className="text-gray-500 text-center text-xs"
                style={{
                  fontSize: `${showAvatar ? (isLandscape ? 6 : 7) * scale : (isLandscape ? 8 : 9) * scale}px`,
                  lineHeight: '1.3'
                }}
              >
                {`{{badgeTagline}}`}
              </p>
            </div>

            {/* Bottom section with contact and QR */}
            <div className="flex items-end justify-between mt-auto">
              <div className="flex-1">
                <p
                  className="text-gray-400 text-xs"
                  style={{
                    fontSize: `${showAvatar ? (isLandscape ? 5 : 6) * scale : (isLandscape ? 7 : 8) * scale}px`,
                    lineHeight: '1.4'
                  }}
                >
                  {contactPhone || '+123 456 789'}<br />
                  {websiteUrl || 'www.msf.org'}
                </p>
              </div>

              {showQR && (
                <div
                  className="bg-white border border-gray-300 rounded flex items-center justify-center"
                  style={{
                    width: `${spacing.qrSize}px`,
                    height: `${spacing.qrSize}px`
                  }}
                >
                  <div
                    className="bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                    style={{
                      width: `${spacing.qrInner}px`,
                      height: `${spacing.qrInner}px`
                    }}
                  >
                    <span
                      className="font-medium text-gray-600"
                      style={{ fontSize: `${showAvatar ? (isLandscape ? 5 : 6) * scale : (isLandscape ? 6 : 7) * scale}px` }}
                    >
                      QR
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BadgeDesignPage() {
  console.log('BadgeDesignPage component starting to render');
  const params = useParams()
  const tenantSlug = params.slug as string
  const { user, loading: authLoading } = useAuth()
  const { apiClient } = useAuthenticatedApi()

  console.log('BadgeDesignPage: Initial state setup');
  const [templates, setTemplates] = useState<BadgeTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<BadgeTemplate | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  console.log('BadgeDesignPage: Setting up formData state');
  // Form state for live preview
  const [formData, setFormData] = useState<BadgeFormData>({
    name: '',
    description: '',
    template_content: '',
    badge_size: 'standard',
    orientation: 'portrait',
    enable_qr_code: true,
    include_avatar: false,
    contact_phone: '',
    website_url: '',
    logo_url: '',
    avatar_url: ''
  })

  console.log('BadgeDesignPage: formData initialized:', formData);

  const canEdit = Boolean(user?.role && ['super_admin', 'SUPER_ADMIN', 'mt_admin', 'hr_admin', 'event_admin'].includes(user.role))

  const uploadToCloudinary = async (file: File): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData()
    formData.append('file', file)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${apiUrl}/api/v1/documents/upload-logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const data = await response.json()
    return { url: data.url, publicId: data.public_id }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const { url } = await uploadToCloudinary(file)
      setFormData({ ...formData, logo_url: url })
      toast.success('Logo uploaded successfully')
    } catch (error) {
      console.error('Logo upload error:', error)
      toast.error('Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/documents/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setFormData(prev => ({ ...prev, avatar_url: data.url }))
      toast.success('Avatar uploaded successfully')
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        template_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Badge</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @media print {
      body { margin: 0; padding: 0; }
      @page { size: A4; margin: 0.5in; }
      .badge { page-break-inside: avoid; }
      * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    body {
      font-family: Arial, sans-serif;
      background: #f3f4f6;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .badge {
      width: 280px;
      height: 450px;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      background: white;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    /* Red background - absolute positioning covering exactly 273px */
    .red-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 273px;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
      z-index: 0;
    }
    /* Hanging hole */
    .hole {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      width: 14px;
      height: 14px;
      background: white;
      border-radius: 50%;
      border: 1px solid rgba(0,0,0,0.1);
      z-index: 30;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    /* Avatar at the red/white boundary - at exactly 273px */
    .avatar {
      position: absolute;
      top: 273px;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${formData.include_avatar ? '60px' : '0'};
      height: ${formData.include_avatar ? '60px' : '0'};
      border-radius: 50%;
      border: 4px solid white;
      z-index: 20;
      object-fit: cover;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ${formData.include_avatar ? '' : 'display: none;'}
    }
    /* Top content section - relative positioning */
    .top-section {
      position: relative;
      z-index: 10;
      height: 273px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: ${formData.include_avatar ? '20px 20px 35px 20px' : '30px 20px'};
      text-align: center;
      color: white;
    }
    .logo-container {
      margin-bottom: 10px;
    }
    .logo-container img {
      max-width: 100px;
      max-height: 70px;
      object-fit: contain;
    }
    .event-title {
      font-size: 18px;
      font-weight: bold;
      margin: 10px 0 5px 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      line-height: 1.2;
    }
    .event-dates {
      font-size: 10px;
      opacity: 0.9;
      line-height: 1.3;
    }
    /* Bottom content section - relative positioning, 177px (450 - 273) */
    .bottom-section {
      position: relative;
      z-index: 10;
      height: 177px;
      background: white;
      padding: ${formData.include_avatar ? '40px 20px 20px 20px' : '20px'};
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .participant-info {
      text-align: center;
      margin-top: ${formData.include_avatar ? '10px' : '0'};
      flex: 1;
    }
    .participant-name {
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
      margin: 0 0 5px 0;
      line-height: 1.2;
    }
    .participant-role {
      font-size: 11px;
      color: #6b7280;
      margin: 0 0 5px 0;
    }
    .badge-tagline {
      font-size: 9px;
      color: #9ca3af;
      margin: 0;
    }
    .contact-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: auto;
      padding-top: 10px;
    }
    .contact-info {
      font-size: 8px;
      color: #9ca3af;
      line-height: 1.4;
      flex: 1;
    }
    .qr-code {
      width: 45px;
      height: 45px;
      border: 1px solid #d1d5db;
      display: ${formData.enable_qr_code ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      font-size: 7px;
      color: #6b7280;
      background: #f9fafb;
      margin-left: 10px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="badge">
    <!-- Red background -->
    <div class="red-bg"></div>

    <!-- Hanging hole -->
    <div class="hole"></div>

    <!-- Avatar (only if include_avatar is true) -->
    ${formData.include_avatar ? '{{participantAvatar}}' : ''}

    <!-- Top section with logo and event info -->
    <div class="top-section">
      <div class="logo-container">{{logo}}</div>
      <h2 class="event-title">{{eventTitle}}</h2>
      <p class="event-dates">{{startDate}} - {{endDate}}</p>
    </div>

    <!-- Bottom section with participant info -->
    <div class="bottom-section">
      <div class="participant-info">
        <h3 class="participant-name">{{participantName}}</h3>
        <p class="participant-role">{{participantRole}}</p>
        <p class="badge-tagline">{{badgeTagline}}</p>
      </div>
      <div class="contact-section">
        <div class="contact-info">
          ${formData.contact_phone || '+123 456 789'}<br/>
          ${formData.website_url || 'www.msf.org'}
        </div>
        <div class="qr-code">QR</div>
      </div>
    </div>
  </div>
</body>
</html>`,
        badge_size: formData.badge_size,
        orientation: formData.orientation,
        enable_qr_code: formData.enable_qr_code,
        is_active: true,
        contact_phone: formData.contact_phone,
        website_url: formData.website_url,
        logo_url: formData.logo_url,
        avatar_url: formData.avatar_url,
        include_avatar: formData.include_avatar
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      let response
      
      if (editingTemplate) {
        response = await fetch(`${apiUrl}/api/v1/tenants/${tenantSlug}/badge-templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiClient.getToken()}`
          },
          body: JSON.stringify(payload)
        })
      } else {
        response = await fetch(`${apiUrl}/api/v1/tenants/${tenantSlug}/badge-templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiClient.getToken()}`
          },
          body: JSON.stringify(payload)
        })
      }

      if (response.ok) {
        toast.success(`Badge template ${editingTemplate ? 'updated' : 'created'} successfully`)
        setModalOpen(false)
        resetForm()
        loadTemplates()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to save template')
      }
    } catch (error) {
      console.error('Template save error:', error)
      toast.error(error.message || 'Failed to save template')
    } finally {
      setSubmitting(false)
    }
  }

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
        toast.success('Template deleted successfully')
        loadTemplates()
      } else {
        throw new Error('Failed to delete template')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete template')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template_content: '',
      badge_size: 'standard',
      orientation: 'portrait',
      enable_qr_code: true,
      include_avatar: false,
      contact_phone: '',
      website_url: '',
      logo_url: '',
      avatar_url: ''
    })
    setEditingTemplate(null)
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
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Badge Templates</h1>
                <p className="text-sm text-gray-600">Design and manage event badge templates with live preview</p>
              </div>
            </div>
            {canEdit && (
              <Dialog open={modalOpen} onOpenChange={(open) => {
                setModalOpen(open)
                if (!open) resetForm()
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-2 text-xs">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[1200px] bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col" showCloseButton={false}>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                    <span className="sr-only">Close</span>
                  </button>

                  <div className="p-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <DialogTitle className="text-lg font-bold text-gray-900">
                          {editingTemplate ? 'Edit Badge Template' : 'Create Badge Template'}
                        </DialogTitle>
                        <p className="text-gray-600 text-xs mt-1">
                          Design a reusable badge template for events
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Form Section */}
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Template Settings</h3>

                        <div>
                          <Label htmlFor="name" className="text-xs font-medium text-gray-700">Template Name</Label>
                          <Input
                            id="name"
                            placeholder="Enter template name"
                            className="mt-1"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="description" className="text-xs font-medium text-gray-700">Description</Label>
                          <Input
                            id="description"
                            placeholder="Brief description of the badge template"
                            className="mt-1"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          />
                        </div>



                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-gray-700">Badge Size</Label>
                            <select
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-xs"
                              value={formData.badge_size}
                              onChange={(e) => setFormData({ ...formData, badge_size: e.target.value as 'small' | 'standard' | 'large' })}
                            >
                              <option value="small">Small</option>
                              <option value="standard">Standard</option>
                              <option value="large">Large</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-700">Orientation</Label>
                            <select
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-xs"
                              value={formData.orientation}
                              onChange={(e) => setFormData({ ...formData, orientation: e.target.value as 'portrait' | 'landscape' })}
                            >
                              <option value="portrait">Portrait</option>
                              <option value="landscape">Landscape</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="qr_code"
                            className="rounded"
                            checked={formData.enable_qr_code}
                            onChange={(e) => setFormData({ ...formData, enable_qr_code: e.target.checked })}
                          />
                          <Label htmlFor="qr_code" className="text-xs text-gray-700">Include QR Code</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="avatar"
                            className="rounded"
                            checked={formData.include_avatar}
                            onChange={(e) => setFormData({ ...formData, include_avatar: e.target.checked })}
                          />
                          <Label htmlFor="avatar" className="text-xs text-gray-700">Include Avatar</Label>
                        </div>

                        <div>
                          <Label htmlFor="contact_phone" className="text-xs font-medium text-gray-700">Contact Phone</Label>
                          <Input
                            id="contact_phone"
                            placeholder="+123 456 789"
                            className="mt-1"
                            value={formData.contact_phone}
                            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="website_url" className="text-xs font-medium text-gray-700">Website URL</Label>
                          <Input
                            id="website_url"
                            placeholder="www.msf.org"
                            className="mt-1"
                            value={formData.website_url}
                            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-xs font-medium text-gray-700">Logo</Label>
                          {formData.logo_url ? (
                            <div className="relative">
                              <img 
                                src={formData.logo_url} 
                                alt="Logo"
                                className="w-full h-24 object-contain bg-gray-50 rounded border"
                              />
                            </div>
                          ) : (
                            <div className="h-24 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                              <div className="text-center">
                                <Image className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-400">No logo uploaded</p>
                              </div>
                            </div>
                          )}

                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-blue-600 mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3 mr-2" />
                                Upload Logo
                              </>
                            )}
                          </Button>
                        </div>

                        {formData.include_avatar && (
                          <div className="space-y-3">
                            <Label className="text-xs font-medium text-gray-700">Avatar</Label>
                            {formData.avatar_url ? (
                              <div className="relative">
                                <img 
                                  src={formData.avatar_url} 
                                  alt="Avatar"
                                  className="w-24 h-24 object-cover bg-gray-50 rounded-full border mx-auto"
                                />
                              </div>
                            ) : (
                              <div className="h-24 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                                <div className="text-center">
                                  <Image className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-400">No avatar uploaded</p>
                                </div>
                              </div>
                            )}

                            <input
                              ref={avatarInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarUpload}
                            />

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => avatarInputRef.current?.click()}
                              disabled={uploading}
                            >
                              {uploading ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-blue-600 mr-2" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3 h-3 mr-2" />
                                  Upload Avatar
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Preview Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold text-gray-900">Live Preview</h3>
                          <div className="text-xs text-gray-500">
                            {formData.badge_size.charAt(0).toUpperCase() + formData.badge_size.slice(1)} • {formData.orientation.charAt(0).toUpperCase() + formData.orientation.slice(1)}
                          </div>
                        </div>
                        <BadgePreview
                          size={formData.badge_size}
                          orientation={formData.orientation}
                          showQR={formData.enable_qr_code}
                          showAvatar={formData.include_avatar}
                          contactPhone={formData.contact_phone}
                          websiteUrl={formData.website_url}
                          logoUrl={formData.logo_url}
                          avatarUrl={formData.avatar_url}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t mt-6">
                      <div className="flex justify-end">
                        <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2 text-xs" onClick={handleSubmit} disabled={submitting}>
                          <Save className="w-4 h-4 mr-2" />
                          {submitting ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template')}
                        </Button>
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
                <h3 className="text-xs font-medium text-gray-900 mb-1">No badge templates yet</h3>
                <p className="text-xs text-gray-500 mb-3">Create your first badge template</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium text-gray-700">Name</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700">Created</TableHead>
                    <TableHead className="text-right text-xs font-medium text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium text-xs">{template.name}</TableCell>
                      <TableCell className="text-xs text-gray-600">{new Date(template.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setEditingTemplate(template)
                              setFormData({
                                name: template.name || '',
                                description: template.description || '',
                                template_content: template.template_content || '',
                                badge_size: template.badge_size as 'small' | 'standard' | 'large' || 'standard',
                                orientation: template.orientation as 'portrait' | 'landscape' || 'portrait',
                                enable_qr_code: template.enable_qr_code ?? true,
                                include_avatar: template.include_avatar ?? false,
                                contact_phone: template.contact_phone || '',
                                website_url: template.website_url || '',
                                logo_url: template.logo_url || '',
                                avatar_url: template.avatar_url || ''
                              })
                              setModalOpen(true)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-3 w-3" />
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