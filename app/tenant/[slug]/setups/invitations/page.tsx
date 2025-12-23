"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Swal from 'sweetalert2';

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
        toast({ 
          title: "Success", 
          description: `Invitation template ${editingTemplate ? 'updated' : 'created'} successfully` 
        });
        setModalOpen(false);
        resetForm();
        loadTemplates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save template');
      }
    } catch (error) {
      console.error('Template save error:', error);
      toast({ title: "Error", description: error.message || "Failed to save template", variant: "destructive" });
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
        toast({ title: "Success", description: "Template deleted successfully" });
        loadTemplates();
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
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
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-600">Loading invitation templates...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Letter of Invitation Templates</h1>
              <p className="text-sm text-gray-600">Design invitation letter templates for events and meetings</p>
            </div>
            {canEdit && (
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[1200px] bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
                  <button
                    onClick={handleModalClose}
                    className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                    <span className="sr-only">Close</span>
                  </button>

                  <div className="p-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-bold text-gray-900">
                          {editingTemplate ? 'Edit Invitation Template' : 'Create Invitation Template'}
                        </DialogTitle>
                        <p className="text-gray-600 text-sm mt-1">
                          Design a reusable invitation letter template for events
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Invitation Letter Design
                      </Label>
                      <p className="text-xs text-gray-500 mb-4">
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

        <Card>
          <CardContent className="p-4">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">No invitation templates yet</h3>
                <p className="text-xs text-gray-500 mb-4">Create your first invitation letter template</p>
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
                              console.log('Setting editing template:', template);
                              setEditingTemplate(template);
                              setModalOpen(true);
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
  );
}