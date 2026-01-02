"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<EditVendorForm>({
    vendor_name: "",
    location: "",
    latitude: "",
    longitude: "",
    description: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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
              <DialogTitle>Edit Vendor Hotel</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Update accommodation partner details</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vendor_name">Hotel Name <span className="text-red-600">*</span></Label>
              <Input
                id="vendor_name"
                value={form.vendor_name}
                onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                required
                placeholder="Enter hotel or accommodation name"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location <span className="text-red-600">*</span></Label>
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
                        const selectedText = form.description.substring(start, end);
                        const newText = form.description.substring(0, start) + '**' + selectedText + '**' + form.description.substring(end);
                        setForm({ ...form, description: newText });
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
                        const selectedText = form.description.substring(start, end);
                        const newText = form.description.substring(0, start) + '*' + selectedText + '*' + form.description.substring(end);
                        setForm({ ...form, description: newText });
                      }
                    }}
                    title="Italic"
                  >
                    <span className="italic text-sm">I</span>
                  </Button>
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              onClick={() => onOpenChange(false)}
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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Vendor Hotel
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}