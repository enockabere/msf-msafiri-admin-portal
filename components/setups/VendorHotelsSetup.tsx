"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { toast } from "@/components/ui/toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationSelect } from "@/components/ui/location-select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Save, X, Search, Download, Printer, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

import EditVendorModal from "@/components/accommodation/EditVendorModal";
import { Hotel } from "lucide-react";

interface VendorAccommodation {
  id: number;
  vendor_name: string;
  location: string;
  accommodation_type: string;
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
  const [submitting, setSubmitting] = useState(false);
  const [tenantData, setTenantData] = useState<{ country?: string } | null>(null);
  const [vendorForm, setVendorForm] = useState({
    vendor_name: "",
    location: "",
    latitude: "",
    longitude: "",
    accommodation_type: "Hotel",
    description: "",
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
          accommodation_type: "Hotel",
          description: "",
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
    vendor.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.accommodation_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToCSV = (vendors: VendorAccommodation[]) => {
    const headers = ["Hotel Name", "Location", "Type", "Description"];
    const csvData = [
      headers.join(","),
      ...vendors.map(vendor => [
        `"${vendor.vendor_name}"`,
        `"${vendor.location}"`,
        `"${vendor.accommodation_type}"`,
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
        <DialogContent className="bg-white border-0 shadow-2xl max-w-3xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Hotel className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Add New Vendor Hotel</DialogTitle>
                <p className="text-red-100 text-sm mt-1">Register a new accommodation partner</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddVendor} className="flex-1 overflow-y-auto modal-scrollbar">
            <div className="p-6 pb-0">
              {/* Two-column grid layout for better space utilization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hotel Name */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="vendor_name" className="text-sm font-semibold text-gray-900 flex items-center">
                    <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                    Hotel Name
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="vendor_name"
                      value={vendorForm.vendor_name}
                      onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
                      required
                      placeholder="Enter hotel or accommodation name"
                      className="pl-4 pr-4 py-3 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location" className="text-sm font-semibold text-gray-900 flex items-center">
                    <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                    Location
                    <span className="text-red-500 ml-1">*</span>
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
                  <p className="text-xs text-gray-500 mt-1 ml-1">Start typing to search for the location</p>
                </div>

                {/* Accommodation Type */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="accommodation_type" className="text-sm font-semibold text-gray-900 flex items-center">
                    <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                    Accommodation Type
                  </Label>
                  <div className="relative">
                    <Input
                      id="accommodation_type"
                      value={vendorForm.accommodation_type}
                      onChange={(e) => setVendorForm({ ...vendorForm, accommodation_type: e.target.value })}
                      placeholder="Hotel, Lodge, Guest House, Resort, etc."
                      className="pl-4 pr-4 py-3 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-900 flex items-center">
                    <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the facilities, services, and amenities available at this accommodation..."
                    value={vendorForm.description}
                    onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
                    className="min-h-[100px] text-sm border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1 ml-1">
                    {vendorForm.description.length} / 500 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons - Sticky at bottom */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddVendorModalOpen(false)}
                className="px-6 py-2.5 text-sm font-medium hover:bg-white transition-all"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium text-xs">{vendor.vendor_name}</TableCell>
                      <TableCell className="text-xs">{vendor.location}</TableCell>
                      <TableCell className="text-xs">{vendor.accommodation_type}</TableCell>
                      <TableCell className="max-w-48 break-words whitespace-normal py-3 text-xs leading-relaxed">{vendor.description || 'No description'}</TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditVendor(vendor)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVendor(vendor)}
                              className="text-red-600 hover:text-red-700"
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
    </>
  );
}