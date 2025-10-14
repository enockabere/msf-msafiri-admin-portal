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

interface GuesthouseForm {
  name: string;
  location: string;
  latitude?: string;
  longitude?: string;
  description: string;
}

interface GuesthouseManagementProps {
  canEdit: boolean;
  onGuesthouseCreated: () => void;
  apiClient: { getToken: () => string };
  tenantSlug: string;
}

export default function GuesthouseManagement({ 
  canEdit, 
  onGuesthouseCreated, 
  apiClient, 
  tenantSlug 
}: GuesthouseManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tenantData, setTenantData] = useState<{ country?: string } | null>(null);
  const [guesthouseForm, setGuesthouseForm] = useState<GuesthouseForm>({
    name: "",
    location: "",
    latitude: "",
    longitude: "",
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/guesthouses`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
            'X-Tenant-ID': tenantSlug
          },
          body: JSON.stringify(guesthouseForm),
        }
      );

      if (response.ok) {
        onGuesthouseCreated();
        setDialogOpen(false);
        setGuesthouseForm({ 
          name: "", 
          location: "", 
          latitude: "",
          longitude: "",
          description: ""
        });
        toast({ title: "Success", description: "Guesthouse created successfully" });
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
          Add Guesthouse
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border border-gray-200 shadow-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Add New Guesthouse</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
            <Input
              id="name"
              value={guesthouseForm.name}
              onChange={(e) => setGuesthouseForm({ ...guesthouseForm, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
            <LocationSelect
              value={guesthouseForm.location}
              country={tenantData?.country}
              onChange={(value, placeDetails) => {
                setGuesthouseForm({ 
                  ...guesthouseForm, 
                  location: value,
                  latitude: placeDetails?.geometry?.location?.lat()?.toString() || "",
                  longitude: placeDetails?.geometry?.location?.lng()?.toString() || ""
                });
              }}
              placeholder="Search for guesthouse location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Facilities Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the facilities available in this guesthouse (e.g., WiFi, parking, dining, etc.)"
              value={guesthouseForm.description}
              onChange={(e) => setGuesthouseForm({ ...guesthouseForm, description: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {submitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}