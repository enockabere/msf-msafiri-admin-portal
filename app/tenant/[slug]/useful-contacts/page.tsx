"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Plus,
  Mail,
  Phone,
  Building,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  Clock,
} from "lucide-react";

interface UsefulContact {
  id: number;
  name: string;
  position: string;
  email: string;
  phone?: string;
  department?: string;
  created_by: string;
  created_at: string;
}

export default function UsefulContactsPage() {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const params = useParams();
  const tenantSlug = params.slug as string;

  const [contacts, setContacts] = useState<UsefulContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<UsefulContact | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    email: "",
    phone: "",
    department: "",
    availability_schedule: "business_hours",
    availability_details: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchContacts = useCallback(async () => {
    // Don't fetch if still loading auth or no user
    if (authLoading || !user) {
      return;
    }

    const token = apiClient.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantSlug,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/useful-contacts/`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [apiClient, tenantSlug, authLoading, user]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingContact
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/useful-contacts/${editingContact.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/useful-contacts/`;

      const response = await fetch(url, {
        method: editingContact ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantSlug,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchContacts();
        setDialogOpen(false);
        resetForm();
        toast({
          title: "Success",
          description: `Contact ${
            editingContact ? "updated" : "created"
          } successfully`,
        });
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error" }));

        toast({
          title: "Error",
          description: errorData.detail || "Failed to save contact",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/useful-contacts/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "X-Tenant-ID": tenantSlug,
          },
        }
      );
      if (response.ok) {
        fetchContacts();
        toast({
          title: "Success",
          description: "Contact deleted successfully",
        });
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error" }));
        toast({
          title: "Error",
          description: errorData.detail || "Failed to delete contact",
          variant: "destructive",
        });
      }
    } catch {
      // Error handled by toast
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      position: "",
      email: "",
      phone: "",
      department: "",
      availability_schedule: "business_hours",
      availability_details: "",
    });
    setEditingContact(null);
  };

  const openEditDialog = (contact: UsefulContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      position: contact.position,
      email: contact.email,
      phone: contact.phone || "",
      department: contact.department || "",
      availability_schedule:
        (contact as any).availability_schedule || "business_hours",
      availability_details: (contact as any).availability_details || "",
    });
    setDialogOpen(true);
  };

  const canEdit =
    user?.role && ["super_admin", "mt_admin", "hr_admin"].includes(user.role);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header - Simplified like Vendor Hotels */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 mb-1">
                  Useful Contacts
                </h1>
                <p className="text-sm text-gray-600">
                  Manage important organizational contacts
                </p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={resetForm}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg font-medium h-10 px-4 text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[900px] bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
                {/* Header with close button */}
                <button
                  onClick={() => setDialogOpen(false)}
                  className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none"
                >
                  <X className="h-4 w-4 text-gray-500" />
                  <span className="sr-only">Close</span>
                </button>

                <div className="p-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold text-gray-900">
                        {editingContact ? "Edit Contact" : "Add New Contact"}
                      </DialogTitle>
                      <p className="text-gray-600 text-sm mt-1">
                        {editingContact
                          ? "Update contact information"
                          : "Add a new contact to your directory"}
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="flex-1 overflow-y-auto"
                >
                  <div className="p-6 space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-sm font-medium text-gray-700"
                      >
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        placeholder="Enter full name"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    {/* Position */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="position"
                        className="text-sm font-medium text-gray-700"
                      >
                        Position <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) =>
                          setFormData({ ...formData, position: e.target.value })
                        }
                        required
                        placeholder="Enter job position"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700"
                      >
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                        placeholder="email@example.com"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-sm font-medium text-gray-700"
                      >
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+1 (555) 000-0000"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="department"
                        className="text-sm font-medium text-gray-700"
                      >
                        Department
                      </Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        placeholder="Enter department name"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={submitting}
                      className="px-6"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="px-6 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {editingContact ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {editingContact ? "Update Contact" : "Create Contact"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Contact Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Loading contacts...
                </p>
                <p className="text-xs text-gray-500">
                  Please wait while we fetch the data
                </p>
              </div>
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              No contacts yet
            </h3>
            <p className="text-xs text-gray-500 max-w-md text-center">
              Get started by adding your first contact to build your directory
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white rounded-2xl p-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">
                          {contact.name}
                        </h3>
                        <p className="text-xs text-gray-600 truncate">
                          {contact.position}
                        </p>
                      </div>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(contact)}
                        className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-600"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(contact.id)}
                        className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Mail className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
                    >
                      {contact.email}
                    </a>
                  </div>

                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-xs text-green-600 hover:text-green-800 hover:underline"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}

                  {contact.department && (
                    <div className="flex items-center gap-2">
                      <Building className="w-3 h-3 text-orange-500 flex-shrink-0" />
                      <span className="text-xs text-gray-700 font-medium">
                        {contact.department}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 pt-2 border-t border-gray-200">
                    <Clock className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-gray-600">
                      {(contact as any).availability_schedule === "24/7" &&
                        "Available 24/7"}
                      {(contact as any).availability_schedule ===
                        "business_hours" && "Mon-Fri, 8 AM - 5 PM"}
                      {(contact as any).availability_schedule ===
                        "extended_hours" && "Mon-Sat, 8 AM - 8 PM"}
                      {(contact as any).availability_schedule === "custom" &&
                        "Custom Schedule"}
                      {!(contact as any).availability_schedule &&
                        "Business Hours"}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-400">
                    Added by {contact.created_by}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
