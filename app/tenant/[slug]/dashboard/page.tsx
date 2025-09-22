"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { Tenant } from "@/lib/api";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Calendar, 
  Shield,
  Loader2,
  AlertCircle
} from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading";

export default function TenantDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeEvents: number;
    totalRoles: number;
    totalVisitors: number;
    tenantStatus: string;
    trends: {
      usersChange: number;
      eventsChange: number;
      rolesChange: number;
      visitorsChange: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantSlug = params.slug as string;

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setLoading(true);
        const tenants = await apiClient.getTenants();
        const foundTenant = tenants.find(t => t.slug === tenantSlug);
        
        if (!foundTenant) {
          setError("Tenant not found");
          return;
        }

        if (foundTenant.admin_email !== user?.email) {
          setError("You don't have access to this tenant");
          return;
        }

        setTenant(foundTenant);
        
        // Fetch tenant statistics
        try {
          const tenantStats = await apiClient.getTenantStats(tenantSlug);
          setStats(tenantStats);
        } catch {
          // Stats loading failed, but don't block the page
          setStats({
            totalUsers: 0,
            activeEvents: 0,
            totalRoles: 0,
            totalVisitors: 0,
            tenantStatus: "Unknown",
            trends: {
              usersChange: 0,
              eventsChange: 0,
              rolesChange: 0,
              visitorsChange: 0
            }
          });
        }
      } catch {
        setError("Failed to load tenant information");
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchTenant();
    }
  }, [tenantSlug, user?.email, apiClient]);

  const handleBackToDashboard = () => {
    setNavigationLoading(true);
    router.push("/dashboard");
  };

  if (loading) {
    return <LoadingScreen message="Loading tenant dashboard..." />;
  }

  if (error || !tenant) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleBackToDashboard} variant="outline" disabled={navigationLoading}>
              {navigationLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowLeft className="w-4 h-4 mr-2" />
              )}
              {navigationLoading ? "Loading..." : "Back to Dashboard"}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleBackToDashboard} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              disabled={navigationLoading}
            >
              {navigationLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
              {navigationLoading ? "Loading..." : "Back to Super Admin"}
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={tenant.is_active ? "default" : "secondary"}
                    className={tenant.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                  >
                    {tenant.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-gray-500">• {tenant.slug}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tenant Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Tenant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Organization Name</label>
                <p className="text-sm text-gray-900">{tenant.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Slug</label>
                <p className="text-sm text-gray-900">{tenant.slug}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Email</label>
                <p className="text-sm text-gray-900">{tenant.contact_email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Admin Email</label>
                <p className="text-sm text-gray-900">{tenant.admin_email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={tenant.is_active ? "default" : "secondary"}
                    className={tenant.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                  >
                    {tenant.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Domain</label>
                <p className="text-sm text-gray-900">{tenant.domain || "Not configured"}</p>
              </div>
              {tenant.description && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-900">{tenant.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  {stats?.trends && (
                    <p className={`text-xs ${stats.trends.usersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.trends.usersChange >= 0 ? '+' : ''}{stats.trends.usersChange} from last month
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-green-100">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeEvents || 0}</p>
                  {stats?.trends && (
                    <p className={`text-xs ${stats.trends.eventsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.trends.eventsChange >= 0 ? '+' : ''}{stats.trends.eventsChange} from last month
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/tenant/${tenantSlug}/admin-roles`)}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Roles</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalRoles || 0}</p>
                  {stats?.trends && (
                    <p className={`text-xs ${stats.trends.rolesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.trends.rolesChange >= 0 ? '+' : ''}{stats.trends.rolesChange} from last month
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalVisitors || 0}</p>
                  {stats?.trends && (
                    <p className={`text-xs ${stats.trends.visitorsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.trends.visitorsChange >= 0 ? '+' : ''}{stats.trends.visitorsChange} from last month
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Welcome Message */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to {tenant.name} Dashboard
              </h3>
              <p className="text-gray-600 mb-4">
                You are now viewing the tenant-specific dashboard. This is where you can manage 
                users, events, and other tenant-specific operations.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This is a basic tenant dashboard view. Additional features 
                  like user management, event management, and analytics will be available here 
                  based on your tenant&apos;s configuration and permissions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}