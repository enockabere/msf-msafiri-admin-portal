"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import { MapPin, Clock } from "lucide-react";

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
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    address: "",
    latitude: "",
    longitude: "",
    description: "",
    contact_person: "",
    phone: "",
    email: "",
    house_rules: "",
    check_in_time: "14:00",
    check_out_time: "11:00",
    facilities: {} as Record<string, boolean>
  });

  useEffect(() => {
    if (editingGuestHouse) {
      setFormData({
        name: editingGuestHouse.name || "",
        location: editingGuestHouse.location || "",
        address: editingGuestHouse.address || "",
        latitude: editingGuestHouse.latitude?.toString() || "",
        longitude: editingGuestHouse.longitude?.toString() || "",
        description: editingGuestHouse.description || "",
        contact_person: editingGuestHouse.contact_person || "",
        phone: editingGuestHouse.phone || "",
        email: editingGuestHouse.email || "",
        house_rules: editingGuestHouse.house_rules || "",
        check_in_time: editingGuestHouse.check_in_time || "14:00",
        check_out_time: editingGuestHouse.check_out_time || "11:00",
        facilities: editingGuestHouse.facilities || {}
      });
    } else {
      setFormData({
        name: "",
        location: "",
        address: "",
        latitude: "",
        longitude: "",
        description: "",
        contact_person: "",
        phone: "",
        email: "",
        house_rules: "",
        check_in_time: "14:00",
        check_out_time: "11:00",
        facilities: {}
      });
    }
  }, [editingGuestHouse, open]);

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
    const query = encodeURIComponent(`${formData.name} ${formData.location} ${formData.address}`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingGuestHouse ? "Edit Guest House" : "Add New Guest House"}
          </DialogTitle>
          <DialogDescription>
            {editingGuestHouse 
              ? "Update the guest house details and configuration"
              : "Set up a new guest house with location and facility details"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Guest House Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., MSF Guest House Westlands"
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location/Area *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Westlands, Nairobi"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Full Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter the complete address including street, building, and landmarks"
                required
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="-1.2921"
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="36.8219"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openGoogleMaps}
                  className="w-full"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Find on Maps
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the guest house"
                rows={2}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="Manager/Caretaker name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+254 700 000 000"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@guesthouse.com"
                />
              </div>
            </div>
          </div>

          {/* Check-in/Check-out Times */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Check-in/Check-out Times
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="check_in_time">Check-in Time</Label>
                <Input
                  id="check_in_time"
                  type="time"
                  value={formData.check_in_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, check_in_time: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="check_out_time">Check-out Time</Label>
                <Input
                  id="check_out_time"
                  type="time"
                  value={formData.check_out_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, check_out_time: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Facilities & Amenities</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {commonFacilities.map((facility) => (
                <div key={facility.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={facility.key}
                    checked={formData.facilities[facility.key] || false}
                    onCheckedChange={(checked) => handleFacilityChange(facility.key, checked as boolean)}
                  />
                  <Label htmlFor={facility.key} className="text-sm">
                    {facility.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* House Rules */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">House Rules</h4>
            <Textarea
              id="house_rules"
              value={formData.house_rules}
              onChange={(e) => setFormData(prev => ({ ...prev, house_rules: e.target.value }))}
              placeholder="Enter house rules and policies (e.g., no smoking, quiet hours, etc.)"
              rows={3}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : editingGuestHouse ? "Update Guest House" : "Create Guest House"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}