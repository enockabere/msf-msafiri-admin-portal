"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { useTheme } from "next-themes";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { AccommodationTemplateEditor } from "@/components/ui/accommodation-template-editor";
import { LocationSelect } from "@/components/ui/location-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Save, X, Search, Download, Printer, Edit, Trash2, ChevronLeft, ChevronRight, FileText, FileEdit, Upload, Hotel, FileSignature, QrCode } from "lucide-react";

import EditVendorModal from "@/components/accommodation/EditVendorModal";
import { Checkbox } from "@/components/ui/checkbox";

// Add responsive styles for SweetAlert2
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .swal-responsive-popup {
      width: 90% !important;
      max-width: 500px !important;
      margin: 0 auto !important;
    }
    .swal-responsive-select {
      width: 100% !important;
      padding: 8px 12px !important;
      font-size: 14px !important;
      line-height: 1.4 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .swal-responsive-select option {
      padding: 8px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      max-width: 100% !important;
    }
    @media (max-width: 640px) {
      .swal-responsive-popup {
        width: 95% !important;
        margin: 10px auto !important;
      }
      .swal2-title {
        font-size: 18px !important;
      }
      .swal2-html-container {
        font-size: 14px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

interface VendorAccommodation {
  id: number;
  vendor_name: string;
  location: string;
  capacity: number;
  current_occupants: number;
  description: string;
}



interface VendorHotelsSetupProps {
  tenantSlug: string;
  addButtonOnly?: boolean;
  onVendorAdded?: () => void;
}

export default function VendorHotelsSetup({ tenantSlug, addButtonOnly, onVendorAdded }: VendorHotelsSetupProps) {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [vendors, setVendors] = useState<VendorAccommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editVendorModalOpen, setEditVendorModalOpen] = useState(false);
  const [selectedVendorForEdit, setSelectedVendorForEdit] = useState<VendorAccommodation | null>(null);
  const [addVendorModalOpen, setAddVendorModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedVendorForTemplate, setSelectedVendorForTemplate] = useState<VendorAccommodation | null>(null);
  const [templateContent, setTemplateContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{logo?: string, signature?: string}>({});
  const [templateId, setTemplateId] = useState<number | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [tenantData, setTenantData] = useState<{ country?: string; name?: string } | null>(null);
  const [vendorForm, setVendorForm] = useState({
    vendor_name: "",
    location: "",
    latitude: "",
    longitude: "",
    description: "",
    accommodation_template: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      const token = apiClient.getToken();
      const vendorResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-accommodations`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Tenant-ID': tenantSlug
        },
      });

      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json();
        setVendors(vendorData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [authLoading, user, apiClient, tenantSlug]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, fetchData]);

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
          {
            headers: {
              Authorization: `Bearer ${apiClient.getToken()}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const tenant = await response.json();
          setTenantData({ country: tenant.country, name: tenant.name });
        }
      } catch (error) {
        console.error('Failed to fetch tenant data:', error);
      }
    };

    fetchTenantData();
  }, [apiClient, tenantSlug]);

  const canEdit = true; // Allow all users to manage vendor hotels

  const handleEditVendor = (vendor: VendorAccommodation) => {
    setSelectedVendorForEdit(vendor);
    setEditVendorModalOpen(true);
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-accommodations`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
            'X-Tenant-ID': tenantSlug
          },
          body: JSON.stringify(vendorForm),
        }
      );

      if (response.ok) {
        await fetchData();
        setAddVendorModalOpen(false);
        setVendorForm({
          vendor_name: "",
          location: "",
          latitude: "",
          longitude: "",
          description: "",
          accommodation_template: "",
        });
        toast({ title: "Success", description: "Vendor hotel created successfully" });
        if (onVendorAdded) {
          onVendorAdded();
        }
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

  const filteredVendors = vendors.filter(vendor =>
    vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToCSV = (vendors: VendorAccommodation[]) => {
    const headers = ["Hotel Name", "Location", "Description"];
    const csvData = [
      headers.join(","),
      ...vendors.map(vendor => [
        `"${vendor.vendor_name}"`,
        `"${vendor.location}"`,
        `"${vendor.description || 'No description'}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendor-hotels.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateProof = async (vendor: VendorAccommodation) => {
    const { default: Swal } = await import("sweetalert2");

    // First, get list of events using this vendor
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events?vendor_accommodation_id=${vendor.id}`,
        {
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (!response.ok) {
        toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
        return;
      }

      const events = await response.json();
      
      // Filter out ended events (events where end_date is in the past)
      const currentDate = new Date();
      const activeEvents = events.filter((event: any) => {
        const endDate = new Date(event.end_date);
        return endDate >= currentDate;
      });

      if (!activeEvents || activeEvents.length === 0) {
        await Swal.fire({
          title: "No Active Events Found",
          text: `No active events are currently using "${vendor.vendor_name}". Please assign this vendor to an active event first.`,
          icon: "info",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }

      // Create options for event selection with better formatting
      const eventOptions: { [key: string]: string } = {};
      activeEvents.forEach((event: any) => {
        const startDate = new Date(event.start_date).toLocaleDateString();
        const endDate = new Date(event.end_date).toLocaleDateString();
        const eventTitle = event.title.length > 40 ? event.title.substring(0, 40) + '...' : event.title;
        eventOptions[event.id] = `${eventTitle} (${startDate} - ${endDate})`;
      });

      const { value: selectedEventId } = await Swal.fire({
        title: "Select Event",
        text: `Choose an active event to generate proof of accommodation documents for "${vendor.vendor_name}"`,
        input: "select",
        inputOptions: eventOptions,
        inputPlaceholder: "Select an event",
        showCancelButton: true,
        confirmButtonText: "Generate Proofs",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        customClass: {
          popup: 'swal-responsive-popup',
          select: 'swal-responsive-select'
        },
        inputValidator: (value) => {
          if (!value) {
            return "You need to select an event!";
          }
        }
      });

      if (!selectedEventId) return;

      // Show loading
      Swal.fire({
        title: "Generating Proofs...",
        text: "Please wait while we generate proof of accommodation documents",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Call API to generate proofs
      const generateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendor-hotels/${vendor.id}/events/${selectedEventId}/generate-proofs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      const result = await generateResponse.json();

      Swal.close();

      if (generateResponse.ok) {
        await Swal.fire({
          title: "Success!",
          html: `
            <div class="text-left space-y-2">
              <p><strong>Total Participants:</strong> ${result.total_participants}</p>
              <p class="text-green-600"><strong>Successfully Generated:</strong> ${result.successful}</p>
              ${result.failed > 0 ? `<p class="text-red-600"><strong>Failed:</strong> ${result.failed}</p>` : ''}
              ${result.errors ? `<p class="text-xs text-gray-500 mt-2">Check console for error details</p>` : ''}
            </div>
          `,
          icon: "success",
          confirmButtonColor: "#10b981",
        });

        if (result.errors) {
          console.error("Proof generation errors:", result.errors);
        }
      } else {
        await Swal.fire({
          title: "Error",
          text: result.detail || "Failed to generate proof documents",
          icon: "error",
          confirmButtonColor: "#dc2626",
        });
      }

    } catch (error) {
      console.error("Generate proof error:", error);
      Swal.close();
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    }
  };

  const handleDesignTemplate = async (vendor: VendorAccommodation) => {
    setSelectedVendorForTemplate(vendor);

    // Get POA template for this vendor
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/poa-templates/vendor/${vendor.id}`,
        {
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (response.ok) {
        const templateData = await response.json();
        setTemplateId(templateData.id);

        // Get template content and replace variables with image tags if images exist
        let content = templateData.template_content || "";

        // Store uploaded images
        const images: {logo?: string, signature?: string} = {
          logo: templateData.logo_url || undefined,
          signature: templateData.signature_url || undefined
        };
        setUploadedImages(images);

        // Replace logo variable with image tag if logo exists
        if (images.logo && content.includes('{{hotelLogo}}')) {
          const logoTag = `<img src="${images.logo}" alt="logo" style="max-width: 200px; height: auto; margin: 10px 0;" data-type="logo" />`;
          content = content.replace(/\{\{hotelLogo\}\}/g, logoTag);
        }

        // Replace signature variable with image tag if signature exists
        if (images.signature && content.includes('{{signature}}')) {
          const signatureTag = `<img src="${images.signature}" alt="signature" style="max-width: 200px; height: auto; margin: 10px 0;" data-type="signature" />`;
          content = content.replace(/\{\{signature\}\}/g, signatureTag);
        }

        setTemplateContent(content);
      } else if (response.status === 404) {
        // No template exists yet, start with empty template
        setTemplateId(null);
        setTemplateContent("");
        setUploadedImages({});
      } else {
        toast({ title: "Error", description: "Failed to load template", variant: "destructive" });
        setTemplateContent("");
        setUploadedImages({});
        setTemplateId(null);
      }
    } catch (error) {
      console.error("Error fetching template:", error);
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
      setTemplateContent("");
      setUploadedImages({});
      setTemplateId(null);
    }

    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!selectedVendorForTemplate) return;

    setSubmitting(true);
    try {
      // Replace image tags with variables before saving
      let contentToSave = templateContent;

      // Replace logo image with variable
      if (uploadedImages.logo) {
        contentToSave = contentToSave.replace(
          new RegExp(`<img[^>]*src="${uploadedImages.logo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g'),
          '{{hotelLogo}}'
        );
      }

      // Replace signature image with variable
      if (uploadedImages.signature) {
        contentToSave = contentToSave.replace(
          new RegExp(`<img[^>]*src="${uploadedImages.signature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g'),
          '{{signature}}'
        );
      }

      const payload = {
        vendor_accommodation_id: selectedVendorForTemplate.id,
        name: selectedVendorForTemplate.vendor_name,
        description: `POA template for ${selectedVendorForTemplate.vendor_name}`,
        template_content: contentToSave,
        logo_url: uploadedImages.logo || null,
        signature_url: uploadedImages.signature || null,
        enable_qr_code: true,
        is_active: true
      };

      let response;
      if (templateId) {
        // Update existing template
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/poa-templates/${templateId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${apiClient.getToken()}`,
              "Content-Type": "application/json",
              'X-Tenant-ID': tenantSlug
            },
            body: JSON.stringify({
              template_content: contentToSave,
              logo_url: uploadedImages.logo || null,
              signature_url: uploadedImages.signature || null,
            }),
          }
        );
      } else {
        // Create new template
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/poa-templates/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiClient.getToken()}`,
              "Content-Type": "application/json",
              'X-Tenant-ID': tenantSlug
            },
            body: JSON.stringify(payload),
          }
        );
      }

      if (response.ok) {
        const savedTemplate = await response.json();
        setTemplateId(savedTemplate.id);
        await fetchData();
        setTemplateModalOpen(false);
        toast({
          title: "Success",
          description: "Proof of Accommodation template saved successfully"
        });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
      }
    } catch (error) {
      console.error("Save template error:", error);
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVendor = async (vendor: VendorAccommodation) => {
    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Delete Vendor Hotel?",
      text: `This will permanently delete "${vendor.vendor_name}". This action cannot be undone.`,
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-accommodations/${vendor.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (response.ok) {
        await fetchData();
        toast({ title: "Success", description: "Vendor hotel deleted successfully" });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
      }
    } catch (error) {
      console.error("Delete vendor error:", error);
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    }
  };

  const handleUploadFile = async (file: File, type: 'logo' | 'signature') => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image size must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/upload-logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const imageUrl = data.url;

      // Store uploaded image URL
      setUploadedImages(prev => ({ ...prev, [type]: imageUrl }));

      // Update template content to replace variable with image tag
      const variable = type === 'logo' ? '{{hotelLogo}}' : '{{signature}}';
      const imageTag = `<img src="${imageUrl}" alt="${type}" style="max-width: 200px; height: auto; margin: 10px 0;" data-type="${type}" />`;

      // Replace the variable with the image tag in the template
      let updatedContent = templateContent;
      if (templateContent.includes(variable)) {
        updatedContent = templateContent.replace(
          new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'),
          imageTag
        );
      } else {
        // If variable doesn't exist, replace any existing image of this type
        const existingImageRegex = new RegExp(`<img[^>]*data-type="${type}"[^>]*>`, 'g');
        if (existingImageRegex.test(templateContent)) {
          updatedContent = templateContent.replace(existingImageRegex, imageTag);
        }
      }
      setTemplateContent(updatedContent);

      toast({ title: "Success", description: `${type === 'logo' ? 'Logo' : 'Signature'} uploaded successfully` });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (type: 'logo' | 'signature') => {
    const imageUrl = uploadedImages[type];

    if (imageUrl) {
      // Replace image tag with variable in template
      const variable = type === 'logo' ? '{{hotelLogo}}' : '{{signature}}';
      const updatedContent = templateContent.replace(
        new RegExp(`<img[^>]*src="${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g'),
        variable
      );
      setTemplateContent(updatedContent);
    }

    // Remove from uploaded images state
    setUploadedImages(prev => {
      const newState = { ...prev };
      delete newState[type];
      return newState;
    });

    toast({ title: "Success", description: `${type === 'logo' ? 'Logo' : 'Signature'} removed` });
  };



  if (addButtonOnly) {
    return canEdit ? (
      <Dialog open={addVendorModalOpen} onOpenChange={setAddVendorModalOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-xs">
            <Plus className="w-3 h-3 mr-2" />
            Add Vendor Hotel
          </Button>
        </DialogTrigger>
        <DialogContent 
          className="sm:max-w-[900px] max-h-[90vh] border shadow-lg scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 overflow-y-auto"
          style={{
            backgroundColor: mounted && theme === 'dark' ? '#000000' : '#ffffff',
            borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb',
            color: mounted && theme === 'dark' ? '#ffffff' : '#000000'
          }}
        >
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Hotel className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle>Add New Vendor Hotel</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Register a new accommodation partner</p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddVendor} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="vendor_name">Hotel Name <span className="text-red-600">*</span></Label>
                <Input
                  id="vendor_name"
                  value={vendorForm.vendor_name}
                  onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
                  required
                  placeholder="Enter hotel or accommodation name"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location <span className="text-red-600">*</span></Label>
                <LocationSelect
                  value={vendorForm.location}
                  country={tenantData?.country}
                  onChange={(value, placeDetails) => {
                    setVendorForm({
                      ...vendorForm,
                      location: value,
                      latitude: placeDetails?.geometry?.location?.lat()?.toString() || "",
                      longitude: placeDetails?.geometry?.location?.lng()?.toString() || ""
                    });
                  }}
                  placeholder="Search and select hotel location"
                />
                <p className="text-xs text-muted-foreground">Start typing to search for the location</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <div className="border rounded-md" style={{ borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                  <div className="flex items-center gap-1 p-2 border-b" style={{ borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb', backgroundColor: mounted && theme === 'dark' ? '#1f2937' : '#f9fafb' }}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const textarea = document.querySelector('textarea[placeholder*="Describe the facilities"]') as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = vendorForm.description.substring(start, end);
                          const newText = vendorForm.description.substring(0, start) + '**' + selectedText + '**' + vendorForm.description.substring(end);
                          setVendorForm({ ...vendorForm, description: newText });
                        }
                      }}
                      title="Bold"
                    >
                      <span className="font-bold text-sm">B</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const textarea = document.querySelector('textarea[placeholder*="Describe the facilities"]') as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = vendorForm.description.substring(start, end);
                          const newText = vendorForm.description.substring(0, start) + '*' + selectedText + '*' + vendorForm.description.substring(end);
                          setVendorForm({ ...vendorForm, description: newText });
                        }
                      }}
                      title="Italic"
                    >
                      <span className="italic text-sm">I</span>
                    </Button>
                  </div>
                  <textarea
                    value={vendorForm.description}
                    onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
                    placeholder="Describe the facilities, services, and amenities available at this accommodation..."
                    className="w-full p-3 border-0 resize-none focus:outline-none"
                    rows={4}
                    style={{
                      backgroundColor: mounted && theme === 'dark' ? '#000000' : '#ffffff',
                      color: mounted && theme === 'dark' ? '#ffffff' : '#000000'
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Provide details about the accommodation facilities and services
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddVendorModalOpen(false)}
                disabled={submitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Vendor Hotel
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    ) : null;
  }

  return (
    <>

      <Card className="w-full overflow-hidden">
        <CardContent className="p-4 text-sm overflow-x-auto">
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search vendor hotels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(filteredVendors)}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs"
              >
                <Printer className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>

          {vendors.length === 0 ? (
            <div className="text-center py-12">
              <div className={`rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <Hotel className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>No vendor hotels yet</h3>
              <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Get started by adding your first vendor hotel partnership</p>
              {canEdit && (
                <div className="flex justify-center space-x-3">
                  <Dialog open={addVendorModalOpen} onOpenChange={setAddVendorModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-xs">
                        <Plus className="w-3 h-3 mr-2" />
                        Add Vendor Hotel
                      </Button>
                    </DialogTrigger>
                    <DialogContent 
                      className="sm:max-w-[900px] max-h-[90vh] border shadow-lg scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 overflow-y-auto"
                      style={{
                        backgroundColor: mounted && theme === 'dark' ? '#000000' : '#ffffff',
                        borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb',
                        color: mounted && theme === 'dark' ? '#ffffff' : '#000000'
                      }}
                    >
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Hotel className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle>Add New Vendor Hotel</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Register a new accommodation partner</p>
              </div>
            </div>
          </DialogHeader>
                      {/* Same modal content as above */}
                      <button
                        onClick={() => setAddVendorModalOpen(false)}
                        className={`absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                      </button>

                      <div className={`p-6 pb-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Hotel className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <DialogTitle className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Add New Vendor Hotel</DialogTitle>
                            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Register a new accommodation partner</p>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleAddVendor} className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="vendor_name" className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                              Hotel Name <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              id="vendor_name"
                              value={vendorForm.vendor_name}
                              onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
                              required
                              placeholder="Enter hotel or accommodation name"
                              className={`focus:border-blue-500 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'border-gray-300'}`}
                              disabled={submitting}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="location" className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                              Location <span className="text-red-600">*</span>
                            </Label>
                            <LocationSelect
                              value={vendorForm.location}
                              country={tenantData?.country}
                              onChange={(value, placeDetails) => {
                                setVendorForm({
                                  ...vendorForm,
                                  location: value,
                                  latitude: placeDetails?.geometry?.location?.lat()?.toString() || "",
                                  longitude: placeDetails?.geometry?.location?.lng()?.toString() || ""
                                });
                              }}
                              placeholder="Search and select hotel location"
                              className={theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''}
                            />
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Start typing to search for the location</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description" className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                              Description
                            </Label>
                            <div className="border rounded-md" style={{ borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                              <div className="flex items-center gap-1 p-2 border-b" style={{ borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb', backgroundColor: mounted && theme === 'dark' ? '#1f2937' : '#f9fafb' }}>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    const textarea = document.querySelector('textarea[placeholder*="Describe the facilities"]') as HTMLTextAreaElement;
                                    if (textarea) {
                                      const start = textarea.selectionStart;
                                      const end = textarea.selectionEnd;
                                      const selectedText = vendorForm.description.substring(start, end);
                                      const newText = vendorForm.description.substring(0, start) + '**' + selectedText + '**' + vendorForm.description.substring(end);
                                      setVendorForm({ ...vendorForm, description: newText });
                                    }
                                  }}
                                  title="Bold"
                                >
                                  <span className="font-bold text-sm">B</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    const textarea = document.querySelector('textarea[placeholder*="Describe the facilities"]') as HTMLTextAreaElement;
                                    if (textarea) {
                                      const start = textarea.selectionStart;
                                      const end = textarea.selectionEnd;
                                      const selectedText = vendorForm.description.substring(start, end);
                                      const newText = vendorForm.description.substring(0, start) + '*' + selectedText + '*' + vendorForm.description.substring(end);
                                      setVendorForm({ ...vendorForm, description: newText });
                                    }
                                  }}
                                  title="Italic"
                                >
                                  <span className="italic text-sm">I</span>
                                </Button>
                              </div>
                              <textarea
                                value={vendorForm.description}
                                onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
                                placeholder="Describe the facilities, services, and amenities available at this accommodation..."
                                className="w-full p-3 border-0 resize-none focus:outline-none"
                                rows={4}
                                style={{
                                  backgroundColor: mounted && theme === 'dark' ? '#000000' : '#ffffff',
                                  color: mounted && theme === 'dark' ? '#ffffff' : '#000000'
                                }}
                              />
                            </div>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Provide details about the accommodation facilities and services
                            </p>
                          </div>
                        </div>

                        <div className={`flex justify-end space-x-3 p-6 border-t ${theme === 'dark' ? 'border-gray-700 bg-black' : 'border-gray-200 bg-gray-50'}`}>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAddVendorModalOpen(false)}
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
                                Creating...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Create Vendor Hotel
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Hotel Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Location</TableHead>
                    <TableHead className="hidden md:table-cell max-w-[200px]">Description</TableHead>
                    {canEdit && <TableHead className="text-right min-w-[140px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium text-xs">
                        <div>
                          <div>{vendor.vendor_name}</div>
                          <div className="sm:hidden text-xs text-gray-500 mt-1">{vendor.location}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs hidden sm:table-cell">{vendor.location}</TableCell>
                      <TableCell className="max-w-48 break-words whitespace-normal py-3 text-xs leading-relaxed hidden md:table-cell">
                        {vendor.description ? vendor.description.replace(/<[^>]*>/g, '').replace(/&lt;[^&]*&gt;/g, '') || 'No description' : 'No description'}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDesignTemplate(vendor)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1"
                              title="Design POA"
                            >
                              <FileEdit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateProof(vendor)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                              title="Generate POA"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditVendor(vendor)}
                              className="p-1"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVendor(vendor)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Delete"
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredVendors.length)} of {filteredVendors.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="text-xs"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Previous
                    </Button>
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="text-xs"
                    >
                      Next
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </CardContent>
      </Card>

      <EditVendorModal
        open={editVendorModalOpen}
        onOpenChange={(open) => {
          setEditVendorModalOpen(open);
          if (!open) {
            setSelectedVendorForEdit(null);
          }
        }}
        vendor={selectedVendorForEdit}
        apiClient={apiClient as { getToken: () => string }}
        tenantSlug={tenantSlug}
        onEditComplete={fetchData}
      />

      {/* POA Template Design Modal */}
      <Dialog open={templateModalOpen} onOpenChange={(open) => {
        setTemplateModalOpen(open);
        if (!open) {
          setSelectedVendorForTemplate(null);
          setUploadedImages({});
          setTemplateContent("");
          setTemplateId(null);
        }
      }}>
        <DialogContent 
          className="sm:max-w-[1000px] max-h-[90vh] border shadow-lg scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 overflow-y-auto"
          style={{
            backgroundColor: mounted && theme === 'dark' ? '#000000' : '#ffffff',
            borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb',
            color: mounted && theme === 'dark' ? '#ffffff' : '#000000'
          }}
        >
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileEdit className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <DialogTitle>Design Proof of Accommodation Template</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedVendorForTemplate?.vendor_name}
                </p>
              </div>
            </div>
          </DialogHeader>
            <div className="space-y-6">
              {/* Template Name */}
              <div>
                <Label 
                  className="text-sm font-medium mb-2 block"
                  style={{ color: mounted && theme === 'dark' ? '#d1d5db' : '#374151' }}
                >
                  Template Name
                </Label>
                <Input
                  value={selectedVendorForTemplate?.vendor_name || ""}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                  style={{
                    backgroundColor: mounted && theme === 'dark' ? '#1f2937' : '#f9fafb',
                    color: mounted && theme === 'dark' ? '#ffffff' : '#000000'
                  }}
                />
              </div>

              {/* Upload sections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Hotel Logo */}
                <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Hotel className="w-4 h-4" />
                      Hotel Logo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {uploadedImages.logo ? (
                      <div className="relative">
                        <img 
                          src={uploadedImages.logo} 
                          alt="Hotel Logo"
                          className="w-full h-24 object-contain bg-gray-50 rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('logo')}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          title="Remove logo"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="h-24 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <Hotel className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-400">Upload hotel logo</p>
                        </div>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-200 text-green-700 font-medium transition-all duration-200"
                    >
                      <Upload className="w-3 h-3 mr-2" />
                      {uploading ? 'Uploading...' : uploadedImages.logo ? 'Replace Logo' : 'Upload Logo'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Signature */}
                <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileSignature className="w-4 h-4" />
                      Signature
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {uploadedImages.signature ? (
                      <div className="relative">
                        <img 
                          src={uploadedImages.signature} 
                          alt="Signature"
                          className="w-full h-24 object-contain bg-gray-50 rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('signature')}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          title="Remove signature"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="h-24 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <FileSignature className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-400">Upload signature</p>
                        </div>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => signatureInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 text-blue-700 font-medium transition-all duration-200"
                    >
                      <Upload className="w-3 h-3 mr-2" />
                      {uploading ? 'Uploading...' : uploadedImages.signature ? 'Replace Signature' : 'Upload Signature'}
                    </Button>
                  </CardContent>
                </Card>

                {/* QR Code */}
                <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-24 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <QrCode className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">QR code will be auto-generated</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include_qr" defaultChecked />
                      <Label htmlFor="include_qr" className="text-xs">Include QR Code</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Template Editor and Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template Editor */}
                <div>
                  <Label 
                    className="text-sm font-medium mb-2 block"
                    style={{ color: mounted && theme === 'dark' ? '#d1d5db' : '#374151' }}
                  >
                    Template Design
                  </Label>
                  <p 
                    className="text-xs mb-4"
                    style={{ color: mounted && theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  >
                    Use template variables like {'{'}{'{'}{'}'}participantName{'}'}{'}'}{'}'}, {'{'}{'{'}{'}'}hotelName{'}'}{'}'}{'}'}, {'{'}{'{'}{'}'}checkInDate{'}'}{'}'}{'}'}, {'{'}{'{'}{'}'}checkOutDate{'}'}{'}'}{'}'}, {'{'}{'{'}{'}'}qrCode{'}'}{'}'}{'}'}, {'{'}{'{'}{'}'}hotelLogo{'}'}{'}'}{'}'}, {'{'}{'{'}{'}'}signature{'}'}{'}'}{'}'}, {'{'}{'{'}{'}'}tenantName{'}'}{'}'}{'}'}, etc.
                  </p>
                  <AccommodationTemplateEditor
                    value={templateContent}
                    onChange={setTemplateContent}
                    hotelName={selectedVendorForTemplate?.vendor_name || ""}
                    placeholder="Design the proof of accommodation document template..."
                    height={450}
                    theme={theme}
                  />
                </div>

                {/* Template Preview */}
                <div>
                  <Label 
                    className="text-sm font-medium mb-2 block"
                    style={{ color: mounted && theme === 'dark' ? '#d1d5db' : '#374151' }}
                  >
                    Template Preview
                  </Label>
                  <p 
                    className="text-xs mb-4"
                    style={{ color: mounted && theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  >
                    Preview how the template will look with sample data
                  </p>
                  <div 
                    key={`preview-${uploadedImages.logo}-${uploadedImages.signature}`}
                    className="border rounded-lg p-4 h-[450px] overflow-y-auto bg-white"
                    style={{
                      borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div 
                      className="prose prose-sm max-w-none text-black"
                      dangerouslySetInnerHTML={{
                        __html: templateContent
                          .replace(/\{\{participantName\}\}/g, 'John Doe')
                          .replace(/\{\{hotelName\}\}/g, selectedVendorForTemplate?.vendor_name || 'Sample Hotel')
                          .replace(/\{\{hotelAddress\}\}/g, selectedVendorForTemplate?.location || 'Sample Location')
                          .replace(/\{\{checkInDate\}\}/g, 'January 15, 2026')
                          .replace(/\{\{checkOutDate\}\}/g, 'January 20, 2026')
                          .replace(/\{\{roomType\}\}/g, 'Single')
                          .replace(/\{\{roomNumber\}\}/g, '101')
                          .replace(/\{\{eventName\}\}/g, 'Sample Conference')
                          .replace(/\{\{eventDates\}\}/g, 'January 15-20, 2026')
                          .replace(/\{\{confirmationNumber\}\}/g, 'MSF-EVENT1-PART1-A1B2')
                          .replace(/\{\{tenantName\}\}/g, tenantData?.name || 'Sample Organization')
                          .replace(/\{\{hotelLogo\}\}/g, uploadedImages.logo ? `<img src="${uploadedImages.logo}" alt="Hotel Logo" style="max-width: 200px; height: auto; margin: 10px 0;" />` : '<div style="border: 2px dashed #ccc; padding: 20px; text-align: center; color: #999; margin: 10px 0;">Hotel Logo will appear here</div>')
                          .replace(/\{\{signature\}\}/g, uploadedImages.signature ? `<img src="${uploadedImages.signature}" alt="Signature" style="max-width: 150px; height: auto; margin: 10px 0;" />` : '<div style="border: 2px dashed #ccc; padding: 20px; text-align: center; color: #999; margin: 10px 0;">Signature will appear here</div>')
                          .replace(/\{\{qrCode\}\}/g, '<div style="border: 2px dashed #ccc; padding: 20px; text-align: center; color: #999; margin: 10px 0; width: 150px; height: 150px; display: flex; align-items: center; justify-content: center;">QR Code will appear here</div>')
                      }}
                    />
                    {!templateContent && (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">Start designing your template to see the preview</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTemplateModalOpen(false)}
              disabled={submitting}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveTemplate}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Hidden file inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadFile(file, 'logo');
        }}
        className="hidden"
      />
      <input
        ref={signatureInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadFile(file, 'signature');
        }}
        className="hidden"
      />
    </>
  );
}