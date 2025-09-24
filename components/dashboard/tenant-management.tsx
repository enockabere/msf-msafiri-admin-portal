"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { Tenant } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Building2, Loader2 } from "lucide-react";
import { EditTenantModal } from "./EditTenantModal";
import { TenantTable } from "./tenant-table";
import { toast } from "@/hooks/use-toast";

interface TenantManagementProps {
  filter: "all" | "active" | "inactive";
  onTenantUpdate: () => void;
}

export default function TenantManagement({
  filter,
  onTenantUpdate,
}: TenantManagementProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { tenants, loading, error, refreshTenants } = useTenant();
  const { apiClient } = useAuthenticatedApi();
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [, setActionLoading] = useState<string | null>(null);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [superAdminCount, setSuperAdminCount] = useState(0);
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [superAdmins, userRoles] = await Promise.all([
          apiClient.getSuperAdmins(),
          user?.id ? apiClient.request<{ role: string }[]>(`/user-roles/user/${user.id}`).catch(() => []) : Promise.resolve([])
        ]);
        setSuperAdminCount(superAdmins.length);
        
        // Extract role names and include primary role
        const roles = userRoles.map(r => r.role);
        if (user?.role) {
          roles.push(user.role);
        }
        setCurrentUserRoles([...new Set(roles)]); // Remove duplicates
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    if (user?.id) {
      fetchData();
    }
  }, [apiClient, user?.id, user?.role]);

  // Filter tenants based on the filter prop
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      if (filter === "active") return tenant.is_active;
      if (filter === "inactive") return !tenant.is_active;
      return true; // "all"
    });
  }, [tenants, filter]);

  const handleActivate = async (tenant: Tenant) => {
    try {
      setActionLoading(`activate-${tenant.id}`);
      await apiClient.activateTenant(tenant.id);
      toast({
        title: "Success",
        description: `${tenant.name} has been activated.`,
      });
      refreshTenants();
      onTenantUpdate();
    } catch {
      toast({
        title: "Error",
        description: "Failed to activate tenant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (tenant: Tenant) => {
    try {
      setActionLoading(`deactivate-${tenant.id}`);
      await apiClient.deactivateTenant(tenant.id);
      toast({
        title: "Success",
        description: `${tenant.name} has been deactivated.`,
      });
      refreshTenants();
      onTenantUpdate();
    } catch  {
      toast({
        title: "Error",
        description: "Failed to deactivate tenant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewTenant = (tenant: Tenant) => {
    setNavigationLoading(true);
    localStorage.setItem('selectedTenantId', tenant.id.toString());
    localStorage.setItem('selectedTenantSlug', tenant.slug);
    router.push(`/tenant/${tenant.slug}/dashboard`);
  };

  const handleEditSuccess = () => {
    setEditingTenant(null);
    refreshTenants();
    onTenantUpdate();
  };

  if (loading && tenants.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={refreshTenants} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (filteredTenants.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No {filter === "all" ? "" : filter} tenants found
        </h3>
        <p className="text-gray-600">
          {filter === "all"
            ? "No tenants have been created yet."
            : `No ${filter} tenants found.`}
        </p>
      </div>
    );
  }

  return (
    <>
      <TenantTable
        data={filteredTenants}
        loading={loading}
        onEdit={setEditingTenant}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onViewTenant={handleViewTenant}
        currentUserEmail={user?.email || undefined}
        currentUserRoles={currentUserRoles}
        superAdminCount={superAdminCount}
        navigationLoading={navigationLoading}
      />

      {/* Edit Modal */}
      <EditTenantModal
        tenant={editingTenant}
        open={!!editingTenant}
        onClose={() => setEditingTenant(null)}
        onSuccess={handleEditSuccess}
      />


    </>
  );
}