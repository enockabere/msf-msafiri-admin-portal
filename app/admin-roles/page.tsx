"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Plus, Edit, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Role {
  id: number;
  name: string;
  description?: string;
  tenant_id: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export default function AdminRolesPage() {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Get tenant ID from URL or user context
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const tenantSlugMatch = pathname.match(/\/tenant\/([^/]+)/);
  const tenantSlug = tenantSlugMatch ? tenantSlugMatch[1] : user?.tenantId || "default";

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const rolesData = await apiClient.request<Role[]>(`/roles/tenant/${tenantSlug}`);
      setRoles(rolesData);
    } catch  {
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [apiClient, tenantSlug]);

  useEffect(() => {
    if (!authLoading && user?.email) {
      fetchRoles();
    }
  }, [user?.email, authLoading, fetchRoles]);

  const handleCreateRole = async () => {
    try {
      setSubmitting(true);
      const newRole = await apiClient.request<Role>("/roles/", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          tenant_id: tenantSlug,
        }),
      });
      
      setRoles([...roles, newRole]);
      setShowCreateModal(false);
      setFormData({ name: "", description: "" });
      
      toast({
        title: "Success",
        description: "Role created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create role",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    
    try {
      setSubmitting(true);
      const updatedRole = await apiClient.request<Role>(`/roles/${editingRole.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      });
      
      setRoles(roles.map(role => role.id === editingRole.id ? updatedRole : role));
      setEditingRole(null);
      setFormData({ name: "", description: "" });
      
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingRole(null);
    setFormData({ name: "", description: "" });
  };

  if (loading || authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute requireTenantAdmin={true}>
      <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Roles</h1>
            <p className="text-gray-600">Manage custom roles for your organization</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Role
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Organization Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No roles found</h3>
                <p className="text-gray-600 mb-4">Create your first custom role to get started</p>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Role
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description || "No description"}</TableCell>
                      <TableCell>{role.created_by}</TableCell>
                      <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={showCreateModal || !!editingRole} onOpenChange={closeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Edit Role" : "Create New Role"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter role description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                onClick={editingRole ? handleUpdateRole : handleCreateRole}
                disabled={submitting || !formData.name.trim()}
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingRole ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}