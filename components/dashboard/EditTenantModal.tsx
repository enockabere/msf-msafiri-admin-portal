"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAuthenticatedApi } from "@/lib/auth";
import { Tenant } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { CountrySelect } from "@/components/ui/country-select";

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
      <DialogContent className="bg-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 my-4">
          <div className="space-y-3">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="admin_email">Admin Email</Label>
            <Input
              id="admin_email"
              type="email"
              value={formData.admin_email}
              onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
              required
              placeholder="Email of the tenant administrator"
            />
            <p className="text-xs text-gray-500 mt-1">
              Only this email address will have access to the tenant dashboard
            </p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="country">Country</Label>
            <CountrySelect
              value={formData.country}
              onChange={(value) => setFormData({ ...formData, country: value })}
              placeholder="Select country"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="reason">Reason for Change</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief reason for this update"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-black text-black hover:bg-gray-50">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}