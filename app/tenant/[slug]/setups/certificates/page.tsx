"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    template_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate</title>
</head>
<body>
<!-- Page 1: Certificate -->
<div style="text-align: center; font-family: 'Times New Roman', serif; padding: 40px; border: 3px solid #d32f2f; margin: 20px;">
  <!-- Logo placeholder - will be replaced by actual logo -->
  <div style="text-align: center; margin-bottom: 20px;">
    {{logo}}
  </div>

  <h1 style="font-size: 22px; font-weight: bold; margin-bottom: 15px; color: #000;">TRAINING ATTENDANCE CERTIFICATE</h1>

  <p style="font-size: 12px; margin: 20px 0;">This certificate attests to the fact that</p>

  <h2 style="font-size: 18px; font-weight: bold; margin: 20px 0; border-bottom: 2px dotted #000; display: inline-block; padding-bottom: 2px;">{{participantName}}</h2>

  <p style="font-size: 12px; margin: 15px 0;">has participated in and completed the</p>

  <h3 style="font-size: 16px; font-weight: bold; margin: 20px 0; color: #d32f2f; text-decoration: underline;">{{eventTitle}}</h3>

  <p style="font-size: 11px; margin: 15px 0;">From {{startDate}} until {{endDate}},<br/>
  Organized by Médecins Sans Frontières OCA</p>

  <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: left;">
    <div style="width: 30%;">
      <div style="margin-bottom: 5px; height: 40px;"></div>
      <p style="font-size: 11px; font-weight: bold;">{{organizerName}}</p>
      <p style="font-size: 10px;">{{organizerTitle}}</p>
    </div>

    <div style="width: 30%;">
      <div style="margin-bottom: 5px; height: 40px;"></div>
      <p style="font-size: 11px; font-weight: bold;">{{facilitatorName}}</p>
      <p style="font-size: 10px;">{{facilitatorTitle}}</p>
    </div>

    <div style="width: 30%;">
      <div style="margin-bottom: 5px; height: 40px;"></div>
      <p style="font-size: 11px; font-weight: bold;">{{coordinatorName}}</p>
      <p style="font-size: 10px;">{{coordinatorTitle}}</p>
    </div>
  </div>
</div>

<!-- Page break -->
<div style="page-break-before: always;"></div>

<!-- Page 2: Course Details with Watermark -->
<div style="position: relative; font-family: 'Times New Roman', serif; padding: 40px; border: 3px solid #d32f2f; margin: 20px; min-height: 600px;">
  <!-- Watermark logo in background -->
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.08; z-index: 0; pointer-events: none;">
    {{logoWatermark}}
  </div>

  <div style="position: relative; z-index: 1; text-align: left;">
    <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #d32f2f; text-align: center; text-decoration: underline;">{{eventTitle}}</h2>

    <div style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #000;">ABOUT</h3>
      <p style="font-size: 11px; line-height: 1.6; color: #333;">{{courseDescription}}</p>
    </div>

    <div style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #000;">COURSE OBJECTIVES</h3>
      <ul style="font-size: 11px; line-height: 1.6; color: #333; padding-left: 20px;">
        {{#each courseObjectives}}
        <li style="margin-bottom: 4px;">{{this}}</li>
        {{/each}}
      </ul>
    </div>

    <div style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #000;">KEY COURSE CONTENTS</h3>
      <ul style="font-size: 11px; line-height: 1.6; color: #333; padding-left: 20px;">
        {{#each courseContents}}
        <li style="margin-bottom: 4px;">{{this}}</li>
        {{/each}}
      </ul>
    </div>

    <div style="margin-top: 40px; text-align: center;">
      <p style="font-size: 11px; color: #666;">Certificate issued on {{certificateDate}}</p>
      <p style="font-size: 11px; color: #666;">Location: {{eventLocation}}</p>
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/certificate-templates`, {
        headers: { 
          Authorization: `Bearer ${apiClient.getToken()}`,
          'X-Tenant-ID': tenantSlug
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
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
      const url = editingTemplate 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/certificate-templates/${editingTemplate.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/certificate-templates`;
      
      const method = editingTemplate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
          "Content-Type": "application/json",
          'X-Tenant-ID': tenantSlug
        },
        body: JSON.stringify(templateForm),
      });

      if (response.ok) {
        await fetchTemplates();
        setModalOpen(false);
        resetForm();
        toast({ 
          title: "Success", 
          description: `Certificate template ${editingTemplate ? 'updated' : 'created'} successfully` 
        });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      template_content: template.template_content,
      logo_url: template.logo_url || "",
      logo_public_id: template.logo_public_id || "",
    });
    setModalOpen(true);
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/certificate-templates/${template.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (response.ok) {
        await fetchTemplates();
        toast({ title: "Success", description: "Certificate template deleted successfully" });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
      }
    } catch (error) {
      console.error("Delete template error:", error);
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
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
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Award className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-600">Loading certificate templates...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Certificate Templates</h1>
              <p className="text-sm text-gray-600">Design certificate templates for events and training programs</p>
            </div>
            {canEdit && (
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300">
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
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-bold text-gray-900">
                          {editingTemplate ? 'Edit Certificate Template' : 'Create Certificate Template'}
                        </DialogTitle>
                        <p className="text-gray-600 text-sm mt-1">
                          Design a reusable certificate template for events
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Template Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={templateForm.name}
                            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                            required
                            placeholder="e.g., HATT Certificate"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            disabled={submitting}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                            Description
                          </Label>
                          <Input
                            id="description"
                            value={templateForm.description}
                            onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                            placeholder="Brief description of this template"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            disabled={submitting}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Certificate Design
                        </Label>
                        <p className="text-xs text-gray-500 mb-4">
                          Use variables like {`{{participantName}}`}, {`{{eventTitle}}`}, {`{{startDate}}`}, {`{{endDate}}`}, {`{{organizerName}}`}, etc.
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
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleModalClose}
                        disabled={submitting}
                        className="px-6"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="px-6 bg-red-600 hover:bg-red-700 text-white"
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
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-4 text-sm">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">No certificate templates yet</h3>
                <p className="text-xs text-gray-500 mb-4">Create your first certificate template for events</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium text-xs">{template.name}</TableCell>
                      <TableCell className="text-xs">{template.description || 'No description'}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(template.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(template.updated_at).toLocaleDateString()}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(template)}
                              title="Edit Template"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(template)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete Template"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
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