"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2 } from "lucide-react";
import { useAuthenticatedApi } from "@/lib/auth";
import { Tenant } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { CountrySelect } from "@/components/ui/country-select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface EditTenantModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTenantModal({ tenant, open, onClose, onSuccess }: EditTenantModalProps) {
  const { apiClient } = useAuthenticatedApi();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact_email: "",
    admin_email: "",
    domain: "",
    description: "",
    country: "",
  });
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        contact_email: tenant.contact_email,
        admin_email: tenant.admin_email || "",
        domain: tenant.domain || "",
        description: tenant.description || "",
        country: tenant.country || "",
      });
    }
  }, [tenant]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });

    // Real-time email validation
    if (field === "contact_email" || field === "admin_email") {
      if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          [field]: "Please enter a valid email address"
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    } else {
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setLoading(true);
    try {
      const updateReason = reason || "Updated tenant information";
      await apiClient.updateTenant(tenant.id, formData, updateReason);
      toast({
        title: "Success",
        description: "Tenant updated successfully",
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update tenant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] bg-white max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-gray-900">
            <Building2 className="w-5 h-5" />
            <span>Edit Tenant Organization</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Update tenant organization information and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white my-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization Name */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-gray-700">
                Organization Name *
              </Label>
              <Input
                id="name"
                placeholder="e.g., MSF Kenya"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-white border-gray-300"
                disabled={loading}
                required
              />
            </div>

            {/* Country */}
            <div className="space-y-3">
              <Label htmlFor="country" className="text-gray-700">
                Country *
              </Label>
              <CountrySelect
                value={formData.country}
                onChange={(value) => handleInputChange("country", value)}
                placeholder="Select country"
              />
            </div>
          </div>

          {/* Contact and Admin Emails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Email */}
            <div className="space-y-3">
              <Label htmlFor="contact_email" className="text-gray-700">
                Contact Email *
              </Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="contact@organization.org"
                value={formData.contact_email}
                onChange={(e) => handleInputChange("contact_email", e.target.value)}
                className={`bg-white border-gray-300 ${
                  errors.contact_email ? "border-red-300" : ""
                }`}
                disabled={loading}
                required
              />
              {errors.contact_email && (
                <p className="text-sm text-red-600">{errors.contact_email}</p>
              )}
              <p className="text-xs text-gray-500">
                General contact email for the organization
              </p>
            </div>

            {/* Admin Email */}
            <div className="space-y-3">
              <Label htmlFor="admin_email" className="text-gray-700">
                Admin Email *
              </Label>
              <Input
                id="admin_email"
                type="email"
                placeholder="admin@organization.org"
                value={formData.admin_email}
                onChange={(e) => handleInputChange("admin_email", e.target.value)}
                className={`bg-white border-gray-300 ${
                  errors.admin_email ? "border-red-300" : ""
                }`}
                disabled={loading}
                required
              />
              {errors.admin_email && (
                <p className="text-sm text-red-600">{errors.admin_email}</p>
              )}
              <p className="text-xs text-gray-500">
                Email of the person who will have admin access to this tenant
              </p>
            </div>
          </div>

          {/* Domain and Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Domain */}
            <div className="space-y-3">
              <Label htmlFor="domain" className="text-gray-700">
                Domain (Optional)
              </Label>
              <Input
                id="domain"
                placeholder="e.g., msf-kenya.org"
                value={formData.domain}
                onChange={(e) => handleInputChange("domain", e.target.value)}
                className="bg-white border-gray-300"
                disabled={loading}
              />
            </div>

            {/* Reason for Change */}
            <div className="space-y-3">
              <Label htmlFor="reason" className="text-gray-700">
                Reason for Change (Optional)
              </Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief reason for this update"
                className="bg-white border-gray-300"
                disabled={loading}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-gray-700">
              Description (Optional)
            </Label>
            <RichTextEditor
              value={formData.description || ""}
              onChange={(value) => handleInputChange("description", value)}
              placeholder="Brief description of the organization..."
              height={200}
            />
            <p className="text-xs text-gray-500">
              Provide a brief description of the organization&apos;s purpose or location.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}