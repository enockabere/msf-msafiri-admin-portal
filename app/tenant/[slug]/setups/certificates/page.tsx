"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { useTheme } from "next-themes";
import { toast } from "@/hooks/use-toast";


import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Save, X, Edit, Trash2, Award, FileText } from "lucide-react";

import { CertificateTemplateEditor } from "@/components/ui/certificate-template-editor";

interface CertificateTemplate {
  id: number;
  name: string;
  description: string;
  template_content: string;
  logo_url?: string;
  logo_public_id?: string;
  created_at: string;
  updated_at: string;
}

export default function CertificatesPage() {
  const params = useParams();
  const tenantSlug = params.slug as string;
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    template_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', serif;
    }
    .certificate-page {
      width: 210mm;
      height: 297mm;
      position: relative;
      padding: 15mm;
      box-sizing: border-box;
      page-break-after: always;
    }
    .certificate-border {
      border: 3px solid #d32f2f;
      height: 100%;
      padding: 30px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
      position: relative;
    }
  </style>
</head>
<body>
<!-- Page 1: Certificate -->
<div class="certificate-page">
  <div class="certificate-border">
    <!-- Logo placeholder -->
    <div style="text-align: center; margin-bottom: 25px;">
      {{logo}}
    </div>

    <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #000;">TRAINING ATTENDANCE CERTIFICATE</h1>

    <p style="font-size: 13px; margin: 20px 0;">This certificate attests to the fact that</p>

    <h2 style="font-size: 20px; font-weight: bold; margin: 25px 0; border-bottom: 2px dotted #000; display: inline-block; padding-bottom: 3px;">{{participantName}}</h2>

    <p style="font-size: 13px; margin: 20px 0;">has participated in and completed the</p>

    <h3 style="font-size: 18px; font-weight: bold; margin: 25px 0; color: #d32f2f; text-decoration: underline;">{{eventTitle}}</h3>

    <p style="font-size: 12px; margin: 20px 0; line-height: 1.6;">From {{startDate}} until {{endDate}},<br/>
    Organized by Médecins Sans Frontières OCA<br/>
    Location: {{eventLocation}}</p>

    <!-- QR Code -->
    <div style="position: absolute; bottom: 10px; right: 10px;">
      {{qrCode}}
    </div>

    <div style="display: flex; justify-content: space-between; margin-top: 60px; text-align: left;">
      <div style="width: 30%;">
        <div style="margin-bottom: 5px; height: 45px;"></div>
        <p style="font-size: 12px; font-weight: bold; margin: 0;">{{organizerName}}</p>
        <p style="font-size: 11px; margin: 0;">{{organizerTitle}}</p>
      </div>

      <div style="width: 30%;">
        <div style="margin-bottom: 5px; height: 45px;"></div>
        <p style="font-size: 12px; font-weight: bold; margin: 0;">{{facilitatorName}}</p>
        <p style="font-size: 11px; margin: 0;">{{facilitatorTitle}}</p>
      </div>

      <div style="width: 30%;">
        <div style="margin-bottom: 5px; height: 45px;"></div>
        <p style="font-size: 12px; font-weight: bold; margin: 0;">{{coordinatorName}}</p>
        <p style="font-size: 11px; margin: 0;">{{coordinatorTitle}}</p>
      </div>
    </div>
  </div>
</div>

<!-- Page 2: Course Details with Watermark -->
<div class="certificate-page">
  <div class="certificate-border" style="text-align: left; position: relative;">
    <!-- Watermark logo in background -->
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.08; z-index: 0; pointer-events: none;">
      {{logoWatermark}}
    </div>

    <div style="position: relative; z-index: 1;">
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #d32f2f; text-align: center; text-decoration: underline;">{{eventTitle}}</h2>

      <div style="margin-bottom: 25px;">
        <h3 style="font-size: 15px; font-weight: bold; margin-bottom: 10px; color: #000;">ABOUT</h3>
        <div style="font-size: 12px; line-height: 1.6; color: #333;">{{courseDescription}}</div>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="font-size: 15px; font-weight: bold; margin-bottom: 10px; color: #000;">COURSE OBJECTIVES</h3>
        <div style="font-size: 12px; line-height: 1.6; color: #333; padding-left: 20px;">
          {{#each courseObjectives}}
          <li style="margin-bottom: 4px;">{{this}}</li>
          {{/each}}
        </div>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="font-size: 15px; font-weight: bold; margin-bottom: 10px; color: #000;">KEY COURSE CONTENTS</h3>
        <div style="font-size: 12px; line-height: 1.6; color: #333; padding-left: 20px;">
          {{#each courseContents}}
          <li style="margin-bottom: 4px;">{{this}}</li>
          {{/each}}
        </div>
      </div>

      <div style="margin-top: 40px; text-align: center;">
        <p style="font-size: 12px; color: #666; margin: 5px 0;">Certificate issued on {{certificateDate}}</p>
        <p style="font-size: 12px; color: #666; margin: 5px 0;">Location: {{eventLocation}}</p>
      </div>
    </div>
  </div>
</div>
</body>
</html>`,
    logo_url: "",
    logo_public_id: "",
  });

  const fetchTemplates = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      const data = await apiClient.request<CertificateTemplate[]>('/certificate-templates', {
        headers: { 'X-Tenant-ID': tenantSlug }
      });
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, apiClient, tenantSlug]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchTemplates();
    }
  }, [authLoading, user, fetchTemplates]);

  const canEdit = Boolean(user?.role && ["super_admin", "SUPER_ADMIN", "mt_admin", "hr_admin", "event_admin"].includes(user.role));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const endpoint = editingTemplate 
        ? `/certificate-templates/${editingTemplate.id}`
        : '/certificate-templates';
      
      const method = editingTemplate ? "PUT" : "POST";

      await apiClient.request(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          'X-Tenant-ID': tenantSlug
        },
        body: JSON.stringify(templateForm),
      });

      await fetchTemplates();
      setModalOpen(false);
      resetForm();
      toast({ 
        title: "Success", 
        description: `Certificate template ${editingTemplate ? 'updated' : 'created'} successfully` 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template: CertificateTemplate) => {
    console.log('Editing template:', template);
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      template_content: template.template_content,
      logo_url: template.logo_url || "",
      logo_public_id: template.logo_public_id || "",
    });
    setModalOpen(true);
    console.log('Template form set to:', {
      name: template.name,
      description: template.description,
    });
  };

  const handleDelete = async (template: CertificateTemplate) => {
    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Delete Certificate Template?",
      text: `This will permanently delete "${template.name}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.request(`/certificate-templates/${template.id}`, {
        method: "DELETE",
        headers: { 'X-Tenant-ID': tenantSlug }
      });

      await fetchTemplates();
      toast({ title: "Success", description: "Certificate template deleted successfully" });
    } catch (error) {
      console.error("Delete template error:", error);
      const errorMessage = error instanceof Error ? error.message : "Network error occurred";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setTemplateForm({
      name: "",
      description: "",
      template_content: "",
      logo_url: "",
      logo_public_id: "",
    });
    setEditingTemplate(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-100 border-t-red-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Award className="w-6 h-6 text-red-600 animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-base font-medium text-gray-900 dark:text-white">Loading certificate templates...</p>
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
                <Award className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className={`text-sm sm:text-base font-medium ${mounted && theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Certificate Templates</h1>
                <p className={`text-xs ${mounted && theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} hidden sm:block`}>Design certificate templates for events and training programs</p>
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
                <DialogContent 
                  className="w-[95vw] max-w-[1200px] max-h-[90vh] border shadow-lg scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 overflow-y-auto"
                  style={{
                    backgroundColor: mounted && theme === 'dark' ? '#000000' : '#ffffff',
                    borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb',
                    color: mounted && theme === 'dark' ? '#ffffff' : '#000000'
                  }}
                >
                  <DialogHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <DialogTitle>
                          {editingTemplate ? 'Edit Certificate Template' : 'Create Certificate Template'}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Design a reusable certificate template for events
                        </p>
                      </div>
                    </div>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">
                            Template Name <span className="text-red-600">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={templateForm.name}
                            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                            required
                            placeholder="e.g., HATT Certificate"
                            disabled={submitting}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={templateForm.description}
                            onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                            placeholder="Brief description of this template"
                            disabled={submitting}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium mb-2 block">
                          Certificate Design
                        </Label>
                        <p className="text-xs text-muted-foreground mb-4">
                          Use variables like {`{{participantName}}`}, {`{{eventTitle}}`}, {`{{startDate}}`}, {`{{endDate}}`}, {`{{organizerName}}`}, {`{{qrCode}}`} etc.
                        </p>
                        <CertificateTemplateEditor
                          value={templateForm.template_content}
                          onChange={(content) => setTemplateForm({ ...templateForm, template_content: content })}
                          logoUrl={templateForm.logo_url}
                          onLogoUpload={(logoUrl, publicId) => {
                            setTemplateForm({ 
                              ...templateForm, 
                              logo_url: logoUrl, 
                              logo_public_id: publicId 
                            });
                          }}
                          onLogoRemove={() => {
                            setTemplateForm({ 
                              ...templateForm, 
                              logo_url: "", 
                              logo_public_id: "" 
                            });
                          }}
                          height={500}
                          theme={theme}
                        />
                      </div>
                    </div>
                  </form>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleModalClose}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleSubmit}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {editingTemplate ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {editingTemplate ? 'Update Template' : 'Create Template'}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </Card>

      <Card style={{
        backgroundColor: mounted && theme === 'dark' ? '#000000' : '#ffffff',
        borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb'
      }}>
        <CardContent className="p-3 text-xs overflow-x-auto">
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <div className="rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3" style={{
                backgroundColor: mounted && theme === 'dark' ? '#1f2937' : '#f9fafb'
              }}>
                <Award className="w-8 h-8" style={{
                  color: mounted && theme === 'dark' ? '#9ca3af' : '#6b7280'
                }} />
              </div>
              <h3 className="text-xs font-medium mb-1" style={{
                color: mounted && theme === 'dark' ? '#ffffff' : '#111827'
              }}>No certificate templates yet</h3>
              <p className="text-xs mb-3" style={{
                color: mounted && theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}>Create your first certificate template for events</p>
            </div>
            ) : (
              <div className="min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Template Name</TableHead>
                      <TableHead className="min-w-[150px] hidden sm:table-cell">Description</TableHead>
                      <TableHead className="min-w-[100px] hidden md:table-cell">Created</TableHead>
                      <TableHead className="min-w-[100px] hidden lg:table-cell">Updated</TableHead>
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
                          <div className="max-w-[150px] truncate" title={template.description || 'No description'}>
                            {template.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">
                          {new Date(template.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">
                          {new Date(template.updated_at).toLocaleDateString()}
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(template)}
                                title="Edit Template"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(template)}
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