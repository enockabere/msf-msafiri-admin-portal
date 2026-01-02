"use client";

import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import EnhancedStatsCards from "./enhanced-stats-cards";
import SuperAdminManagement from "./super-admin-management";
import TenantManagement from "./tenant-management";
import PendingInvitations from "./pending-invitations";
import { TabLoading } from "@/components/ui/tab-loading";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface DashboardContentProps {
  activeTenants: number;
  totalTenants: number;
  inactiveTenants: number;
  selectedCard: string | null;
  currentView: 'active' | 'total' | 'inactive' | 'super-admins' | 'pending-invitations' | 'all';
  loading: boolean;
  error: string | null;
  onCardClick: (type: 'active' | 'total' | 'inactive' | 'super-admins' | 'pending-invitations' | 'all') => void;
  onRefresh: () => void;
  onTenantUpdate: () => void;
  tabLoading?: boolean;
}

export function DashboardContent({
  activeTenants,
  totalTenants,
  inactiveTenants,
  selectedCard,
  currentView,
  loading,
  error,
  onCardClick,
  onRefresh,
  onTenantUpdate,
  tabLoading = false,
}: DashboardContentProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';
  return (
    <>
      {/* Enhanced Stats Cards */}
      <EnhancedStatsCards
        activeTenants={activeTenants}
        totalTenants={totalTenants}
        inactiveTenants={inactiveTenants}
        onCardClick={onCardClick}
        selectedCard={selectedCard}
        loading={loading}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-red-100 flex-shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
              <div className="ml-3 min-w-0">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading tenants
                </h3>
                <p className="text-sm text-red-600 truncate">{error}</p>
              </div>
            </div>
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50 w-full sm:w-auto flex-shrink-0"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && totalTenants === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {/* Dynamic Content Based on Selected Card */}
      {tabLoading ? (
        <TabLoading />
      ) : (
        <div className="rounded-lg border shadow-sm p-6" style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
          borderColor: isDark ? '#333333' : '#e5e7eb'
        }}>
          <div className="mb-6">
            <h2 className="card-title mb-2" style={{ color: isDark ? '#ffffff' : '#111827' }}>
              {currentView === 'super-admins'
                ? 'Super Administrator Management'
                : currentView === 'pending-invitations'
                ? 'Pending Super Admin Invitations'
                : currentView === 'active'
                ? 'Active Tenants'
                : currentView === 'inactive'
                ? 'Inactive Tenants'
                : 'All Tenants'
              }
            </h2>
            <p className="card-subtitle" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
              {currentView === 'super-admins'
                ? 'Manage super administrator accounts and permissions'
                : currentView === 'pending-invitations'
                ? 'View and manage pending super admin invitations'
                : `Showing ${currentView === 'all' ? 'all' : currentView} tenant organizations`
              }
            </p>
          </div>

          {currentView === 'super-admins' ? (
            <SuperAdminManagement />
          ) : currentView === 'pending-invitations' ? (
            <PendingInvitations />
          ) : (
            <TenantManagement
              filter={currentView === 'active' ? 'active' : currentView === 'inactive' ? 'inactive' : 'all'}
              onTenantUpdate={onTenantUpdate}
            />
          )}
        </div>
      )}
    </>
  );
}