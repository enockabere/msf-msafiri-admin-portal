"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2 } from "lucide-react";
import apiClient, { TenantCreateRequest } from "@/lib/api";

interface AddTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTenantModal({
  open,
  onClose,
  onSuccess,
}: AddTenantModalProps) {
  const [formData, setFormData] = useState<TenantCreateRequest>({
    name: "",
    slug: "",
    contact_email: "",
    domain: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    field: keyof TenantCreateRequest,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from name
    if (field === "name") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .trim();
      setFormData((prev) => ({ ...prev, slug }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Organization name is required";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug =
        "Slug can only contain lowercase letters, numbers, and hyphens";
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = "Contact email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = "Please enter a valid email address";
    }

    if (
      formData.domain &&
      !/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/.test(
        formData.domain
      )
    ) {
      newErrors.domain = "Please enter a valid domain (e.g., example.com)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.createTenant({
        ...formData,
        domain: formData.domain || undefined,
        description: formData.description || undefined,
      });

      // Reset form
      setFormData({
        name: "",
        slug: "",
        contact_email: "",
        domain: "",
        description: "",
      });
      setErrors({});

      // Show success notification
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('showNotification', {
          detail: {
            type: 'success',
            message: `Tenant "${formData.name}" has been successfully created!`
          }
        });
        window.dispatchEvent(event);
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to create tenant:", error);
      if (error instanceof Error) {
        // Show error notification
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('showNotification', {
            detail: {
              type: 'error',
              message: `Failed to create tenant: ${error.message}`
            }
          });
          window.dispatchEvent(event);
        }

        if (error.message.includes("slug")) {
          setErrors({
            slug: "This slug is already taken. Please choose a different one.",
          });
        } else if (error.message.includes("email")) {
          setErrors({
            contact_email:
              "This email is already associated with another tenant.",
          });
        } else {
          setErrors({ general: error.message });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: "",
        slug: "",
        contact_email: "",
        domain: "",
        description: "",
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} modal>
      <DialogContent
        className="sm:max-w-[600px] bg-white border border-gray-200 shadow-2xl z-50"
        style={{
          backgroundColor: "#ffffff",
          backdropFilter: "none",
        }}
      >
        <DialogHeader className="bg-white">
          <DialogTitle className="flex items-center space-x-2 text-gray-900">
            <Building2 className="w-5 h-5" />
            <span>Add New Tenant Organization</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a new tenant organization to manage users and resources
            separately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">
                Organization Name *
              </Label>
              <Input
                id="name"
                placeholder="e.g., MSF Kenya"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`bg-white border-gray-300 ${
                  errors.name ? "border-red-300" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Slug - Read-only, auto-generated */}
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-gray-700">
                URL Slug *
              </Label>
              <Input
                id="slug"
                placeholder="Auto-generated from name"
                value={formData.slug}
                className="bg-gray-100 border-gray-300 text-gray-600"
                disabled={true}
                readOnly
              />
              <p className="text-xs text-gray-500">
                Automatically generated from organization name. Used in URLs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="text-gray-700">
                Contact Email *
              </Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="admin@organization.org"
                value={formData.contact_email}
                onChange={(e) =>
                  handleInputChange("contact_email", e.target.value)
                }
                className={`bg-white border-gray-300 ${
                  errors.contact_email ? "border-red-300" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.contact_email && (
                <p className="text-sm text-red-600">{errors.contact_email}</p>
              )}
            </div>

            {/* Domain */}
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-gray-700">
                Domain (Optional)
              </Label>
              <Input
                id="domain"
                placeholder="e.g., msf-kenya.org"
                value={formData.domain}
                onChange={(e) => handleInputChange("domain", e.target.value)}
                className={`bg-white border-gray-300 ${
                  errors.domain ? "border-red-300" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.domain && (
                <p className="text-sm text-red-600">{errors.domain}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Brief description of the organization..."
              value={formData.description}
              onChange={(e: { target: { value: string } }) =>
                handleInputChange("description", e.target.value)
              }
              rows={3}
              disabled={isSubmitting}
              className="bg-white border-gray-300"
            />
            <p className="text-xs text-gray-500">
              Provide a brief description of the organization&apos;s purpose or
              location.
            </p>
          </div>

          <DialogFooter className="bg-white">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Create Tenant
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
