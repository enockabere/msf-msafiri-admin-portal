"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationSelect } from "@/components/ui/location-select";
import { Loader2, Save, X, Hotel } from "lucide-react";
import { toast } from "@/components/ui/toast";

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
}

interface EditVendorForm {
  vendor_name: string;
  location: string;
  latitude?: string;
  longitude?: string;
  accommodation_type: string;
  capacity: number;
  description: string;
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
    accommodation_type: "",
    capacity: 0,
    description: "",
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
        accommodation_type: vendor.accommodation_type,
        capacity: vendor.capacity,
        description: vendor.description || "",
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
      <DialogContent className="bg-white border border-gray-200 shadow-lg max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Hotel className="w-5 h-5 text-blue-600" />
            Edit Vendor Hotel
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor_name" className="text-sm font-medium text-gray-700">Hotel Name</Label>
            <Input
              id="vendor_name"
              value={form.vendor_name}
              onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
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
              placeholder="Search for hotel location"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accommodation_type" className="text-sm font-medium text-gray-700">Type</Label>
            <Input
              id="accommodation_type"
              value={form.accommodation_type}
              onChange={(e) => setForm({ ...form, accommodation_type: e.target.value })}
              placeholder="Hotel, Lodge, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity" className="text-sm font-medium text-gray-700">General Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min="0"
              value={form.capacity || ""}
              onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the facilities and services available"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {submitting ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}