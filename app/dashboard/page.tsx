"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import StatsCards from "@/components/dashboard/stats-cards";
import RecentActivities from "@/components/dashboard/recent-activities";
import QuickActions from "@/components/dashboard/quick-actions";
import { useAuth, AuthUtils } from "@/lib/auth";

// Loading component
function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}

// Unauthorized access component
function UnauthorizedAccess() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
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
  const router = useRouter();

  // Handle authentication and authorization
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.push("/login?redirect=/dashboard");
        return;
      }

      if (!isAdmin) {
        // Don't redirect, just show unauthorized message
        // The UnauthorizedAccess component will handle this
        return;
      }
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  // Show loading state
  if (loading) {
    return <DashboardLoading />;
  }

  // Show unauthorized if not authenticated (while redirect happens)
  if (!isAuthenticated) {
    return <DashboardLoading />; // Show loading while redirecting
  }

  // Show unauthorized if not admin
  if (!isAdmin) {
    return <UnauthorizedAccess />;
  }

  // Render dashboard for authorized admin users
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome header with user info */}
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
            </div>
            <div className="flex items-center space-x-3">
              {user?.role && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${AuthUtils.getRoleColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              )}
              {user?.firstLogin && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  First Login
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <StatsCards />
        <RecentActivities />
        <QuickActions />

        {/* First login welcome message */}
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
