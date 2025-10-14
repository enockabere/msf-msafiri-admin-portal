"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LocationSelect } from "@/components/ui/location-select";
import { Plus, Loader2, Save, X } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface VendorForm {
  vendor_name: string;
  location: string;
  latitude?: string;
  longitude?: string;
  accommodation_type: string;
  single_rooms: number;
  double_rooms: number;
  description: string;
}

interface VendorManagementProps {
  canEdit: boolean;
  onVendorCreated: () => void;
  apiClient: { getToken: () => string };
  tenantSlug: string;
}

export default function VendorManagement({ 
  canEdit, 
  onVendorCreated, 
  apiClient, 
  tenantSlug 
}: VendorManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tenantData, setTenantData] = useState<{ country?: string } | null>(null);
  const [vendorForm, setVendorForm] = useState<VendorForm>({
    vendor_name: "",
    location: "",
    latitude: "",
    longitude: "",
    accommodation_type: "Hotel",
    single_rooms: 0,
    double_rooms: 0,
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

  const handleSubmit = async (e: React.FormEvent) => {
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
        onVendorCreated();
        setDialogOpen(false);
        setVendorForm({ 
          vendor_name: "",
          location: "",
          latitude: "",
          longitude: "",
          accommodation_type: "Hotel",
          single_rooms: 0,
          double_rooms: 0,
          description: "",
        });
        toast({ title: "Success", description: "Vendor hotel created successfully" });
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

  if (!canEdit) return null;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor Hotel
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border border-gray-200 shadow-lg max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Add New Vendor Hotel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor_name" className="text-sm font-medium text-gray-700">Hotel Name</Label>
            <Input
              id="vendor_name"
              value={vendorForm.vendor_name}
              onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
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
              placeholder="Search for hotel location"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accommodation_type" className="text-sm font-medium text-gray-700">Type</Label>
            <Input
              id="accommodation_type"
              value={vendorForm.accommodation_type}
              onChange={(e) => setVendorForm({ ...vendorForm, accommodation_type: e.target.value })}
              placeholder="Hotel, Lodge, etc."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="single_rooms" className="text-sm font-medium text-gray-700">Single Rooms</Label>
              <Input
                id="single_rooms"
                type="number"
                min="0"
                value={vendorForm.single_rooms || ""}
                onChange={(e) => setVendorForm({ ...vendorForm, single_rooms: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="double_rooms" className="text-sm font-medium text-gray-700">Double Rooms</Label>
              <Input
                id="double_rooms"
                type="number"
                min="0"
                value={vendorForm.double_rooms || ""}
                onChange={(e) => setVendorForm({ ...vendorForm, double_rooms: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the facilities and services available"
              value={vendorForm.description}
              onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {submitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}