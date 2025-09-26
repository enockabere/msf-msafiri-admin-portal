"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Plus, Phone, Mail, User, Settings, Loader2, Save, X } from "lucide-react";

interface TransportVendor {
  id: number;
  name: string;
  vendor_type: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

interface VendorManagementProps {
  vendors: TransportVendor[];
  canEdit: boolean;
  onRefresh: () => void;
  apiClient: { getToken: () => string };
  tenantSlug: string;
}

export default function VendorManagement({
  vendors,
  canEdit,
  onRefresh,
  apiClient,
  tenantSlug
}: VendorManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: "",
    vendor_type: "manual_vendor",
    contact_person: "",
    phone: "",
    email: "",
    api_endpoint: "",
    api_key: "",
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/vendors/?tenant_context=${tenantSlug}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(vendorForm),
        }
      );

      if (response.ok) {
        toast({ title: "Success", description: "Vendor created successfully" });
        onRefresh();
        setDialogOpen(false);
        resetForm();
      } else {
        const errorData = await response.json();
        toast({ title: "Error", description: errorData.detail || "Failed to create vendor", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setVendorForm({
      name: "",
      vendor_type: "manual_vendor",
      contact_person: "",
      phone: "",
      email: "",
      api_endpoint: "",
      api_key: "",
      is_active: true
    });
  };

  const getVendorTypeLabel = (type: string) => {
    return type === 'absolute_taxi' ? 'Absolute Taxi (API)' : 'Manual Vendor';
  };

  const getVendorTypeBadge = (type: string) => {
    return type === 'absolute_taxi' 
      ? "bg-blue-100 text-blue-800" 
      : "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Transport Vendors</h3>
          <p className="text-sm text-gray-500">Manage taxi companies and transport providers</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border border-gray-200 shadow-lg max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-gray-900">Add New Vendor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Vendor Name</Label>
                  <Input
                    id="name"
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    placeholder="e.g., City Taxi Services"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor_type" className="text-sm font-medium text-gray-700">Vendor Type</Label>
                  <Select value={vendorForm.vendor_type} onValueChange={(value) => setVendorForm({ ...vendorForm, vendor_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual_vendor">Manual Vendor</SelectItem>
                      <SelectItem value="absolute_taxi">Absolute Taxi (API)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_person" className="text-sm font-medium text-gray-700">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={vendorForm.contact_person}
                    onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
                    placeholder="Contact person name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</Label>
                    <Input
                      id="phone"
                      value={vendorForm.phone}
                      onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                      placeholder="+254..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                      placeholder="contact@vendor.com"
                    />
                  </div>
                </div>

                {vendorForm.vendor_type === 'absolute_taxi' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="api_endpoint" className="text-sm font-medium text-gray-700">API Endpoint</Label>
                      <Input
                        id="api_endpoint"
                        value={vendorForm.api_endpoint}
                        onChange={(e) => setVendorForm({ ...vendorForm, api_endpoint: e.target.value })}
                        placeholder="https://api.absolutetaxi.com/v1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api_key" className="text-sm font-medium text-gray-700">API Key</Label>
                      <Input
                        id="api_key"
                        type="password"
                        value={vendorForm.api_key}
                        onChange={(e) => setVendorForm({ ...vendorForm, api_key: e.target.value })}
                        placeholder="API key for authentication"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {submitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {submitting ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Vendors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-base font-medium text-gray-900 mb-2">No vendors configured</h3>
            <p className="text-gray-500 mb-4">Add transport vendors to start managing bookings</p>
          </div>
        ) : (
          vendors.map((vendor) => (
            <Card key={vendor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-medium text-gray-900">
                      {vendor.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getVendorTypeBadge(vendor.vendor_type)}>
                        {getVendorTypeLabel(vendor.vendor_type)}
                      </Badge>
                      <Badge className={vendor.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {vendor.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {vendor.contact_person && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{vendor.contact_person}</span>
                    </div>
                  )}
                  
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a 
                        href={`tel:${vendor.phone}`} 
                        className="text-blue-600 hover:underline"
                      >
                        {vendor.phone}
                      </a>
                    </div>
                  )}
                  
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a 
                        href={`mailto:${vendor.email}`} 
                        className="text-blue-600 hover:underline"
                      >
                        {vendor.email}
                      </a>
                    </div>
                  )}

                  {vendor.vendor_type === 'absolute_taxi' && (
                    <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                      <div className="font-medium text-blue-900">API Integration</div>
                      <div className="text-blue-700 mt-1">
                        Automated booking and tracking enabled
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}