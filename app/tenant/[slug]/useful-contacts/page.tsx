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
import { User, Plus, Mail, Phone, Building, Pencil, Trash2, Save, X, Loader2 } from "lucide-react";

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
    setFormData({ name: "", position: "", email: "", phone: "", department: "" });
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
    });
    setDialogOpen(true);
  };

  const canEdit = user?.role && ["super_admin", "mt_admin", "hr_admin"].includes(user.role);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Useful Contacts</h1>
            <p className="text-xs text-gray-500">Manage important contacts for your organization</p>
          </div>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border border-gray-200 shadow-lg max-w-md">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    {editingContact ? "Edit Contact" : "Add New Contact"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-sm font-medium text-gray-700">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium text-gray-700">Department (Optional)</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {submitting ? "Saving..." : (editingContact ? "Update" : "Create")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Contact Directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading contacts...</div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No contacts added yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-sm text-gray-900">{contact.name}</h3>
                        <p className="text-xs text-gray-600">{contact.position}</p>
                      </div>
                      {canEdit && (
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(contact)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(contact.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <a href={`mailto:${contact.email}`} className="text-xs text-red-600 hover:underline">
                          {contact.email}
                        </a>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <a href={`tel:${contact.phone}`} className="text-xs text-red-600 hover:underline">
                            {contact.phone}
                          </a>
                        </div>
                      )}
                      {contact.department && (
                        <div className="flex items-center space-x-2">
                          <Building className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{contact.department}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-400">
                        Added by {contact.created_by}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}