"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import StatsCards from "@/components/dashboard/stats-cards";
import RecentActivities from "@/components/dashboard/recent-activities";
import QuickActions from "@/components/dashboard/quick-actions";
import { useAuth, AuthUtils } from "@/lib/auth";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { TenantSelector } from "@/components/TenantSelector";
import { useTenant } from "@/context/TenantContext";
import SuperAdminDashboard from "@/components/layout/SuperAdminDashboard";

import { LoadingScreen } from "@/components/ui/loading";

function DashboardLoading() {
  return <LoadingScreen message="Loading dashboard..." />;
}

function UnauthorizedAccess() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto p-6 bg-white/90 backdrop-blur-sm border shadow-xl rounded-lg">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-10 h-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don&#39;t have permission to access the admin dashboard. Please
            contact your administrator if you believe this is an error.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();
  const { selectedTenant, isAllTenantsSelected } = useTenant();
  const router = useRouter();



  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Redirect non-super-admin users to their tenant dashboard
      if (user.role !== "super_admin" && user.tenantId) {

        router.push(`/tenant/${user.tenantId}/dashboard`);
        return;
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return <DashboardLoading />;
  }

  if (!isAuthenticated) {
    return <DashboardLoading />;
  }

  // Only show unauthorized for non-admin users, but allow tenant admins to be redirected
  if (!isAdmin && user?.role !== "hr_admin" && user?.role !== "mt_admin" && user?.role !== "event_admin") {
    return <UnauthorizedAccess />;
  }

  // If user is a tenant admin but not super admin, they should be redirected (handled in useEffect)
  if (user?.role !== "super_admin" && user?.tenantId) {
    return <DashboardLoading />; // Show loading while redirecting
  }

  // Check if user is super admin
  const isSuperAdmin = user?.role === "super_admin";

  // Super admins get the specialized dashboard
  if (isSuperAdmin) {

    return <SuperAdminDashboard />;
  }



  // Regular admins get the traditional dashboard with sidebar
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SessionTimeoutWarning warningMinutes={5} sessionDurationMinutes={30} />



        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name || user?.email}!
              </h1>
              <p className="text-gray-600 mt-1">
                Role:{" "}
                {user?.role
                  ? AuthUtils.getRoleDisplayName(user.role)
                  : "Unknown"}
              </p>
              {(selectedTenant || isAllTenantsSelected) && (
                <p className="text-sm text-indigo-600 mt-1">
                  {isAllTenantsSelected
                    ? "Viewing: All Tenants"
                    : `Active Tenant: ${selectedTenant?.name}`}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === "super_admin" && <TenantSelector />}

              <div className="flex items-center space-x-3">
                {user?.firstLogin && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    First Login
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <StatsCards />
        <RecentActivities />
        <QuickActions />

        {user?.firstLogin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  Welcome to MSF Msafiri!
                </h3>
                <p className="text-blue-700 mt-1">
                  This is your first time logging in. Take a moment to explore
                  the admin dashboard and familiarize yourself with the
                  available features.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
