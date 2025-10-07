"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Plus,
  Edit,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { LoadingScreen } from "@/components/ui/loading";

interface Role {
  id: number;
  name: string;
  description?: string;
  tenant_id: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
}

interface AvailableRole {
  name: string;
  description: string;
}

export default function TenantAdminRolesPage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);

  const tenantSlug = params.slug as string;

  const fetchAvailableRoles = useCallback(async () => {
    try {
      const availableRolesData = await apiClient.request<AvailableRole[]>(
        `/roles/available-roles`,
        {
          headers: { "X-Tenant-ID": tenantSlug },
        }
      );
      setAvailableRoles(availableRolesData);
    } catch (error) {
      console.error("Fetch available roles error:", error);
    }
  }, [apiClient, tenantSlug]);

  const fetchRoles = useCallback(async () => {
    try {
      const rolesData = await apiClient.request<Role[]>(
        `/roles?tenant=${tenantSlug}`,
        {
          headers: { "X-Tenant-ID": tenantSlug },
        }
      );

      setRoles(rolesData);
    } catch (error) {
      console.error("Fetch roles error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [apiClient, tenantSlug]);

  const checkAccess = useCallback(async () => {
    try {
      setLoading(true);

      // If user is super admin, allow access to any tenant
      if (user?.role === "SUPER_ADMIN" || user?.role === "super_admin") {
        setIsTenantAdmin(true);
        await fetchRoles();
        return;
      }

      const tenants = await apiClient.getTenants();
      const tenant = tenants.find((t) => t.slug === tenantSlug);

      if (!tenant) {
        toast({
          title: "Error",
          description: "Tenant not found",
          variant: "destructive",
        });
        return;
      }

      if (tenant.admin_email !== user?.email) {
        toast({
          title: "Access Denied",
          description:
            "You don't have permission to access this tenant's roles",
          variant: "destructive",
        });
        return;
      }

      setIsTenantAdmin(true);
      await Promise.all([fetchRoles(), fetchAvailableRoles()]);
    } catch (error) {
      console.error("Access check error:", error);
      toast({
        title: "Error",
        description: "Failed to verify access",
        variant: "destructive",
      });
    }
  }, [user?.role, user?.email, apiClient, tenantSlug, fetchRoles]);

  useEffect(() => {
    if (!authLoading && user?.email) {
      checkAccess();
    }
  }, [user?.email, authLoading, checkAccess]);

  const handleCreateRole = async () => {
    if (!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only tenant administrators can create roles",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const newRole = await apiClient.request<Role>("/roles/", {
        method: "POST",
        headers: { "X-Tenant-ID": tenantSlug },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
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
      console.error("Role creation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create role";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only tenant administrators can update roles",
        variant: "destructive",
      });
      return;
    }

    if (!editingRole) return;

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const updatedRole = await apiClient.request<Role>(
        `/roles/${editingRole.id}`,
        {
          method: "PUT",
          headers: { "X-Tenant-ID": tenantSlug },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim(),
          }),
        }
      );

      setRoles(
        roles.map((role) => (role.id === editingRole.id ? updatedRole : role))
      );
      setEditingRole(null);
      setFormData({ name: "", description: "" });
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
    } catch (error) {
      console.error("Role update error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update role";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = (role: Role) => {
    if (!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only tenant administrators can edit roles",
        variant: "destructive",
      });
      return;
    }

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

  const handleRoleSelect = (roleName: string) => {
    const selectedRole = availableRoles.find(role => role.name === roleName);
    if (selectedRole) {
      setFormData({
        name: selectedRole.name,
        description: selectedRole.description,
      });
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only tenant administrators can delete roles",
        variant: "destructive",
      });
      return;
    }

    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Delete Role?",
      text: "This action cannot be undone. Are you sure you want to delete this role?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingRoleId(roleId);
      await apiClient.request(`/roles/${roleId}`, {
        method: "DELETE",
        headers: { "X-Tenant-ID": tenantSlug },
      });

      setRoles(roles.filter((role) => role.id !== roleId));

      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    } catch (error) {
      console.error("Role deletion error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete role";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeletingRoleId(null);
    }
  };

  if (loading || authLoading) {
    return <LoadingScreen message="Loading roles..." />;
  }

  return (
    <ProtectedRoute requireTenantAdmin={true}>
      <DashboardLayout>
      <div className="space-y-6">
        <div className="w-full space-y-4">
          {/* Header and Create Button */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Roles</h1>
              <p className="text-gray-600">
                Manage custom roles for your organization
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              disabled={!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin"}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white h-9 px-4 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Create Role
            </Button>
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Shield className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            No roles found
                          </div>
                          <div className="text-xs text-gray-500">
                            Create your first custom role to get started
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    roles.map((role) => (
                      <tr
                        key={role.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-full flex items-center justify-center">
                              <Shield className="w-3 h-3 text-purple-700" />
                            </div>
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {role.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {role.description || "No description"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {role.created_by === "system" ? (
                              <span className="text-blue-600 font-medium">
                                System
                              </span>
                            ) : role.created_by === null ||
                              role.created_by === undefined ? (
                              <span className="text-green-600 font-medium">
                                {user?.email || "Current User"}
                              </span>
                            ) : role.updated_by &&
                              role.updated_by !== role.created_by ? (
                              <div>
                                <div className="text-xs text-gray-500">
                                  Modified by:
                                </div>
                                <div>{role.updated_by}</div>
                              </div>
                            ) : (
                              role.created_by
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {new Date(role.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(role.created_at).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin"}
                                className="h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 bg-white border border-gray-200 shadow-lg rounded-md"
                            >
                              <DropdownMenuItem
                                onClick={() => handleEditRole(role)}
                                className="gap-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                                Edit Role
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteRole(role.id)}
                                className="gap-2 hover:bg-red-50 cursor-pointer text-red-600"
                                disabled={deletingRoleId === role.id}
                              >
                                {deletingRoleId === role.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                                {deletingRoleId === role.id
                                  ? "Deleting..."
                                  : "Delete Role"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <div>
              Showing{" "}
              <span className="font-medium text-gray-900">{roles.length}</span>{" "}
              roles
            </div>
          </div>
        </div>

        <Dialog
          open={showCreateModal || !!editingRole}
          onOpenChange={closeModal}
        >
          <DialogContent className="bg-white border border-gray-200 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                {editingRole ? "Edit Role" : "Create New Role"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 bg-white">
              <div>
                <Label htmlFor="name" className="text-gray-700">
                  Role Name
                </Label>
                {!editingRole ? (
                  <Select onValueChange={handleRoleSelect}>
                    <SelectTrigger className="mt-2 bg-white border-gray-300">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          <div>
                            <div className="font-medium">{role.name}</div>
                            <div className="text-sm text-gray-500">{role.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter role name"
                    className="mt-2 bg-white border-gray-300"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter role description"
                  rows={3}
                  className="mt-2 bg-white border-gray-300"
                />
              </div>
            </div>
            <DialogFooter className="bg-white">
              <Button
                variant="outline"
                onClick={closeModal}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={editingRole ? handleUpdateRole : handleCreateRole}
                disabled={submitting || !formData.name.trim()}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingRole ? "Updating..." : "Creating..."}
                  </>
                ) : editingRole ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
