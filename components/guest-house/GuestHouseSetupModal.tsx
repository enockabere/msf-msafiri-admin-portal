"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { LocationSelect } from "@/components/ui/location-select";
import { toast } from "@/hooks/use-toast";
import { MapPin, Clock, X, Save, Loader2, Home } from "lucide-react";

interface GuestHouse {
  id: number;
  name: string;
  location: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  facilities?: Record<string, any>;
  house_rules?: string;
  check_in_time?: string;
  check_out_time?: string;
  is_active: boolean;
  tenant_id: string;
  created_by: string;
  created_at: string;
  rooms: any[];
}

interface GuestHouseSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingGuestHouse?: GuestHouse | null;
  apiClient: { getToken: () => string };
  tenantSlug: string;
}

const commonFacilities = [
  { key: "wifi", label: "WiFi" },
  { key: "kitchen", label: "Kitchen" },
  { key: "parking", label: "Parking" },
  { key: "laundry", label: "Laundry" },
  { key: "security", label: "24/7 Security" },
  { key: "generator", label: "Generator/Backup Power" },
  { key: "water_backup", label: "Water Backup" },
  { key: "cleaning_service", label: "Cleaning Service" },
  { key: "garden", label: "Garden/Outdoor Space" },
  { key: "common_area", label: "Common Area" }
];

export default function GuestHouseSetupModal({
  open,
  onOpenChange,
  onSuccess,
  editingGuestHouse,
  apiClient,
  tenantSlug
}: GuestHouseSetupModalProps) {
  const [loading, setLoading] = useState(false);
  const [tenantData, setTenantData] = useState<{ country?: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    latitude: "",
    longitude: "",
    house_rules: "",
    facilities: {} as Record<string, boolean>
  });

  useEffect(() => {
    if (editingGuestHouse) {
      console.log('🔍 [DEBUG] Editing guest house data:', editingGuestHouse);
      console.log('🔍 [DEBUG] Facilities raw:', editingGuestHouse.facilities);
      console.log('🔍 [DEBUG] House rules raw:', editingGuestHouse.house_rules);
      
      let parsedFacilities = {};
      try {
        // Handle both string and object formats
        if (typeof editingGuestHouse.facilities === 'string') {
          parsedFacilities = JSON.parse(editingGuestHouse.facilities);
        } else if (editingGuestHouse.facilities && typeof editingGuestHouse.facilities === 'object') {
          parsedFacilities = editingGuestHouse.facilities;
        }
      } catch (error) {
        console.error('Error parsing facilities:', error);
        parsedFacilities = {};
      }
      
      console.log('🔍 [DEBUG] Parsed facilities:', parsedFacilities);

      setFormData({
        name: editingGuestHouse.name || "",
        location: editingGuestHouse.location || "",
        latitude: editingGuestHouse.latitude?.toString() || "",
        longitude: editingGuestHouse.longitude?.toString() || "",
        house_rules: editingGuestHouse.house_rules || "",
        facilities: parsedFacilities
      });
    } else {
      setFormData({
        name: "",
        location: "",
        latitude: "",
        longitude: "",
        house_rules: "",
        facilities: {}
      });
    }
  }, [editingGuestHouse, open]);

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
    setLoading(true);

    try {
      const token = apiClient.getToken();
      const payload = {
        ...formData,
        tenant_id: tenantSlug,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      const url = editingGuestHouse
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/guest-houses/${editingGuestHouse.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/guest-houses/`;

      const method = editingGuestHouse ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Guest house ${editingGuestHouse ? "updated" : "created"} successfully`,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(`Failed to ${editingGuestHouse ? "update" : "create"} guest house`);
      }
    } catch (error) {
      console.error("Error saving guest house:", error);
      toast({
        title: "Error",
        description: `Failed to ${editingGuestHouse ? "update" : "create"} guest house`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacilityChange = (facilityKey: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      facilities: {
        ...prev.facilities,
        [facilityKey]: checked
      }
    }));
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(`${formData.name} ${formData.location}`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

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
              <Home className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {editingGuestHouse ? "Edit Guest House" : "Add New Guest House"}
              </DialogTitle>
              <p className="text-gray-600 text-sm mt-1">
                {editingGuestHouse 
                  ? "Update the guest house details and configuration"
                  : "Set up a new guest house with location and facility details"
                }
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Guest House Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Guest House Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Enter guest house name"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                Location <span className="text-red-500">*</span>
              </Label>
              <LocationSelect
                value={formData.location}
                country={tenantData?.country}
                onChange={(value, placeDetails) => {
                  setFormData(prev => ({
                    ...prev,
                    location: value,
                    latitude: placeDetails?.geometry?.location?.lat()?.toString() || "",
                    longitude: placeDetails?.geometry?.location?.lng()?.toString() || ""
                  }));
                }}
                placeholder="Search and select guest house location"
              />
              <p className="text-xs text-gray-500">Start typing to search for the location</p>
            </div>



            {/* Facilities */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Facilities & Amenities
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                {commonFacilities.map((facility) => (
                  <div key={facility.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={facility.key}
                      checked={formData.facilities[facility.key] || false}
                      onCheckedChange={(checked) => handleFacilityChange(facility.key, checked as boolean)}
                      className="border-gray-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <Label htmlFor={facility.key} className="text-sm font-medium text-gray-700 cursor-pointer">
                      {facility.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* House Rules */}
            <div className="space-y-2">
              <Label htmlFor="house_rules" className="text-sm font-medium text-gray-700">
                House Rules
              </Label>
              <RichTextEditor
                value={formData.house_rules}
                onChange={(value) => setFormData(prev => ({ ...prev, house_rules: value }))}
                placeholder="Enter house rules and policies (e.g., no smoking, quiet hours 10 PM - 7 AM, etc.)..."
                height={200}
              />
              <p className="text-xs text-gray-500">
                Specify rules and policies for guests
              </p>
            </div>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="px-6"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {editingGuestHouse ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editingGuestHouse ? "Update Guest House" : "Create Guest House"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}