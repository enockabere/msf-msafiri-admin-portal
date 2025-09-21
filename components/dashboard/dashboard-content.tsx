"use client";

import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import EnhancedStatsCards from "./enhanced-stats-cards";
import SuperAdminManagement from "./super-admin-management";
import TenantManagement from "./tenant-management";
import PendingInvitations from "./pending-invitations";
import { TabLoading } from "@/components/ui/tab-loading";

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
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="mb-6">
            <h2 className="card-title mb-2">
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
            <p className="card-subtitle text-gray-600">
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

      {/* Empty State */}
      {!loading && totalTenants === 0 && !error && (
        <div className="text-center py-8 sm:py-12">
          <div className="max-w-md mx-auto px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No Tenants Yet
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Get started by adding your first tenant organization to the system.
            </p>
          </div>
        </div>
      )}
    </>
  );
}