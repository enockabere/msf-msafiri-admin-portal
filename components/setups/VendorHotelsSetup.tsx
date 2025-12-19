"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { AccommodationTemplateEditor } from "@/components/ui/accommodation-template-editor";
import { LocationSelect } from "@/components/ui/location-select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Save, X, Search, Download, Printer, Edit, Trash2, ChevronLeft, ChevronRight, FileText, FileEdit } from "lucide-react";

import EditVendorModal from "@/components/accommodation/EditVendorModal";
import { Hotel } from "lucide-react";

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

  const [vendors, setVendors] = useState<VendorAccommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editVendorModalOpen, setEditVendorModalOpen] = useState(false);
  const [selectedVendorForEdit, setSelectedVendorForEdit] = useState<VendorAccommodation | null>(null);
  const [addVendorModalOpen, setAddVendorModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedVendorForTemplate, setSelectedVendorForTemplate] = useState<VendorAccommodation | null>(null);
  const [templateContent, setTemplateContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tenantData, setTenantData] = useState<{ country?: string } | null>(null);
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
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, apiClient, tenantSlug]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
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
          setTenantData({ country: tenant.country });
        }
      } catch (error) {
        console.error('Failed to fetch tenant data:', error);
      }
    };

    fetchTenantData();
  }, [apiClient, tenantSlug]);

  const canEdit = Boolean(user?.role && ["super_admin", "mt_admin", "hr_admin"].includes(user.role));

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

      if (!events || events.length === 0) {
        await Swal.fire({
          title: "No Events Found",
          text: `No events are currently using "${vendor.vendor_name}". Please assign this vendor to an event first.`,
          icon: "info",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }

      // Create options for event selection
      const eventOptions: { [key: string]: string } = {};
      events.forEach((event: any) => {
        eventOptions[event.id] = `${event.title} (${new Date(event.start_date).toLocaleDateString()})`;
      });

      const { value: selectedEventId } = await Swal.fire({
        title: "Select Event",
        text: `Choose an event to generate proof of accommodation documents for "${vendor.vendor_name}"`,
        input: "select",
        inputOptions: eventOptions,
        inputPlaceholder: "Select an event",
        showCancelButton: true,
        confirmButtonText: "Generate Proofs",
        confirmButtonColor: "#8b5cf6",
        cancelButtonColor: "#6b7280",
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

    // Fetch current template
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-accommodations/${vendor.id}`,
        {
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTemplateContent(data.accommodation_template || "");
      }
    } catch (error) {
      console.error("Error fetching template:", error);
    }

    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!selectedVendorForTemplate) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-accommodations/${selectedVendorForTemplate.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
            'X-Tenant-ID': tenantSlug
          },
          body: JSON.stringify({
            accommodation_template: templateContent,
          }),
        }
      );

      if (response.ok) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Hotel className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-600">Loading vendor hotels...</p>
        </div>
      </div>
    );
  }

  if (addButtonOnly) {
    return canEdit ? (
      <Dialog open={addVendorModalOpen} onOpenChange={setAddVendorModalOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor Hotel
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[900px] bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
          {/* Header with close button */}
          <button
            onClick={() => setAddVendorModalOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4 text-gray-500" />
            <span className="sr-only">Close</span>
          </button>

          <div className="p-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Hotel className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Add New Vendor Hotel</DialogTitle>
                <p className="text-gray-600 text-sm mt-1">Register a new accommodation partner</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddVendor} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Hotel Name */}
              <div className="space-y-2">
                <Label htmlFor="vendor_name" className="text-sm font-medium text-gray-700">
                  Hotel Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vendor_name"
                  value={vendorForm.vendor_name}
                  onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
                  required
                  placeholder="Enter hotel or accommodation name"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={submitting}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
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
                />
                <p className="text-xs text-gray-500">Start typing to search for the location</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <RichTextEditor
                  value={vendorForm.description}
                  onChange={(value) => setVendorForm({ ...vendorForm, description: value })}
                  placeholder="Describe the facilities, services, and amenities available at this accommodation..."
                  height={250}
                />
                <p className="text-xs text-gray-500">
                  Provide details about the accommodation facilities and services
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
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
    ) : null;
  }

  return (
    <>

      <Card>
        <CardContent className="p-4 text-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search vendor hotels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(filteredVendors)}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs"
              >
                <Printer className="w-3 h-3 mr-1" />
                Print
              </Button>
            </div>
          </div>

          {vendors.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Hotel className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">No vendor hotels yet</h3>
              <p className="text-xs text-gray-500 mb-4">Get started by adding your first vendor hotel partnership</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hotel Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Description</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium text-xs">{vendor.vendor_name}</TableCell>
                      <TableCell className="text-xs">{vendor.location}</TableCell>
                      <TableCell className="max-w-48 break-words whitespace-normal py-3 text-xs leading-relaxed">
                        {vendor.description ? vendor.description.replace(/<[^>]*>/g, '').replace(/&lt;[^&]*&gt;/g, '') || 'No description' : 'No description'}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDesignTemplate(vendor)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Design POA Template"
                            >
                              <FileEdit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateProof(vendor)}
                              className="text-purple-600 hover:text-purple-700"
                              title="Generate Proof of Accommodation"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditVendor(vendor)}
                              title="Edit Hotel Details"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVendor(vendor)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete Hotel"
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
                  <div className="text-xs text-gray-500">
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
                    <span className="text-xs text-gray-500">
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
      <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <DialogContent className="sm:max-w-[1000px] bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
          {/* Header */}
          <button
            onClick={() => setTemplateModalOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4 text-gray-500" />
            <span className="sr-only">Close</span>
          </button>

          <div className="p-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileEdit className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Design Proof of Accommodation Template
                </DialogTitle>
                <p className="text-gray-600 text-sm mt-1">
                  {selectedVendorForTemplate?.vendor_name}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Template Design
                </Label>
                <p className="text-xs text-gray-500 mb-4">
                  Use template variables like {`{{participantName}}`}, {`{{hotelName}}`}, {`{{checkInDate}}`}, etc.
                  This template will be used to generate personalized proof documents for participants.
                </p>
                <AccommodationTemplateEditor
                  value={templateContent}
                  onChange={setTemplateContent}
                  hotelName={selectedVendorForTemplate?.vendor_name || ""}
                  placeholder="Design the proof of accommodation document template..."
                  height={450}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTemplateModalOpen(false)}
              disabled={submitting}
              className="px-6"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveTemplate}
              disabled={submitting}
              className="px-6 bg-purple-600 hover:bg-purple-700 text-white"
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}