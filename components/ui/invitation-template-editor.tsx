"use client";

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuthenticatedApi } from '@/lib/auth';
import { Checkbox } from '@/components/ui/checkbox';
import { InvitationRichTextEditor } from '@/components/ui/invitation-rich-text-editor';
import { Upload, Eye, Save, FileText, Image, FileSignature, Layers, QrCode, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

interface InvitationTemplateEditorProps {
  template?: any;
  onSave: (template: any) => void;
  onCancel: () => void;
}

export function InvitationTemplateEditor({ template, onSave, onCancel }: InvitationTemplateEditorProps) {
  const { apiClient } = useAuthenticatedApi();
  const { resolvedTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || 'Letter of Invitation',
    content: (() => {
      let content = template?.template_content || `<style>.letterhead { display: grid; grid-template-columns: auto 1fr auto; align-items: center; padding: 0; margin: 0; } .logo img { height: 120px; max-width: 200px; } .qr { display: flex; justify-content: center; } .qr-box { border: 1px solid #000; padding: 12px; text-align: center; font-size: 12px; } .address { text-align: left; font-size: 14px; line-height: 1.5; justify-self: end; } .address p, .address a { margin: 0; display: block; } .address .org { font-weight: bold; } .address .tel { margin-top: 6px; } .address a { color: #1a73e8; text-decoration: none; }</style><div class="letterhead"><div class="logo">{{logo}}</div><div class="qr">{{qr_code}}</div><div class="address">{{organization_address}}</div></div><hr style="border: none; border-top: 2px solid #000; margin: 20px 0;" /><div style="margin: 30px 0; font-size: 14px; line-height: 1.6;"><p>The Director of Immigration Services<br>Nyayo House<br>NAIROBI, KENYA</p><p style="margin: 20px 0;">Dear Sir/Madam,</p><p style="margin: 20px 0; font-weight: bold;">RE: LETTER OF INVITATION FOR {{participant_name}}, PASSPORT NUMBER: {{passport_number}}</p><p style="margin: 20px 0; text-align: justify;">Médecins Sans Frontières (MSF) is a private international, independent, medical humanitarian organization that delivers emergency aid to people affected by armed conflict, epidemic, healthcare exclusion and natural or man-made disasters.</p><p style="margin: 20px 0; text-align: justify;">MSF has an Operational Support Hub in Kenya, where employees as well as visitors come in for meetings, project visit, induction and training. We will be having {{participant_name}} attend a {{event_name}} in {{event_location}} from {{event_start_date}} to {{event_end_date}}. Therefore, MSF kindly requests you to issue an electronic Travel Authorization (eTA), to Nairobi. They will be in possession of a return flight ticket to their project country.</p><p style="margin: 20px 0; text-align: justify;">During their time in Kenya, {{participant_name}} will stay at {{accommodation_details}}. MSF guarantees to cover all costs related to their accommodation and onward travel.</p><p style="margin: 20px 0; font-weight: bold;">Passport details:</p><div style="margin: 20px 0;"><p>• Passport Number: {{passport_number}}</p><p>• Name: {{participant_name}}</p><p>• Nationality: {{nationality}}</p><p>• Date of Birth: {{date_of_birth}}</p><p>• Date of Issue: {{passport_issue_date}}</p><p>• Date of Expiry: {{passport_expiry_date}}</p></div><p style="margin: 30px 0 50px 0;">Thank you for your time and consideration.</p></div><div style="margin: 50px 0;">{{signature}}<p style="margin-top: 10px;"><strong>{{organizer_name}}</strong><br>{{organizer_title}}<br>{{organization_name}}</p></div><hr style="border: none; border-top: 2px solid #000; margin: 40px 0 20px 0;" /><div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #666;"><div style="flex: 1; text-align: center; font-weight: bold;">MEDECINS SANS FRONTIERES IS A PRIVATE INTERNATIONAL HUMANITARIAN ORGANISATION</div></div>`;
      
      // Auto-update existing templates with new CSS
      if (template?.template_content) {
        content = content
          .replace(/\.logo img \{ height: 60px; \}/g, '.logo img { height: 120px; max-width: 200px; }')
          .replace(/\.address \{ background: red; color: white; text-align: right;([^}]+)\}/g, '.address { text-align: left; font-size: 14px; line-height: 1.5; justify-self: end; }')
          .replace(/\.address p, \.address a \{ margin: 0; display: block; color: white; \}/g, '.address p, .address a { margin: 0; display: block; }')
          .replace(/<p style="margin-top: 10px;"><strong>{{organizer_name}}<\/strong><br>{{organizer_title}}<br>{{organization_name}}<\/p>/g, '{{signature_footer}}');
      }
      
      return content
        .replace(/\.logo img \{ height: 60px; \}/g, '.logo img { height: 120px; max-width: 200px; }')
        .replace(/\.address \{ background: red; color: white; text-align: right;([^}]+)\}/g, '.address { text-align: left; font-size: 14px; line-height: 1.5; justify-self: end; }')
        .replace(/\.address p, \.address a \{ margin: 0; display: block; color: white; \}/g, '.address p, .address a { margin: 0; display: block; }')
        .replace(/<p style="margin-top: 10px;"><strong>{{organizer_name}}<\/strong><br>{{organizer_title}}<br>{{organization_name}}<\/p>/g, '{{signature_footer}}');
    })(),
    logo_url: template?.logo_url || '',
    watermark_url: template?.watermark_url || '',
    signature_url: template?.signature_url || '',
    include_qr_code: template?.enable_qr_code ?? true,
    is_active: template?.is_active ?? true,
    addressFields: template?.address_fields ? template.address_fields.map((field: any) => {
      const text = typeof field === 'string' ? field : field.text || field;
      // Auto-detect field type based on content
      let type = 'text';
      if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('www.')) {
        type = 'link';
      } else if (text.includes('@') && text.includes('.')) {
        type = 'email';
      } else if (text.startsWith('Tel:') || text.startsWith('+') || /^\d{10,}$/.test(text.replace(/[\s-()]/g, ''))) {
        type = 'phone';
      }
      const result = { text, type };
      return result;
    }) : [{ text: 'Médecins Sans Frontières', type: 'text' }],
    signatureFooterFields: template?.signature_footer_fields ? template.signature_footer_fields.map((field: any) => {
      const text = typeof field === 'string' ? field : field.text || field;
      // Auto-detect field type based on content
      let type = 'text';
      if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('www.')) {
        type = 'link';
      } else if (text.includes('@') && text.includes('.')) {
        type = 'email';
      } else if (text.startsWith('Tel:') || text.startsWith('+') || /^\d{10,}$/.test(text.replace(/[\s-()]/g, ''))) {
        type = 'phone';
      }
      const result = { text, type };
      return result;
    }) : []
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('editor');

  const uploadToCloudinary = async (file: File, folder: string): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/v1/documents/upload-logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return { url: data.url, publicId: data.public_id };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'watermark' | 'signature') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(type);
    try {
      let folderPath;
      if (type === 'logo') {
        folderPath = 'msafiri/logos';
      } else if (type === 'watermark') {
        folderPath = 'msafiri-documents/watermarks';
      } else if (type === 'signature') {
        folderPath = 'msafiri-documents/signatures';
      }
      
      const { url } = await uploadToCloudinary(file, folderPath);
      
      setFormData({ ...formData, [`${type}_url`]: url });
      toast.success(`${type} uploaded successfully`);
    } catch (error) {
      console.error(`${type} upload error:`, error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  const generatePreview = () => {
    const sampleData = {
      participant_name: 'John Doe',
      passport_number: 'A12345678',
      nationality: 'American',
      date_of_birth: '1985-06-15',
      passport_issue_date: '2020-01-15',
      passport_expiry_date: '2030-01-15',
      event_name: 'MSF Kenya Strategic Planning Workshop',
      event_start_date: '2026-01-05',
      event_end_date: '2026-01-09',
      event_location: 'Nairobi',
      accommodation_details: 'The Heron Hotel',
      organization_name: 'MSF Kenya Office',
      organization_address: (() => {
        const filteredFields = formData.addressFields.filter(field => {
          const text = field.text || field;
          return text && typeof text === 'string' && text.trim();
        });
        
        const addressHtml = filteredFields.map((field, index) => {
          const text = field.text || field;
          const type = field.type || 'text';
          const className = index === 0 ? 'org' : (text.startsWith('Tel:') ? 'tel' : '');
          const classAttr = className ? ` class="${className}"` : '';
          
          let result;
          switch(type) {
            case 'link': result = `<a href="${text}"${classAttr}>${text}</a>`; break;
            case 'email': result = `<a href="mailto:${text}"${classAttr}>${text}</a>`; break;
            case 'phone': 
              const phoneHref = text.startsWith('Tel:') ? text.replace('Tel:', '').trim() : text;
              result = `<a href="tel:${phoneHref}"${classAttr}>${text}</a>`; 
              break;
            default: result = `<p${classAttr}>${text}</p>`;
          }
          return result;
        }).join('');
        
        const finalAddress = addressHtml || '<p class="org">Médecins Sans Frontières</p><p>P.O. Box 14500-00800</p><p>Nairobi, Kenya</p><p class="tel">Tel: +254 20 123 4567</p><a href="https://www.msf.org">www.msf.org</a>';
        return finalAddress;
      })(),
      signature_footer: formData.signatureFooterFields.filter(field => {
        const text = field.text || field;
        return text && typeof text === 'string' && text.trim();
      }).length > 0 
        ? '<div style="margin-top: 20px; font-size: 12px; line-height: 1.4;">' + formData.signatureFooterFields.filter(field => {
          const text = field.text || field;
          return text && typeof text === 'string' && text.trim();
        }).map(field => {
          const text = field.text || field;
          const type = field.type || 'text';
          switch(type) {
            case 'link': return `<a href="${text}" style="color: #2563eb; text-decoration: underline;">${text}</a>`;
            case 'email': return `<a href="mailto:${text}" style="color: #2563eb; text-decoration: underline;">${text}</a>`;
            case 'phone': return `<a href="tel:${text}" style="color: #2563eb; text-decoration: underline;">${text}</a>`;
            default: return text;
          }
        }).join('<br>') + '</div>' 
        : '',
      organizer_name: 'Jane Smith',
      organizer_title: 'Country Director',
      logo: formData.logo_url 
        ? `<img src="${formData.logo_url}" alt="Organization Logo" style="max-height: 120px; max-width: 200px; display: block;" />` 
        : '<div style="width: 200px; height: 120px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #6b7280;">LOGO</div>',
      signature: formData.signature_url 
        ? `<img src="${formData.signature_url}" alt="Signature" style="max-height: 40px; max-width: 150px; display: block;" />` 
        : '<div style="width: 150px; height: 40px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #6b7280;">SIGNATURE</div>',
      qr_code: formData.include_qr_code 
        ? '<div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border: 1px solid #000; background: #f9f9f9;"><span style="font-size: 8px; color: #666; text-align: center;">QR CODE<br>(Preview Only)</span></div>' 
        : ''
    };

    let preview = formData.content;
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      preview = preview.replace(regex, value);
    });

    return preview;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList style={{ background: resolvedTheme === 'dark' ? '#374151' : '#f3f4f6' }} className="grid w-full grid-cols-2 p-1 rounded-lg">
          <TabsTrigger 
            value="editor" 
            style={{ 
              background: activeTab === 'editor' ? (resolvedTheme === 'dark' ? '#000000' : '#ffffff') : 'transparent',
              color: resolvedTheme === 'dark' ? '#ffffff' : '#111827'
            }}
            className="data-[state=active]:shadow-sm transition-all duration-200 rounded-md font-medium"
          >
            <FileText className="w-4 h-4 mr-2" />
            Editor
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            style={{ 
              background: activeTab === 'preview' ? (resolvedTheme === 'dark' ? '#000000' : '#ffffff') : 'transparent',
              color: resolvedTheme === 'dark' ? '#ffffff' : '#111827'
            }}
            className="data-[state=active]:shadow-sm transition-all duration-200 rounded-md font-medium"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label style={{ color: resolvedTheme === 'dark' ? '#ffffff' : '#374151' }} htmlFor="name" className="text-sm font-medium mb-2 block">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter template name"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 style={{ color: resolvedTheme === 'dark' ? '#ffffff' : '#374151' }} className="text-sm font-medium">Organization Address (Top Right)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 text-blue-700 font-medium transition-all duration-200"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    addressFields: [...prev.addressFields, { text: '', type: 'text' }]
                  }))}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>
              <div className="space-y-2">
                {formData.addressFields.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={field.text || field}
                      onChange={(e) => {
                        const newFields = [...formData.addressFields];
                        newFields[index] = typeof field === 'string' ? { text: e.target.value, type: 'text' } : { ...field, text: e.target.value };
                        setFormData(prev => ({ ...prev, addressFields: newFields }));
                      }}
                      placeholder={`Address line ${index + 1}`}
                      className="flex-1"
                    />
                    <select
                      value={field.type || 'text'}
                      onChange={(e) => {
                        const newFields = [...formData.addressFields];
                        newFields[index] = typeof field === 'string' ? { text: field, type: e.target.value } : { ...field, type: e.target.value };
                        setFormData(prev => ({ ...prev, addressFields: newFields }));
                      }}
                      style={{ 
                        background: resolvedTheme === 'dark' ? '#000000' : '#ffffff',
                        color: resolvedTheme === 'dark' ? '#ffffff' : '#111827',
                        border: resolvedTheme === 'dark' ? '1px solid #ffffff' : '1px solid #d1d5db'
                      }}
                      className="px-3 py-2 rounded-md text-sm min-w-[100px]"
                    >
                      <option value="text">Text</option>
                      <option value="link">Link</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                    </select>
                    {formData.addressFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-all duration-200"
                        onClick={() => {
                          const newFields = formData.addressFields.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, addressFields: newFields }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 style={{ color: resolvedTheme === 'dark' ? '#ffffff' : '#374151' }} className="text-sm font-medium">Signature Footer (Below Signature)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-purple-200 text-purple-700 font-medium transition-all duration-200"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    signatureFooterFields: [...prev.signatureFooterFields, { text: '', type: 'text' }]
                  }))}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>
              <div className="space-y-2">
                {formData.signatureFooterFields.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={field.text || field}
                      onChange={(e) => {
                        const newFields = [...formData.signatureFooterFields];
                        newFields[index] = typeof field === 'string' ? { text: e.target.value, type: 'text' } : { ...field, text: e.target.value };
                        setFormData(prev => ({ ...prev, signatureFooterFields: newFields }));
                      }}
                      placeholder={`Footer line ${index + 1}`}
                      className="flex-1"
                    />
                    <select
                      value={field.type || 'text'}
                      onChange={(e) => {
                        const newFields = [...formData.signatureFooterFields];
                        newFields[index] = typeof field === 'string' ? { text: field, type: e.target.value } : { ...field, type: e.target.value };
                        setFormData(prev => ({ ...prev, signatureFooterFields: newFields }));
                      }}
                      style={{ 
                        background: resolvedTheme === 'dark' ? '#000000' : '#ffffff',
                        color: resolvedTheme === 'dark' ? '#ffffff' : '#111827',
                        border: resolvedTheme === 'dark' ? '1px solid #ffffff' : '1px solid #d1d5db'
                      }}
                      className="px-3 py-2 rounded-md text-sm min-w-[100px]"
                    >
                      <option value="text">Text</option>
                      <option value="link">Link</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-all duration-200"
                      onClick={() => {
                        const newFields = formData.signatureFooterFields.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, signatureFooterFields: newFields }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="qr_code"
                  checked={formData.include_qr_code}
                  onCheckedChange={(checked) => setFormData({ ...formData, include_qr_code: checked })}
                />
                <Label style={{ color: resolvedTheme === 'dark' ? '#ffffff' : '#374151' }} htmlFor="qr_code" className="text-sm font-medium cursor-pointer">Include QR Code</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label style={{ color: resolvedTheme === 'dark' ? '#ffffff' : '#374151' }} htmlFor="is_active" className="text-sm font-medium cursor-pointer">Active Template</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card style={{ background: resolvedTheme === 'dark' ? '#000000' : '#ffffff', border: resolvedTheme === 'dark' ? '1px solid #ffffff' : '2px dashed #e5e7eb' }} className="hover:border-gray-300 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Logo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                    onChange={(e) => handleFileUpload(e, 'logo')}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-200 text-green-700 font-medium transition-all duration-200"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploading === 'logo'}
                  >
                    {uploading === 'logo' ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-green-600 mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-2" />
                        Upload Logo
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              <Card style={{ background: resolvedTheme === 'dark' ? '#000000' : '#ffffff', border: resolvedTheme === 'dark' ? '1px solid #ffffff' : '2px dashed #e5e7eb' }} className="hover:border-gray-300 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileSignature className="w-4 h-4" />
                    Signature
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.signature_url ? (
                    <div className="relative">
                      <img 
                        src={formData.signature_url} 
                        alt="Signature"
                        className="w-full h-24 object-contain bg-gray-50 rounded border"
                      />
                    </div>
                  ) : (
                    <div className="h-24 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <FileSignature className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">No signature uploaded</p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'signature')}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 text-blue-700 font-medium transition-all duration-200"
                    onClick={() => signatureInputRef.current?.click()}
                    disabled={uploading === 'signature'}
                  >
                    {uploading === 'signature' ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-blue-600 mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-2" />
                        Upload Signature
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card style={{ background: resolvedTheme === 'dark' ? '#000000' : '#ffffff', border: resolvedTheme === 'dark' ? '1px solid #ffffff' : '2px dashed #e5e7eb' }} className="hover:border-gray-300 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Watermark
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.watermark_url ? (
                    <div className="relative">
                      <img 
                        src={formData.watermark_url} 
                        alt="Watermark"
                        className="w-full h-24 object-contain bg-gray-50 rounded border"
                      />
                    </div>
                  ) : (
                    <div className="h-24 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <Layers className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">No watermark uploaded</p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={watermarkInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'watermark')}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-purple-200 text-purple-700 font-medium transition-all duration-200"
                    onClick={() => watermarkInputRef.current?.click()}
                    disabled={uploading === 'watermark'}
                  >
                    {uploading === 'watermark' ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-purple-600 mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-2" />
                        Upload Watermark
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div>
              <Label style={{ color: resolvedTheme === 'dark' ? '#ffffff' : '#374151' }} htmlFor="content" className="text-sm font-medium mb-2 block">Template Content</Label>
              <InvitationRichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Enter your invitation template content..."
                height={400}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-6">
          <Card style={{ background: resolvedTheme === 'dark' ? '#000000' : '#ffffff', border: resolvedTheme === 'dark' ? '1px solid #ffffff' : '1px solid #e5e7eb' }}>
            <CardHeader>
              <CardTitle style={{ color: resolvedTheme === 'dark' ? '#ffffff' : '#111827' }} className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Letter of Invitation Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <div className="min-w-[600px] max-w-4xl mx-auto bg-white p-4 md:p-8 shadow-lg border relative">
                  <div 
                    className="prose max-w-none text-sm md:text-base"
                    dangerouslySetInnerHTML={{ __html: generatePreview() }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div style={{ borderTop: resolvedTheme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb' }} className="flex justify-end space-x-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="px-6 bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 font-medium transition-all duration-200"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          className="px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Save className="h-4 w-4 mr-2" />
          {template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </div>
  );
}