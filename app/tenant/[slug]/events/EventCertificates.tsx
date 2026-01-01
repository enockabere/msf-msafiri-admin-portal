"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Award, Plus, Edit, Trash2, Eye, Loader2, Bold, Italic, List, ListOrdered } from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';


// Rich Text Editor Component
const RichTextEditor = ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return <div className="p-4 border border-gray-300 rounded-md text-gray-500 text-sm">Loading editor...</div>;
  }

  return (
    <div className="border border-gray-300 rounded-md">
      <div className="flex gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-gray-200' : ''}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-gray-200' : ''}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
      </div>
      <EditorContent 
        editor={editor} 
        className="p-3 min-h-[100px] prose prose-sm max-w-none focus-within:outline-none [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:my-1"
        placeholder={placeholder}
      />
    </div>
  );
};

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



  const fetchCertificates = useCallback(async () => {
    if (!accessToken) return;

    try {
      // Fetch certificates
      const certUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/certificates`;
      const certResponse = await fetch(
        certUrl,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-tenant-id': tenantSlug
          },
        }
      );

      let certificates = [];
      if (certResponse.ok) {
        const certData = await certResponse.json();
        certificates = Array.isArray(certData) ? certData.map(cert => ({ ...cert, type: 'certificate' })) : [];
      }

      // Fetch badges
      const badgeUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/badges`;
      const badgeResponse = await fetch(
        badgeUrl,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-tenant-id': tenantSlug
          },
        }
      );

      let badges = [];
      if (badgeResponse.ok) {
        const badgeData = await badgeResponse.json();
        badges = Array.isArray(badgeData) ? badgeData.map(badge => ({ 
          ...badge, 
          type: 'badge',
          certificate_template_id: badge.badge_template_id
        })) : [];
      }

      const combined = [...certificates, ...badges];
      setCertificates(combined);
    } catch (error) {
      setCertificates([]);
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
            'x-tenant-id': tenantSlug
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/badge-templates?tenant_context=${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-tenant-id': tenantSlug
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBadgeTemplates(Array.isArray(data) ? data : (data.templates || []));
      } else {
        setBadgeTemplates([]);
      }
    } catch (error) {
      setBadgeTemplates([]);
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
      // Use different endpoints for badges vs certificates
      const endpoint = selectedType === 'badge' ? 'badges' : 'certificates';
      const url = editingCertificate 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/${endpoint}/${editingCertificate.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/${endpoint}`;
      
      const method = editingCertificate ? "PUT" : "POST";



      // Use different field names for badges vs certificates
      const requestBody = selectedType === 'badge' ? {
        badge_template_id: parseInt(certificateForm.certificate_template_id),
        template_variables: {
          ...certificateForm.template_variables,
          // Auto-fill event data
          eventTitle: eventData?.title || '',
          eventLocation: eventData?.location || '',
          startDate: eventData?.start_date || '',
          endDate: eventData?.end_date || ''
        }
      } : {
        certificate_template_id: parseInt(certificateForm.certificate_template_id),
        template_variables: {
          ...certificateForm.template_variables,
          // Auto-fill event data
          eventTitle: eventData?.title || '',
          eventLocation: eventData?.location || '',
          startDate: eventData?.start_date || '',
          endDate: eventData?.end_date || ''
        }
      };

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          'x-tenant-id': tenantSlug
        },
        body: JSON.stringify(requestBody),
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
    } catch (error) {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (certificate: EventCertificate) => {
    setEditingCertificate(certificate);
    // Determine type based on certificate type field or badgeTagline presence
    const type = certificate.type === 'badge' || certificate.template_variables.badgeTagline ? 'badge' : 'certificate';
    setSelectedType(type);
    setCertificateForm({
      certificate_template_id: certificate.certificate_template_id.toString(),
      template_variables: certificate.template_variables
    });
    setModalOpen(true);
  };

  const handleDelete = async (certificate: EventCertificate) => {
    try {
      const endpoint = certificate.type === 'badge' ? 'badges' : 'certificates';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/${endpoint}/${certificate.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-tenant-id': tenantSlug
          },
        }
      );

      if (response.ok) {
        await fetchCertificates();
        toast({ title: "Success", description: `${certificate.type === 'badge' ? 'Badge' : 'Certificate'} deleted successfully` });
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
                        {selectedType === 'badge' ? (
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
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="organizerName" className="text-sm font-semibold text-gray-900">Organizer Name</Label>
                                <Input
                                  id="organizerName"
                                  value={certificateForm.template_variables.organizerName || ''}
                                  onChange={(e) => setCertificateForm({
                                    ...certificateForm,
                                    template_variables: { ...certificateForm.template_variables, organizerName: e.target.value }
                                  })}
                                  placeholder="e.g., John Smith"
                                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="organizerTitle" className="text-sm font-semibold text-gray-900">Organizer Title</Label>
                                <Input
                                  id="organizerTitle"
                                  value={certificateForm.template_variables.organizerTitle || ''}
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
                                  value={certificateForm.template_variables.facilitatorName || ''}
                                  onChange={(e) => setCertificateForm({
                                    ...certificateForm,
                                    template_variables: { ...certificateForm.template_variables, facilitatorName: e.target.value }
                                  })}
                                  placeholder="e.g., Jane Doe"
                                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="facilitatorTitle" className="text-sm font-semibold text-gray-900">Facilitator Title</Label>
                                <Input
                                  id="facilitatorTitle"
                                  value={certificateForm.template_variables.facilitatorTitle || ''}
                                  onChange={(e) => setCertificateForm({
                                    ...certificateForm,
                                    template_variables: { ...certificateForm.template_variables, facilitatorTitle: e.target.value }
                                  })}
                                  placeholder="e.g., Lead Trainer"
                                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="coordinatorName" className="text-sm font-semibold text-gray-900">Coordinator Name</Label>
                                <Input
                                  id="coordinatorName"
                                  value={certificateForm.template_variables.coordinatorName || ''}
                                  onChange={(e) => setCertificateForm({
                                    ...certificateForm,
                                    template_variables: { ...certificateForm.template_variables, coordinatorName: e.target.value }
                                  })}
                                  placeholder="e.g., Sarah Johnson"
                                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="coordinatorTitle" className="text-sm font-semibold text-gray-900">Coordinator Title</Label>
                                <Input
                                  id="coordinatorTitle"
                                  value={certificateForm.template_variables.coordinatorTitle || ''}
                                  onChange={(e) => setCertificateForm({
                                    ...certificateForm,
                                    template_variables: { ...certificateForm.template_variables, coordinatorTitle: e.target.value }
                                  })}
                                  placeholder="e.g., Event Coordinator"
                                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="certificateDate" className="text-sm font-semibold text-gray-900">Certificate Date</Label>
                              <Input
                                id="certificateDate"
                                type="date"
                                value={certificateForm.template_variables.certificateDate || ''}
                                onChange={(e) => setCertificateForm({
                                  ...certificateForm,
                                  template_variables: { ...certificateForm.template_variables, certificateDate: e.target.value }
                                })}
                                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="courseDescription" className="text-sm font-semibold text-gray-900">Course Description</Label>
                              <RichTextEditor
                                value={certificateForm.template_variables.courseDescription || ''}
                                onChange={(value) => setCertificateForm({
                                  ...certificateForm,
                                  template_variables: { ...certificateForm.template_variables, courseDescription: value }
                                })}
                                placeholder="Brief description of the course..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="courseObjectives" className="text-sm font-semibold text-gray-900">Course Objectives</Label>
                              <RichTextEditor
                                value={certificateForm.template_variables.courseObjectives || ''}
                                onChange={(value) => setCertificateForm({
                                  ...certificateForm,
                                  template_variables: { ...certificateForm.template_variables, courseObjectives: value }
                                })}
                                placeholder="List the key learning objectives..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="courseContents" className="text-sm font-semibold text-gray-900">Course Contents</Label>
                              <RichTextEditor
                                value={certificateForm.template_variables.courseContents || ''}
                                onChange={(value) => setCertificateForm({
                                  ...certificateForm,
                                  template_variables: { ...certificateForm.template_variables, courseContents: value }
                                })}
                                placeholder="List the topics covered..."
                              />
                            </div>
                          </>
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
            // Determine if this is a badge or certificate
            const isBadge = certificate.type === 'badge' || certificate.template_variables?.badgeTagline;
            // Find template from appropriate array
            const template = isBadge
              ? badgeTemplates.find(t => t.id === certificate.certificate_template_id)
              : templates.find(t => t.id === certificate.certificate_template_id);

            return (
              <Card key={`${certificate.type || 'cert'}-${certificate.id}`}>
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