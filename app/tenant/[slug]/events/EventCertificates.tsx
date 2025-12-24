"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Award, Plus, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import CKEditor with SSR disabled
const CKEditor = dynamic(() => import("@ckeditor/ckeditor5-react").then(mod => ({ default: mod.CKEditor })), { ssr: false });

interface CertificateTemplate {
  id: number;
  name: string;
  description: string;
  template_content: string;
  logo_url?: string;
  created_at: string;
}

interface EventCertificate {
  id: number;
  certificate_template_id: number;
  template_variables: Record<string, any>;
  created_at: string;
}

interface EventCertificatesProps {
  eventId: number;
  tenantSlug: string;
  eventHasEnded: boolean;
  eventData?: {
    title: string;
    start_date: string;
    end_date: string;
    location: string;
  };
}

export default function EventCertificates({ eventId, tenantSlug, eventHasEnded, eventData }: EventCertificatesProps) {
  const { accessToken } = useAuth();
  const [certificates, setCertificates] = useState<EventCertificate[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [badgeTemplates, setBadgeTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false)
  const [typeSelectionOpen, setTypeSelectionOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<'certificate' | 'badge' | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<EventCertificate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const editorRef = useRef<any>(null);
  const contentsEditorRef = useRef<any>(null);
  const [certificateForm, setCertificateForm] = useState({
    certificate_template_id: "",
    template_variables: {
      eventTitle: "",
      startDate: "",
      endDate: "",
      organizerName: "",
      organizerTitle: "",
      facilitatorName: "",
      facilitatorTitle: "",
      coordinatorName: "",
      coordinatorTitle: "",
      eventLocation: "",
      certificateDate: "",
      courseDescription: "",
      courseObjectives: "",
      courseContents: "",
      badgeTagline: ""
    }
  });

  // Load CKEditor on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@ckeditor/ckeditor5-build-classic')
        .then((module) => {
          editorRef.current = module.default;
          contentsEditorRef.current = module.default;
          setEditorLoaded(true);
        })
        .catch((error) => {
          console.error('Error loading CKEditor:', error);
        });
    }
  }, []);

  const fetchCertificates = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/certificates`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCertificates(Array.isArray(data) ? data : []);
      } else {
        setCertificates([]);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  }, [eventId, accessToken, tenantSlug]);

  const fetchTemplates = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/certificate-templates?tenant_context=${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTemplates(Array.isArray(data) ? data : (data.templates || []));
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  }, [accessToken, tenantSlug]);

  const fetchBadgeTemplates = useCallback(async () => {
    if (!accessToken) return;

    try {
      console.log('🔍 [DEBUG] Fetching badge templates for tenant:', tenantSlug);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/badge-templates?tenant_context=${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      console.log('🔍 [DEBUG] Badge templates response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Badge templates data:', data);
        setBadgeTemplates(Array.isArray(data) ? data : (data.templates || []));
      } else {
        console.log('🔍 [DEBUG] Badge templates API failed:', response.status, response.statusText);
        setBadgeTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching badge templates:", error);
    }
  }, [accessToken, tenantSlug]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCertificates(), fetchTemplates(), fetchBadgeTemplates()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCertificates, fetchTemplates, fetchBadgeTemplates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingCertificate 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/certificates/${editingCertificate.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/certificates`;
      
      const method = editingCertificate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          'X-Tenant-ID': tenantSlug
        },
        body: JSON.stringify({
          certificate_template_id: parseInt(certificateForm.certificate_template_id),
          template_variables: {
            ...certificateForm.template_variables,
            // Auto-fill event data
            eventTitle: eventData?.title || '',
            eventLocation: eventData?.location || '',
            startDate: eventData?.start_date || '',
            endDate: eventData?.end_date || ''
          }
        }),
      });

      if (response.ok) {
        await fetchCertificates();
        setModalOpen(false);
        resetForm();
        toast({ 
          title: "Success", 
          description: `${selectedType === 'certificate' ? 'Certificate' : 'Badge'} ${editingCertificate ? 'updated' : 'created'} successfully. All participants have been assigned ${selectedType === 'certificate' ? 'certificates' : 'badges'}.` 
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

  const handleEdit = (certificate: EventCertificate) => {
    setEditingCertificate(certificate);
    // Determine type based on whether badgeTagline exists
    const type = certificate.template_variables.badgeTagline ? 'badge' : 'certificate';
    setSelectedType(type);
    setCertificateForm({
      certificate_template_id: certificate.certificate_template_id.toString(),
      template_variables: certificate.template_variables
    });
    setModalOpen(true);
  };

  const handleDelete = async (certificate: EventCertificate) => {
    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Delete Certificate/Badge?",
      text: "This will remove certificates/badges from all participants. This action cannot be undone.",
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/certificates/${certificate.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (response.ok) {
        await fetchCertificates();
        toast({ title: "Success", description: "Certificate/Badge deleted successfully" });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
      }
    } catch (error) {
      console.error("Delete certificate error:", error);
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setCertificateForm({
      certificate_template_id: "",
      template_variables: {
        eventTitle: "",
        startDate: "",
        endDate: "",
        organizerName: "",
        organizerTitle: "",
        facilitatorName: "",
        facilitatorTitle: "",
        coordinatorName: "",
        coordinatorTitle: "",
        eventLocation: "",
        certificateDate: "",
        courseDescription: "",
        courseObjectives: "",
        courseContents: "",
        badgeTagline: ""
      }
    });
    setEditingCertificate(null);
    setSelectedType(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedType(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-sm font-medium text-gray-600">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Certificates & Badges</h2>
          <p className="text-sm text-gray-600">Manage certificates for event participants</p>
        </div>
        {!eventHasEnded && (
          <>
            <Dialog open={typeSelectionOpen} onOpenChange={setTypeSelectionOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Certificate and Badge
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-xl">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-lg font-semibold text-gray-900">Choose Type</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">What would you like to add?</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => {
                        setSelectedType('certificate')
                        setTypeSelectionOpen(false)
                        setModalOpen(true)
                      }}
                      className="h-20 flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                      variant="outline"
                    >
                      <Award className="w-8 h-8 mb-2" />
                      Certificate
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedType('badge')
                        setTypeSelectionOpen(false)
                        setModalOpen(true)
                      }}
                      className="h-20 flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                      variant="outline"
                    >
                      <Award className="w-8 h-8 mb-2" />
                      Badge
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogContent className="sm:max-w-[95vw] max-h-[95vh] overflow-hidden bg-white border-0 shadow-2xl p-0 flex flex-col z-50">
              <DialogHeader className="px-6 py-5 border-b border-gray-200 bg-gradient-to-br from-red-50 to-orange-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                      {editingCertificate ? `Edit ${selectedType === 'certificate' ? 'Certificate' : 'Badge'}` : `Add ${selectedType === 'certificate' ? 'Certificate' : 'Badge'}`}
                    </DialogTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure {selectedType} template and variables for event participants.
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-6">
                {selectedType && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">Step 1: Select {selectedType === 'certificate' ? 'Certificate' : 'Badge'} Design</h3>
                    <div className="space-y-2">
                      <Label htmlFor="template" className="text-sm font-semibold text-gray-900">{selectedType === 'certificate' ? 'Certificate' : 'Badge'} Template <span className="text-red-500">*</span></Label>
                      <Select
                        value={certificateForm.certificate_template_id}
                        onValueChange={(value) => setCertificateForm({ ...certificateForm, certificate_template_id: value })}
                        required
                      >
                        <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                          <SelectValue placeholder={`Choose a ${selectedType} design from setups`} />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          {(selectedType === 'certificate' ? templates : badgeTemplates)
                            .filter(template => template && template.id)
                            .map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()} className="hover:bg-red-50">
                              <div className="flex flex-col">
                                <span className="font-medium">{template.name}</span>
                                <span className="text-xs text-gray-500">{template.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {certificateForm.certificate_template_id && (
                        <p className="text-xs text-blue-700 mt-1">
                          ✓ Template selected. Configure the variables below.
                        </p>
                      )}
                    </div>
                  </div>

                  {certificateForm.certificate_template_id && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-green-900 mb-3">Step 2: Configure Template Variables</h3>
                      
                      {eventData && (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">Event Information (Auto-filled)</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Title:</span>
                              <span className="ml-2 font-medium">{eventData.title}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Location:</span>
                              <span className="ml-2 font-medium">{eventData.location}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Start:</span>
                              <span className="ml-2 font-medium">{new Date(eventData.start_date).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">End:</span>
                              <span className="ml-2 font-medium">{new Date(eventData.end_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="organizerName" className="text-sm font-semibold text-gray-900">Organizer Name</Label>
                            <Input
                              id="organizerName"
                              value={certificateForm.template_variables.organizerName}
                              onChange={(e) => setCertificateForm({
                                ...certificateForm,
                                template_variables: { ...certificateForm.template_variables, organizerName: e.target.value }
                              })}
                              placeholder="e.g., John Doe"
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="organizerTitle" className="text-sm font-semibold text-gray-900">Organizer Title</Label>
                            <Input
                              id="organizerTitle"
                              value={certificateForm.template_variables.organizerTitle}
                              onChange={(e) => setCertificateForm({
                                ...certificateForm,
                                template_variables: { ...certificateForm.template_variables, organizerTitle: e.target.value }
                              })}
                              placeholder="e.g., Training Coordinator"
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="facilitatorName" className="text-sm font-semibold text-gray-900">Facilitator Name</Label>
                            <Input
                              id="facilitatorName"
                              value={certificateForm.template_variables.facilitatorName}
                              onChange={(e) => setCertificateForm({
                                ...certificateForm,
                                template_variables: { ...certificateForm.template_variables, facilitatorName: e.target.value }
                              })}
                              placeholder="e.g., Jane Smith"
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="facilitatorTitle" className="text-sm font-semibold text-gray-900">Facilitator Title</Label>
                            <Input
                              id="facilitatorTitle"
                              value={certificateForm.template_variables.facilitatorTitle}
                              onChange={(e) => setCertificateForm({
                                ...certificateForm,
                                template_variables: { ...certificateForm.template_variables, facilitatorTitle: e.target.value }
                              })}
                              placeholder="e.g., Senior Trainer"
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="coordinatorName" className="text-sm font-semibold text-gray-900">Coordinator Name</Label>
                            <Input
                              id="coordinatorName"
                              value={certificateForm.template_variables.coordinatorName}
                              onChange={(e) => setCertificateForm({
                                ...certificateForm,
                                template_variables: { ...certificateForm.template_variables, coordinatorName: e.target.value }
                              })}
                              placeholder="e.g., Mike Johnson"
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="coordinatorTitle" className="text-sm font-semibold text-gray-900">Coordinator Title</Label>
                            <Input
                              id="coordinatorTitle"
                              value={certificateForm.template_variables.coordinatorTitle}
                              onChange={(e) => setCertificateForm({
                                ...certificateForm,
                                template_variables: { ...certificateForm.template_variables, coordinatorTitle: e.target.value }
                              })}
                              placeholder="e.g., Program Coordinator"
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="certificateDate" className="text-sm font-semibold text-gray-900">Certificate Issue Date</Label>
                          <Input
                            id="certificateDate"
                            type="date"
                            value={certificateForm.template_variables.certificateDate}
                            onChange={(e) => setCertificateForm({
                              ...certificateForm,
                              template_variables: { ...certificateForm.template_variables, certificateDate: e.target.value }
                            })}
                            className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-900 mb-2 block">Course Description</Label>
                          <div className="border border-gray-300 rounded-lg overflow-hidden [&_.ck-editor__editable]:min-h-[120px] [&_.ck-editor__editable]:p-4 [&_.ck-editor__top]:bg-gray-50 [&_.ck-editor__top]:border-b [&_.ck-editor__top]:border-gray-300 [&_.ck.ck-toolbar]:border-none [&_.ck-editor__editable]:focus:border-green-500 [&_.ck-editor__editable]:focus:ring-1 [&_.ck-editor__editable]:focus:ring-green-500">
                            {editorLoaded && editorRef.current ? (
                              <CKEditor
                                key="course-description"
                                editor={editorRef.current}
                                data={certificateForm.template_variables.courseDescription}
                                onChange={(event: any, editor: any) => {
                                  const data = editor.getData();
                                  setCertificateForm({
                                    ...certificateForm,
                                    template_variables: { ...certificateForm.template_variables, courseDescription: data }
                                  });
                                }}
                                config={{
                                  placeholder: "Brief description of the course...",
                                  toolbar: [
                                    'heading', '|',
                                    'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
                                    'outdent', 'indent', '|',
                                    'blockQuote', 'undo', 'redo'
                                  ]
                                }}
                              />
                            ) : (
                              <div className="min-h-[120px] flex items-center justify-center text-gray-400">
                                Loading editor...
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-900 mb-2 block">Course Objectives</Label>
                          <div className="border border-gray-300 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-300 p-3">
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => document.execCommand('bold')}
                                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 font-semibold"
                                >
                                  B
                                </button>
                                <button
                                  type="button"
                                  onClick={() => document.execCommand('italic')}
                                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 italic"
                                >
                                  I
                                </button>
                                <button
                                  type="button"
                                  onClick={() => document.execCommand('insertUnorderedList')}
                                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
                                >
                                  • List
                                </button>
                                <button
                                  type="button"
                                  onClick={() => document.execCommand('insertOrderedList')}
                                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
                                >
                                  1. List
                                </button>
                              </div>
                            </div>
                            <div
                              contentEditable
                              className="p-4 min-h-[120px] focus:outline-none focus:ring-1 focus:ring-green-500"
                              dangerouslySetInnerHTML={{ __html: certificateForm.template_variables.courseObjectives }}
                              onInput={(e) => setCertificateForm({
                                ...certificateForm,
                                template_variables: { ...certificateForm.template_variables, courseObjectives: e.currentTarget.innerHTML }
                              })}
                              onBlur={(e) => setCertificateForm({
                                ...certificateForm,
                                template_variables: { ...certificateForm.template_variables, courseObjectives: e.currentTarget.innerHTML }
                              })}
                            />
                          </div>
                        </div>

                        {selectedType === 'certificate' ? (
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900 mb-2 block">Course Contents</Label>
                          <div className="border border-gray-300 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => document.execCommand('formatBlock', false, 'h3')}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 bg-white"
                                  title="Heading"
                                >
                                  H
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => document.execCommand('bold')}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 bg-white font-bold"
                                  title="Bold"
                                >
                                  B
                                </button>
                                <button
                                  type="button"
                                  onClick={() => document.execCommand('italic')}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 bg-white italic"
                                  title="Italic"
                                >
                                  I
                                </button>
                                <button
                                  type="button"
                                  onClick={() => document.execCommand('createLink', false, prompt('Enter URL:') || '')}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 bg-white"
                                  title="Link"
                                >
                                  🔗
                                </button>
                                <button
                                  type="button"
                                  onClick={() => document.execCommand('insertUnorderedList')}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 bg-white"
                                  title="Bullet List"
                                >
                                  • List
                                </button>
                                <button
                                  type="button"
                                  onClick={() => document.execCommand('insertOrderedList')}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 bg-white"
                                  title="Numbered List"
                                >
                                  1. List
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => document.execCommand('outdent')}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 bg-white"
                                  title="Decrease Indent"
                                >
                                  ⬅
                                </button>
                                <button
                                  type="button"
                                  onClick={() => document.execCommand('indent')}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 bg-white"
                                  title="Increase Indent"
                                >
                                  ➡
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => document.execCommand('formatBlock', false, 'blockquote')}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 bg-white"
                                  title="Block Quote"
                                >
                                  "
                                </button>
                              </div>
                            </div>
                            <div
                              contentEditable
                              className="p-4 min-h-[120px] focus:outline-none focus:ring-1 focus:ring-green-500"
                              dangerouslySetInnerHTML={{ __html: certificateForm.template_variables.courseContents }}
                              onInput={(e) => setCertificateForm({
                                ...certificateForm,
                                template_variables: { ...certificateForm.template_variables, courseContents: e.currentTarget.innerHTML }
                              })}
                              onBlur={(e) => setCertificateForm({
                                ...certificateForm,
                                template_variables: { ...certificateForm.template_variables, courseContents: e.currentTarget.innerHTML }
                              })}
                              style={{ minHeight: '120px' }}
                            />
                          </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="badgeTagline" className="text-sm font-semibold text-gray-900">Badge Tagline</Label>
                            <Input
                              id="badgeTagline"
                              value={certificateForm.template_variables.badgeTagline || ''}
                              onChange={(e) => setCertificateForm({
                                ...certificateForm,
                                template_variables: { ...certificateForm.template_variables, badgeTagline: e.target.value }
                              })}
                              placeholder="e.g., Excellence in Training"
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </form>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="flex gap-3 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleModalClose}
                    disabled={submitting}
                    className="flex-1 sm:flex-none border-gray-300 hover:bg-gray-100 text-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {editingCertificate ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4 mr-2" />
                        {editingCertificate ? `Update ${selectedType === 'certificate' ? 'Certificate' : 'Badge'}` : `Create ${selectedType === 'certificate' ? 'Certificate' : 'Badge'}`}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates yet</h3>
            <p className="text-sm text-gray-500 mb-4">Create certificates for event participants</p>
            {!eventHasEnded && (
              <Button
                onClick={() => setTypeSelectionOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
              >
                <Plus className="w-4 h-4 mr-2 text-white" />
                Add Certificate and Badge
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certificates.map((certificate) => {
            const template = templates.find(t => t.id === certificate.certificate_template_id);
            return (
              <Card key={certificate.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="w-5 h-5 text-red-600" />
                      {template?.name || 'Unknown Template'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {new Date(certificate.created_at).toLocaleDateString()}
                      </Badge>
                      {!eventHasEnded && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(certificate)}
                            title="Edit Certificate"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(certificate)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete Certificate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Event:</span>
                      <p className="text-gray-900">{certificate.template_variables.eventTitle || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Location:</span>
                      <p className="text-gray-900">{certificate.template_variables.eventLocation || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Organizer:</span>
                      <p className="text-gray-900">{certificate.template_variables.organizerName || 'Not set'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}