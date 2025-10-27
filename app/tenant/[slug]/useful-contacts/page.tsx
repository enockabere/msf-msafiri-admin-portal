"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Plus, Mail, Phone, Building, Pencil, Trash2, Save, X, Loader2, Clock } from "lucide-react";

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
  const { user } = useAuth();
  const { apiClient } = useAuthenticatedApi();

  const [contacts, setContacts] = useState<UsefulContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<UsefulContact | null>(null);
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
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/useful-contacts/`,
        {
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

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
        },
        body: JSON.stringify(formData),
      });


      
      if (response.ok) {
        fetchContacts();
        setDialogOpen(false);
        resetForm();
        toast({
          title: "Success",
          description: `Contact ${editingContact ? 'updated' : 'created'} successfully`,
        });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));

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
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
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
      availability_details: ""
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
      availability_schedule: (contact as any).availability_schedule || "business_hours",
      availability_details: (contact as any).availability_details || "",
    });
    setDialogOpen(true);
  };

  const canEdit = user?.role && ["super_admin", "mt_admin", "hr_admin"].includes(user.role);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Modern Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-orange-600 rounded-2xl shadow-xl">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Title Section */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Useful Contacts</h1>
                    <p className="text-sm text-red-100 mt-0.5">Quick access to important organizational contacts</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{contacts.length}</div>
                      <div className="text-xs text-red-100">Total Contacts</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {canEdit && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={resetForm}
                      className="bg-white text-red-600 hover:bg-red-50 shadow-lg font-semibold h-12 px-6"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-0 shadow-2xl max-w-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <DialogTitle className="text-lg font-bold text-white">
                            {editingContact ? "Edit Contact" : "Add New Contact"}
                          </DialogTitle>
                          <p className="text-red-100 text-xs mt-1">
                            {editingContact ? "Update contact information" : "Add a new contact to your directory"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto modal-scrollbar p-6">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-semibold text-gray-900">
                              Name
                              <span className="text-red-500 ml-1">*</span>
                            </Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Enter full name"
                              className="h-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 text-sm"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="position" className="text-sm font-semibold text-gray-900">
                              Position
                              <span className="text-red-500 ml-1">*</span>
                            </Label>
                            <Input
                              id="position"
                              value={formData.position}
                              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                              placeholder="Enter job position"
                              className="h-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 text-sm"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                              Email
                              <span className="text-red-500 ml-1">*</span>
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="email@example.com"
                              className="h-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 text-sm"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-semibold text-gray-900">
                              Phone (Optional)
                            </Label>
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+1 (555) 000-0000"
                              className="h-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="department" className="text-sm font-semibold text-gray-900">
                            Department (Optional)
                          </Label>
                          <Input
                            id="department"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            placeholder="Enter department name"
                            className="h-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="availability" className="text-sm font-semibold text-gray-900">
                            Availability
                          </Label>
                          <select
                            id="availability"
                            value={formData.availability_schedule}
                            onChange={(e) => setFormData({ ...formData, availability_schedule: e.target.value })}
                            className="w-full h-10 px-3 border-2 border-gray-300 rounded-md focus:border-red-500 focus:ring-red-500 text-sm"
                          >
                            <option value="24/7">24/7 - Always Available</option>
                            <option value="business_hours">Business Hours (8 AM - 5 PM, Mon-Fri)</option>
                            <option value="extended_hours">Extended Hours (8 AM - 8 PM, Mon-Sat)</option>
                            <option value="custom">Custom Schedule</option>
                          </select>
                        </div>

                        {formData.availability_schedule === "custom" && (
                          <div className="space-y-2">
                            <Label htmlFor="availability_details" className="text-sm font-semibold text-gray-900">
                              Custom Schedule Details
                            </Label>
                            <textarea
                              id="availability_details"
                              value={formData.availability_details}
                              onChange={(e) => setFormData({ ...formData, availability_details: e.target.value })}
                              placeholder="e.g., Monday-Wednesday: 9 AM - 6 PM, Thursday-Friday: 10 AM - 4 PM"
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-red-500 focus:ring-red-500 text-sm min-h-[80px]"
                            />
                          </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <Button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                {editingContact ? "Update Contact" : "Create Contact"}
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            className="flex-1 border-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>


        {/* Contact Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-red-100 border-t-red-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-10 h-10 text-red-600 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">Loading contacts...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the data</p>
              </div>
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts yet</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Get started by adding your first contact to build your directory
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {contacts.map((contact) => (
              <Card
                key={contact.id}
                className="group relative overflow-hidden border-2 border-gray-200 hover:border-red-300 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-red-50"
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-200 rounded-xl flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-red-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base text-gray-900 truncate">{contact.name}</h3>
                          <p className="text-xs text-gray-600 truncate">{contact.position}</p>
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(contact)}
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(contact.id)}
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-xs text-red-600 hover:text-red-800 hover:underline break-all"
                      >
                        {contact.email}
                      </a>
                    </div>

                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
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
                        <Building className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 font-medium">{contact.department}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2 pt-2 border-t border-gray-200">
                      <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-600">
                        {(contact as any).availability_schedule === "24/7" && "Available 24/7"}
                        {(contact as any).availability_schedule === "business_hours" && "Mon-Fri, 8 AM - 5 PM"}
                        {(contact as any).availability_schedule === "extended_hours" && "Mon-Sat, 8 AM - 8 PM"}
                        {(contact as any).availability_schedule === "custom" && "Custom Schedule"}
                        {!(contact as any).availability_schedule && "Business Hours"}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-400">
                      Added by {contact.created_by}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}