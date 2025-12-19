"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { AccommodationTemplateEditor } from "@/components/ui/accommodation-template-editor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationSelect } from "@/components/ui/location-select";
import { Loader2, Save, X, Hotel } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface VendorAccommodation {
  id: number;
  vendor_name: string;
  location: string;
  accommodation_type: string;
  capacity: number;
  current_occupants: number;
  latitude?: string;
  longitude?: string;
  description?: string;
  accommodation_template?: string;
}

interface EditVendorForm {
  vendor_name: string;
  location: string;
  latitude?: string;
  longitude?: string;
  description: string;
  accommodation_template: string;
}

interface EditVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: VendorAccommodation | null;
  apiClient: { getToken: () => string };
  tenantSlug: string;
  onEditComplete: () => void;
}

export default function EditVendorModal({
  open,
  onOpenChange,
  vendor,
  apiClient,
  tenantSlug,
  onEditComplete,
}: EditVendorModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [tenantData, setTenantData] = useState<{ country?: string } | null>(null);
  const [form, setForm] = useState<EditVendorForm>({
    vendor_name: "",
    location: "",
    latitude: "",
    longitude: "",
    description: "",
    accommodation_template: "",
  });

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

  useEffect(() => {
    if (vendor) {
      setForm({
        vendor_name: vendor.vendor_name,
        location: vendor.location,
        latitude: vendor.latitude || "",
        longitude: vendor.longitude || "",
        description: vendor.description || "",
        accommodation_template: vendor.accommodation_template || "",
      });
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-accommodations/${vendor.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
            'X-Tenant-ID': tenantSlug
          },
          body: JSON.stringify(form),
        }
      );

      if (response.ok) {
        onEditComplete();
        onOpenChange(false);
        toast({ title: "Success", description: "Vendor hotel updated successfully" });
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

  if (!vendor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        {/* Header with close button */}
        <button
          onClick={() => onOpenChange(false)}
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
              <DialogTitle className="text-xl font-bold text-gray-900">Edit Vendor Hotel</DialogTitle>
              <p className="text-gray-600 text-sm mt-1">Update accommodation partner details</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Hotel Name */}
            <div className="space-y-2">
              <Label htmlFor="vendor_name" className="text-sm font-medium text-gray-700">
                Hotel Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vendor_name"
                value={form.vendor_name}
                onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
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
                value={form.location}
                country={tenantData?.country}
                onChange={(value, placeDetails) => {
                  setForm({
                    ...form,
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
                value={form.description}
                onChange={(value) => setForm({ ...form, description: value })}
                placeholder="Describe the facilities, services, and amenities available at this accommodation..."
                height={250}
              />
              <p className="text-xs text-gray-500">
                Provide details about the accommodation facilities and services
              </p>
            </div>

            {/* Proof of Accommodation Template */}
            <div className="space-y-2">
              <Label htmlFor="accommodation_template" className="text-sm font-medium text-gray-700">
                Proof of Accommodation Template
              </Label>
              <AccommodationTemplateEditor
                value={form.accommodation_template}
                onChange={(value) => setForm({ ...form, accommodation_template: value })}
                hotelName={form.vendor_name}
                placeholder="Design the proof of accommodation document template..."
                height={400}
              />
              <p className="text-xs text-gray-500">
                This template will be used to generate proof of accommodation documents for participants
              </p>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Vendor Hotel
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}