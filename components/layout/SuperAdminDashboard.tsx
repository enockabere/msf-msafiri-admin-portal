"use client";

import { useState } from "react";
import { useAuth, AuthUtils } from "@/lib/auth";
import { useTenant } from "@/context/TenantContext";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { SuperAdminNavbar } from "./SuperAdminNavbar";
import { TenantCard } from "../dashboard/TenantCard";
import { SuperAdminProfile } from "@/components/SuperAdminProfile";
import { AddTenantModal } from "../dashboard/AddTenantModal";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Users, Settings } from "lucide-react";
import { SuperAdminFooter } from "./SuperAdminFooter";
import type { AuthUser } from "@/types/auth";

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const { tenants, loading, error, refreshTenants } = useTenant();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const activeTenants = tenants.filter((t) => t.is_active);
  const inactiveTenants = tenants.filter((t) => !t.is_active);

  // Type-safe user casting
  const typedUser = user as AuthUser | null;

  // Show loading if user is not loaded yet
  if (!typedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SuperAdminNavbar
        user={typedUser}
        onProfileClick={() => setShowProfile(true)}
      />

      <main className="container mx-auto px-6 py-8">
        <SessionTimeoutWarning warningMinutes={5} sessionDurationMinutes={30} />

        {/* Welcome Header */}
        <div className="bg-white rounded-xl shadow-lg border p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {typedUser.name || typedUser.email}!
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Role: {AuthUtils.getRoleDisplayName(typedUser.role)}
              </p>
              <p className="text-gray-500 mt-1">
                Manage all tenant organizations from this central dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowProfile(true)}
                variant="outline"
                className="border-gray-300"
                style={{ userSelect: "none" }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r text-white from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 select-none cursor-pointer"
                style={{ userSelect: "none" }}
              >
                <Plus className="w-4 h-4 mr-2 pointer-events-none" />
                <span className="pointer-events-none">Add Tenant</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Tenants
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenants.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Tenants
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeTenants.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <Building2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Inactive Tenants
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {inactiveTenants.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-red-100">
                  <Building2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading tenants
                  </h3>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
              <Button
                onClick={refreshTenants}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && tenants.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-lg border p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Tenants Section */}
        {activeTenants.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Active Tenants
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTenants.map((tenant) => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  onEdit={() => {
                    /* Handle edit */
                  }}
                  onToggleStatus={refreshTenants}
                  onManage={() => {
                    /* Handle manage */
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Inactive Tenants Section */}
        {inactiveTenants.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Inactive Tenants
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Offline</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inactiveTenants.map((tenant) => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  onEdit={() => {
                    /* Handle edit */
                  }}
                  onToggleStatus={refreshTenants}
                  onManage={() => {
                    /* Handle manage */
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && tenants.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Building2 className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Tenants Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by adding your first tenant organization to the
                system.
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Tenant
              </Button>
            </div>
          </div>
        )}
      </main>

      <SuperAdminFooter />

      {/* Modals */}
      <AddTenantModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          refreshTenants();
        }}
      />

      <SuperAdminProfile
        open={showProfile}
        onClose={() => setShowProfile(false)}
        user={typedUser}
      />
    </div>
  );
}
