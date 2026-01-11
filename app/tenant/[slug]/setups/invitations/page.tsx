"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { toast } from "sonner";

import Swal from 'sweetalert2';
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Save, X, Edit, Trash2, Mail } from "lucide-react";

import { InvitationTemplateEditor } from "@/components/ui/invitation-template-editor";

interface InvitationTemplate {
  id: number;
  name: string;
  description: string;
  template_content: string;
  logo_url?: string;
  logo_public_id?: string;
  watermark_url?: string;
  watermark_public_id?: string;
  signature_url?: string;
  signature_public_id?: string;
  enable_qr_code: boolean;
  is_active?: boolean;
  address_fields?: string[];
  signature_footer_fields?: string[];
  created_at: string;
  updated_at: string;
}

export default function InvitationsPage() {
  const params = useParams();
  const tenantSlug = params.slug as string;
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const { resolvedTheme } = useTheme();

  const [templates, setTemplates] = useState<InvitationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InvitationTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    template_content: "",
    logo_url: "",
    logo_public_id: "",
    watermark_url: "",
    watermark_public_id: "",
    signature_url: "",
    signature_public_id: "",
    enable_qr_code: true,
  });

  const canEdit = Boolean(user?.role && ["super_admin", "SUPER_ADMIN", "mt_admin", "hr_admin", "event_admin"].includes(user.role));

  const handleSubmit = async (templateData: any) => {
    setSubmitting(true);

    try {
      const payload = {
        name: templateData.name,
        description: templateData.name,
        template_content: templateData.content,
        logo_url: templateData.logo_url || '',
        watermark_url: templateData.watermark_url || '',
        signature_url: templateData.signature_url || '',
        enable_qr_code: templateData.include_qr_code ?? true,
        is_active: templateData.is_active ?? true,
        address_fields: templateData.addressFields?.map((field: any) => field.text || field) || [],
        signature_footer_fields: templateData.signatureFooterFields?.map((field: any) => field.text || field) || []
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      let response;
      
      if (editingTemplate) {
        response = await fetch(`${apiUrl}/api/v1/tenants/${tenantSlug}/invitation-templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiClient.getToken()}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${apiUrl}/api/v1/tenants/${tenantSlug}/invitation-templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiClient.getToken()}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        toast.success(`Invitation template ${editingTemplate ? 'updated' : 'created'} successfully`);
        setModalOpen(false);
        resetForm();
        loadTemplates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save template');
      }
    } catch (error) {
      console.error('Template save error:', error);
      toast.error(error.message || "Failed to save template");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (templateId: number) => {
    const result = await Swal.fire({
      title: 'Delete Template?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/tenants/${tenantSlug}/invitation-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`
        }
      });
      
      if (response.ok) {
        toast.success("Template deleted successfully");
        loadTemplates();
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to delete template");
    }
  };

  const resetForm = () => {
    setTemplateForm({
      name: "",
      description: "",
      template_content: "",
      logo_url: "",
      logo_public_id: "",
      watermark_url: "",
      watermark_public_id: "",
      signature_url: "",
      signature_public_id: "",
      enable_qr_code: true,
    });
    setEditingTemplate(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    resetForm();
  };

  const loadTemplates = useCallback(async () => {
    if (!tenantSlug) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/tenants/${tenantSlug}/invitation-templates`, {
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        console.error('Failed to load templates:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  }, [apiClient, tenantSlug]);

  useEffect(() => {
    if (!authLoading && tenantSlug) {
      loadTemplates();
    }
  }, [authLoading, tenantSlug, loadTemplates]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-100 border-t-red-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Mail className="w-6 h-6 text-red-600 animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-base font-medium text-gray-900 dark:text-white">Loading invitation templates...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch the data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent dark:from-red-400/20 dark:via-red-400/10 dark:to-transparent"></div>
        <div className="relative p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 group-hover:scale-110 transition-all duration-300">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className={`text-sm sm:text-base font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Letter of Invitation Templates</h1>
                <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} hidden sm:block`}>Design invitation letter templates for events and meetings</p>
              </div>
            </div>
            {canEdit && (
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-xs px-3 py-2 w-full sm:w-auto">
                    <Plus className="w-3 h-3 mr-2" />
                    <span className="sm:hidden">Create</span>
                    <span className="hidden sm:inline">Create Template</span>
                  </Button>
                </DialogTrigger>
                <DialogContent style={{ background: resolvedTheme === 'dark' ? '#000000' : '#ffffff', border: resolvedTheme === 'dark' ? '1px solid #ffffff' : '1px solid #e5e7eb' }} className="sm:max-w-[1200px] shadow-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
                  <button
                    onClick={handleModalClose}
                    className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                    <span className="sr-only">Close</span>
                  </button>

                  <div style={{ borderBottom: resolvedTheme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb' }} className="p-6 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <DialogTitle style={{ color: resolvedTheme === 'dark' ? '#ffffff' : '#111827' }} className="text-xl font-bold">
                          {editingTemplate ? 'Edit Invitation Template' : 'Create Invitation Template'}
                        </DialogTitle>
                        <p style={{ color: resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563' }} className="text-sm mt-1">
                          Design a reusable invitation letter template for events
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <div className="space-y-2">
                      <Label style={{ color: resolvedTheme === 'dark' ? '#ffffff' : '#374151' }} className="text-sm font-medium mb-2 block">
                        Invitation Letter Design
                      </Label>
                      <p style={{ color: resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280' }} className="text-xs mb-4">
                        Use variables like {`{{participant_name}}`}, {`{{event_title}}`}, {`{{event_start_date}}`}, {`{{event_end_date}}`}, {`{{organization_address}}`}, etc.
                      </p>
                      <InvitationTemplateEditor
                        template={editingTemplate}
                        onSave={handleSubmit}
                        onCancel={handleModalClose}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </Card>

      <Card style={{ background: resolvedTheme === 'dark' ? '#000000' : '#ffffff', border: resolvedTheme === 'dark' ? '1px solid #ffffff' : '1px solid #e5e7eb' }}>
        <CardContent className="p-3 text-xs overflow-x-auto">
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <div className="rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3" style={{
                backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#f9fafb'
              }}>
                <Mail className="w-8 h-8" style={{
                  color: resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280'
                }} />
              </div>
              <h3 style={{ color: resolvedTheme === 'dark' ? '#ffffff' : '#111827' }} className="text-xs font-medium mb-1">No invitation templates yet</h3>
              <p style={{ color: resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280' }} className="text-xs mb-3">Create your first invitation letter template</p>
              {canEdit && (
                <Button
                  onClick={() => setModalOpen(true)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg text-xs"
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Create First Template
                </Button>
              )}
            </div>
            ) : (
              <div className="min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Template Name</TableHead>
                      <TableHead className="min-w-[100px] hidden sm:table-cell">Created Date</TableHead>
                      <TableHead className="min-w-[80px] hidden md:table-cell">Status</TableHead>
                      {canEdit && <TableHead className="text-right min-w-[100px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium text-xs">
                          <div className="max-w-[120px] truncate" title={template.name}>
                            {template.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">
                          {new Date(template.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">
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
                        {canEdit && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  console.log('Setting editing template:', template);
                                  setEditingTemplate(template);
                                  setModalOpen(true);
                                }}
                                title="Edit Template"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(template.id)}
                                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                title="Delete Template"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}