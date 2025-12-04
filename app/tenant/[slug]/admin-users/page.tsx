"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { getInternalApiUrl } from "@/lib/base-path";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  Loader2,
  MoreHorizontal,
  Mail,
  Clock,
  UserMinus,
  XCircle,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { LoadingScreen } from "@/components/ui/loading";
import type { UserRole } from "@/lib/api";

interface UserRoleResponse {
  id: number;
  user_id: number;
  role: string;
  tenant_id: string;
  created_at: string;
}

interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  status: string;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  last_login?: string;
  auth_provider: string;
  auto_registered: boolean;
}

interface PendingInvitation {
  id: number;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
  expires_at: string;
  created_at: string;
  invited_by: string;
}

interface ApiUserData {
  id: number;
  email: string;
  full_name: string;
  role?: string;
  status?: string;
  is_active?: boolean;
  tenant_id?: string;
  created_at?: string;
  last_login?: string;
}

export default function TenantAdminUsersPage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);

  const tenantSlug = params.slug as string;

  const fetchUsers = useCallback(async () => {
    try {
      const [usersData, tenants] = await Promise.all([
        apiClient.getUsers(tenantSlug),
        apiClient.getTenants(),
      ]);

      const tenant = tenants.find((t) => t.slug === tenantSlug);
      const tenantUsers = usersData.filter((u) => u.tenant_id === tenantSlug);

      // Fetch all user roles for each user
      const usersWithRoles = await Promise.all(
        tenantUsers.map(async (user) => {
          try {
            const userRoles = await apiClient.request<UserRoleResponse[]>(
              `/user-roles/user/${user.id}`
            );
            const roleNames = userRoles.map((r) => r.role).join(", ");
            return {
              ...user,
              role: roleNames || user.role || "GUEST",
            };
          } catch {
            return {
              ...user,
              role: user.role || "GUEST",
            }; // Return original user with Guest fallback if roles fetch fails
          }
        })
      );

      // Add tenant admin info if not already in the list
      if (tenant?.admin_email) {
        const tenantAdminExists = usersWithRoles.some(
          (u) => u.email === tenant.admin_email
        );
        if (!tenantAdminExists) {
          try {
            const tenantAdmin = (await apiClient.request<ApiUserData>(
              `/users/by-email/${tenant.admin_email}`
            )) as AdminUser;
            const userRoles = await apiClient
              .request<UserRoleResponse[]>(`/user-roles/user/${tenantAdmin.id}`)
              .catch(() => []);
            const roleNames = userRoles.map((r) => r.role).join(", ");

            const adminWithRoles: AdminUser = {
              ...tenantAdmin,
              role: roleNames ? `${roleNames}, TENANT_ADMIN` : "TENANT_ADMIN",
              tenant_id: tenantAdmin.tenant_id || tenantSlug,
              auth_provider: tenantAdmin.auth_provider || "local",
              auto_registered: tenantAdmin.auto_registered || false,
              status: tenantAdmin.status || "ACTIVE",
              is_active: tenantAdmin.is_active ?? true,
              created_at: tenantAdmin.created_at || new Date().toISOString(),
            };
            usersWithRoles.unshift(adminWithRoles as unknown as typeof usersWithRoles[0]);
          } catch {
            // Create placeholder if user not found
            const tenantAdminEntry: AdminUser = {
              id: 0,
              email: tenant.admin_email,
              full_name: tenant.admin_email.split("@")[0],
              role: "TENANT_ADMIN",
              status: "ACTIVE",
              is_active: true,
              tenant_id: tenantSlug,
              created_at: tenant.created_at || new Date().toISOString(),
              auth_provider: "local",
              auto_registered: false,
            };
            usersWithRoles.unshift(tenantAdminEntry as unknown as typeof usersWithRoles[0]);
          }
        }
      }

      setUsers(usersWithRoles as AdminUser[]);
    } catch (error) {
      console.error("Fetch users error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [apiClient, tenantSlug]);

  const fetchPendingInvitations = useCallback(async () => {
    try {
      const invitations = await apiClient.request<PendingInvitation[]>(
        `/invitations/tenant/${tenantSlug}`
      );
      setPendingInvitations(invitations);
    } catch (error) {
      console.error("Fetch invitations error:", error);
    }
  }, [apiClient, tenantSlug]);

  const checkAccess = useCallback(async () => {
    try {
      setLoading(true);

      // If user is super admin, allow access to any tenant
      if (user?.role === "SUPER_ADMIN" || user?.role === "super_admin") {
        setIsTenantAdmin(true);
        await Promise.all([fetchUsers(), fetchPendingInvitations()]);
        fetchRoles();
        return;
      }

      // For other admin users, check if they are the tenant admin
      const tenantResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`
      );
      if (!tenantResponse.ok) {
        toast({
          title: "Error",
          description: "Tenant not found",
          variant: "destructive",
        });
        return;
      }

      const tenant = await tenantResponse.json();
      if (tenant.admin_email !== user?.email) {
        toast({
          title: "Access Denied",
          description: "Only the tenant administrator can manage users",
          variant: "destructive",
        });
        return;
      }

      setIsTenantAdmin(true);
      await Promise.all([fetchUsers(), fetchPendingInvitations()]);
      fetchRoles();
    } catch (error) {
      console.error("Access check error:", error);
      toast({
        title: "Error",
        description: "Failed to verify access",
        variant: "destructive",
      });
    }
  }, [
    user?.role,
    user?.email,
    tenantSlug,
    fetchUsers,
    fetchPendingInvitations,
  ]);

  useEffect(() => {
    if (!authLoading && user?.email) {
      checkAccess();
    }
  }, [user?.email, authLoading, checkAccess]);

  const fetchRoles = async () => {
    try {
      const adminRoles = [
        { value: "mt_admin", label: "MT Administrator" },
        { value: "hr_admin", label: "HR Administrator" },
        { value: "event_admin", label: "Event Administrator" },
        { value: "staff", label: "Staff" },
        { value: "guest", label: "Guest" },
      ];
      setRoles(adminRoles);
    } catch (error) {
      console.error("Fetch roles error:", error);
    }
  };

  const handleInviteUser = async () => {
    if (!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only tenant administrators can invite users",
        variant: "destructive",
      });
      return;
    }

    if (
      !formData.email.trim() ||
      !formData.full_name.trim() ||
      !formData.role
    ) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(getInternalApiUrl("/api/invitations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          full_name: formData.full_name.trim(),
          role: formData.role,
          tenant_id: tenantSlug,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }

      setShowInviteModal(false);
      setFormData({ email: "", full_name: "", role: "" });
      await fetchPendingInvitations();

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
    } catch (error) {
      console.error("Invite user error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send invitation";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRole = async () => {
    if (!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only tenant administrators can change user roles",
        variant: "destructive",
      });
      return;
    }

    if (!selectedUser || !formData.role) return;

    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Change User Role?",
      text: `This will change ${selectedUser.full_name}'s role to ${
        roles.find((r) => r.value === formData.role)?.label
      }. They will receive a notification about this change.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, change role",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      await apiClient.changeUserRole(selectedUser.id, { role: formData.role } as unknown as UserRole);

      // Refresh users list instead of manual update
      await Promise.all([fetchUsers(), fetchPendingInvitations()]);
      setShowChangeRoleModal(false);
      setSelectedUser(null);
      setFormData({ email: "", full_name: "", role: "" });

      toast({
        title: "Success",
        description: "Role changed successfully",
      });
    } catch (error) {
      console.error("Change role error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to change role";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveRole = async (user: AdminUser, roleToRemove: string) => {
    if (!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only tenant administrators can remove user roles",
        variant: "destructive",
      });
      return;
    }

    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Remove Role?",
      text: `Remove ${getRoleDisplayName(roleToRemove)} role from ${
        user.full_name
      }?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);

      let userId = user.id;

      // If it's the placeholder tenant admin (id 0), find the real user
      if (userId === 0) {
        const userByEmail = await apiClient.request<AdminUser>(
          `/users/by-email/${user.email}`
        );
        userId = userByEmail.id;
      }

      const result = await apiClient.request<{ message?: string }>(
        `/user-roles/remove`,
        {
          method: "DELETE",
          body: JSON.stringify({
            user_id: userId,
            role: roleToRemove.toUpperCase(),
          }),
        }
      );

      // Refresh users list
      await Promise.all([fetchUsers(), fetchPendingInvitations()]);

      toast({
        title: "Success",
        description: result?.message || "Role removed successfully",
      });
    } catch (error) {
      console.error("Remove role error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to remove role";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvitation = async (invitationId: number) => {
    if (!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only tenant administrators can resend invitations",
        variant: "destructive",
      });
      return;
    }

    try {
      setResendingId(invitationId);
      await apiClient.request(`/invitations/${invitationId}/resend`, {
        method: "POST",
      });

      toast({
        title: "Success",
        description: "Invitation resent successfully",
      });
    } catch (error) {
      console.error("Resend invitation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to resend invitation";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setResendingId(null);
    }
  };

  const openAddRoleModal = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({ email: user.email, full_name: user.full_name, role: "" });
    setShowAddRoleModal(true);
  };

  const getAvailableRoles = (user: AdminUser) => {
    if (!user) return roles;
    const userRoles = user.role.split(", ").map(r => {
      const trimmed = r.trim().toLowerCase();
      // Map displayed role names to role values
      if (trimmed === 'hr admin') return 'hr_admin';
      if (trimmed === 'event admin') return 'event_admin';
      if (trimmed === 'mt admin') return 'mt_admin';
      return trimmed.replace(' ', '_');
    });
    return roles.filter(role => !userRoles.includes(role.value.toLowerCase()));
  };

  const handleAddRole = async () => {
    if (!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only tenant administrators can add user roles",
        variant: "destructive",
      });
      return;
    }

    if (!selectedUser || !formData.role) return;

    try {
      setSubmitting(true);

      let userId = selectedUser.id;

      // If it's the placeholder tenant admin (id 0), find the real user by email
      if (userId === 0) {
        const userByEmail = await apiClient.request<AdminUser>(
          `/users/by-email/${selectedUser.email}`
        );
        userId = userByEmail.id;
      }

      await apiClient.request(`/user-roles/`, {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          role: formData.role.toUpperCase(),
        }),
      });

      // Refresh users list
      await Promise.all([fetchUsers(), fetchPendingInvitations()]);
      setShowAddRoleModal(false);
      setSelectedUser(null);
      setFormData({ email: "", full_name: "", role: "" });

      toast({
        title: "Success",
        description: "Role added successfully",
      });
    } catch (error) {
      console.error("Add role error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add role";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveUser = async (user: AdminUser) => {
    if (!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only tenant administrators can remove users",
        variant: "destructive",
      });
      return;
    }

    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Remove User from Tenant?",
      text: `This will remove ${user.full_name} from this tenant and revoke all their roles. They will be assigned a Guest role. This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, remove user!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);

      await apiClient.request(`/user-roles/remove-user`, {
        method: "DELETE",
        body: JSON.stringify({
          user_id: user.id,
          tenant_id: tenantSlug,
        }),
      });

      // Refresh users list
      await Promise.all([fetchUsers(), fetchPendingInvitations()]);

      toast({
        title: "Success",
        description: "User removed from tenant successfully",
      });
    } catch (error) {
      console.error("Remove user error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to remove user";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    if (!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only tenant administrators can cancel invitations",
        variant: "destructive",
      });
      return;
    }

    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Cancel Invitation?",
      text: "This will cancel the invitation and cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, cancel it!",
      cancelButtonText: "Keep invitation",
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);

      await apiClient.request(`/invitations/${invitationId}/cancel`, {
        method: "DELETE",
      });

      // Refresh invitations list
      await fetchPendingInvitations();

      toast({
        title: "Success",
        description: "Invitation cancelled successfully",
      });
    } catch (error) {
      console.error("Cancel invitation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to cancel invitation";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const closeModals = (open?: boolean) => {
    if (open === false || open === undefined) {
      setShowInviteModal(false);
      setShowChangeRoleModal(false);
      setShowAddRoleModal(false);
      setSelectedUser(null);
      setFormData({ email: "", full_name: "", role: "" });
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      mt_admin: "MT Administrator",
      hr_admin: "HR Administrator",
      event_admin: "Event Administrator",
      staff: "Staff",
      guest: "Guest",
      GUEST: "Guest",
      TENANT_ADMIN: "Tenant Administrator",
      SUPER_ADMIN: "Super Administrator",
      super_admin: "Super Administrator",
    };
    return (
      roleMap[role] ||
      role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive) return "bg-red-100 text-red-800";
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (loading || authLoading) {
    return <LoadingScreen message="Loading admin users..." />;
  }

  return (
    <ProtectedRoute requireTenantAdmin={true}>
      <DashboardLayout>
      <div className="space-y-6">
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
              <p className="text-gray-600">
                Manage admin users for your organization
              </p>
            </div>
            <Button
              onClick={() => setShowInviteModal(true)}
              disabled={!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin"}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white h-9 px-4 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Invite Admin User
            </Button>
          </div>

          {pendingInvitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Invitations ({pendingInvitations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {invitation.full_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {invitation.email} •{" "}
                          {getRoleDisplayName(invitation.role)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Expires:{" "}
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleResendInvitation(invitation.id)}
                          disabled={resendingId === invitation.id || (!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin")}
                          variant="outline"
                          size="sm"
                        >
                          {resendingId === invitation.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                          {resendingId === invitation.id
                            ? "Sending..."
                            : "Resend"}
                        </Button>
                        <Button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          disabled={resendingId === invitation.id || (!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin")}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            No admin users found
                          </div>
                          <div className="text-xs text-gray-500">
                            Invite your first admin user to get started
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                              <Users className="w-3 h-3 text-blue-700" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.full_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.role.split(", ").map((role, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs flex items-center gap-1 pr-1"
                              >
                                {getRoleDisplayName(role.trim())}
                                {user.id !== 0 &&
                                  role.trim() !== "TENANT_ADMIN" &&
                                  role.trim() !== "GUEST" &&
                                  (isTenantAdmin || user?.role === "SUPER_ADMIN" || user?.role === "super_admin") && (
                                    <button
                                      onClick={() =>
                                        handleRemoveRole(user, role.trim())
                                      }
                                      className="ml-1 text-red-500 hover:text-red-700 text-xs"
                                      title="Remove role"
                                    >
                                      ×
                                    </button>
                                  )}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`text-xs ${getStatusColor(
                              user.status,
                              user.is_active
                            )}`}
                          >
                            {user.is_active ? user.status : "INACTIVE"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {user.last_login
                              ? new Date(user.last_login).toLocaleDateString()
                              : "Never"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!isTenantAdmin && user?.role !== "SUPER_ADMIN" && user?.role !== "super_admin"}
                                className="h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-300 focus:outline-none"
                                aria-label="User actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 bg-white border border-gray-200 shadow-lg rounded-md"
                              sideOffset={5}
                            >
                              <DropdownMenuItem
                                onClick={() => openAddRoleModal(user)}
                                className="gap-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                                Add Role
                              </DropdownMenuItem>
                              {user.id !== 0 &&
                                !user.role.includes("TENANT_ADMIN") && (
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveUser(user)}
                                    className="gap-2 hover:bg-red-50 cursor-pointer text-red-600"
                                  >
                                    <UserMinus className="w-4 h-4" />
                                    Remove User
                                  </DropdownMenuItem>
                                )}
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
        </div>

        <Dialog
          open={showInviteModal}
          onOpenChange={(open) => {
            if (!open) closeModals(open);
          }}
        >
          <DialogContent className="bg-white border border-gray-200 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                Invite Admin User
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 bg-white">
              <div>
                <Label htmlFor="email" className="text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email address"
                  className="mt-2 bg-white border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="full_name" className="text-gray-700">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Enter full name"
                  className="mt-2 bg-white border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="role" className="text-gray-700">
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="mt-2 bg-white border-gray-300">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {roles.map((role) => (
                      <SelectItem
                        key={role.value}
                        value={role.value}
                        className="hover:bg-gray-50"
                      >
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="bg-white">
              <Button
                variant="outline"
                onClick={() => closeModals()}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInviteUser}
                disabled={
                  submitting ||
                  !formData.email.trim() ||
                  !formData.full_name.trim() ||
                  !formData.role
                }
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showAddRoleModal}
          onOpenChange={(open) => {
            if (!open) closeModals(open);
          }}
        >
          <DialogContent className="bg-white border border-gray-200 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                Add Role to User
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 bg-white">
              <div>
                <Label className="text-gray-700">User</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {selectedUser?.full_name}
                  </p>
                  <p className="text-sm text-gray-600">{selectedUser?.email}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="add_role" className="text-gray-700">
                  Additional Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="mt-2 bg-white border-gray-300">
                    <SelectValue placeholder="Select role to add" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {getAvailableRoles(selectedUser).map((role) => (
                      <SelectItem
                        key={role.value}
                        value={role.value}
                        className="hover:bg-gray-50"
                      >
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="bg-white">
              <Button
                variant="outline"
                onClick={() => closeModals()}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddRole}
                disabled={submitting || !formData.role}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Role"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showChangeRoleModal}
          onOpenChange={(open) => {
            if (!open) closeModals(open);
          }}
        >
          <DialogContent className="bg-white border border-gray-200 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                Change User Role
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 bg-white">
              <div>
                <Label className="text-gray-700">User</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {selectedUser?.full_name}
                  </p>
                  <p className="text-sm text-gray-600">{selectedUser?.email}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="new_role" className="text-gray-700">
                  New Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="mt-2 bg-white border-gray-300">
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {roles.map((role) => (
                      <SelectItem
                        key={role.value}
                        value={role.value}
                        className="hover:bg-gray-50"
                      >
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="bg-white">
              <Button
                variant="outline"
                onClick={() => closeModals()}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangeRole}
                disabled={
                  submitting ||
                  !formData.role ||
                  formData.role === selectedUser?.role
                }
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Change Role"
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
