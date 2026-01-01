"use client";

import { useEffect, useState, useCallback } from "react";
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
  Loader2,
  AlertCircle,
  UserPlus,
  Hotel,
  Coins,
  Bell,
  Activity,
  Clock,
} from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading";

export default function TenantDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeEvents: 0,
    totalVisitors: 0,
    totalInventory: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string | number;
    type?: string;
    description: string;
    user_name?: string;
    created_at: string;
    status?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [cardNavigating, setCardNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantSlug = params.slug as string;
  const isVettingOnlyUser = () => {
    if (!user) return false;
    
    // Check if user has admin roles
    const adminRoles = ['SUPER_ADMIN', 'MT_ADMIN', 'HR_ADMIN', 'EVENT_ADMIN'];
    const hasAdminRole = adminRoles.includes(user.role) || 
      (user.all_roles && user.all_roles.some((role: string) => adminRoles.includes(role)));
    
    // Check if user has vetting roles
    const vettingRoles = ['VETTING_COMMITTEE', 'VETTING_APPROVER'];
    const hasVettingRole = vettingRoles.includes(user.role) ||
      (user.all_roles && user.all_roles.some((role: string) => vettingRoles.includes(role)));
    
    // Return true if user has vetting roles but no admin roles
    return hasVettingRole && !hasAdminRole;
  };

  // Redirect vetting-only users to events page
  useEffect(() => {
    if (user && isVettingOnlyUser() && !loading) {
      router.replace(`/tenant/${tenantSlug}/events`);
    }
  }, [user, loading, router, tenantSlug]);

  const fetchRecentActivities = useCallback(async () => {
    try {
      // Use notifications as activities since activities endpoint doesn't exist
      const notificationsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/?limit=3`,
        {
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (notificationsResponse.ok) {
        const notifications = await notificationsResponse.json();
        // Transform notifications to activity format
        const activities = notifications.map((notif: { id: string | number; message?: string; title?: string; triggered_by?: string; created_at: string; is_read: boolean }) => ({
          id: notif.id,
          type: "notification",
          description: notif.message || notif.title,
          user_name: notif.triggered_by || "System",
          created_at: notif.created_at,
          status: notif.is_read ? "completed" : "pending",
        }));
        setRecentActivities(activities);
      } else {
        // Fallback activities
        setRecentActivities([
          {
            id: 1,
            type: "user_login",
            description: "User logged in",
            user_name: user?.name || "System User",
            created_at: new Date().toISOString(),
            status: "completed",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      setRecentActivities([]);
    }
  }, [apiClient, user]);

  const fetchStats = useCallback(async (foundTenant: Tenant) => {
    try {
      let totalUsers = 1;
      let activeEvents = 0;
      let totalVisitors = 0;
      let totalInventory = 0;

      // Get users count filtered by current tenant
      try {
        const users = await apiClient.getUsers(foundTenant.slug);
        // Additional filtering to ensure we only count users for this specific tenant
        const tenantUsers = users.filter(user => 
          user.tenant_id === foundTenant.slug || 
          user.tenant_id === foundTenant.id.toString() ||
          user.tenant_id === tenantSlug
        );
        totalUsers = tenantUsers.length;
        // Debug: Found users for tenant
      } catch (e: unknown) {
        console.error("Error fetching users:", e);
        totalUsers = 0;
      }

      // Get events and visitors count
      try {
        const eventsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/`,
          {
            headers: {
              Authorization: `Bearer ${apiClient.getToken()}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (eventsResponse.ok) {
          interface Event {
            id: string | number;
            tenant_id: string | number;
            [key: string]: unknown;
          }

          const events: Event[] = await eventsResponse.json();
          const tenantEvents: Event[] = events.filter(
            (e: Event) =>
              e.tenant_id === foundTenant.id ||
              e.tenant_id === tenantSlug ||
              e.tenant_id === user?.tenantId
          );
          activeEvents = tenantEvents.length;

          // Count participants
          for (const event of tenantEvents) {
            try {
              const participantsResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${event.id}/participants/`,
                {
                  headers: {
                    Authorization: `Bearer ${apiClient.getToken()}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              if (participantsResponse.ok) {
                const participants = await participantsResponse.json();
                totalVisitors += participants.length;
              }
            } catch (e) {
              console.error(`Error fetching participants:`, e);
            }
          }
        }
      } catch (e) {
        console.error("Error fetching events:", e);
      }

      // Get inventory count
      try {
        const inventoryResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/inventory?tenant=${tenantSlug}`,
          {
            headers: {
              Authorization: `Bearer ${apiClient.getToken()}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (inventoryResponse.ok) {
          const inventory = await inventoryResponse.json();
          totalInventory = inventory.length;
        }
      } catch (e) {
        console.error("Error fetching inventory:", e);
      }

      setStats({ totalUsers, activeEvents, totalVisitors, totalInventory });
      await fetchRecentActivities();
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({
        totalUsers: 0,
        activeEvents: 0,
        totalVisitors: 0,
        totalInventory: 0,
      });
      setRecentActivities([]);
    }
  }, [apiClient, tenantSlug, user?.tenantId, fetchRecentActivities]);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setLoading(true);

        // Fetch tenant information
        let foundTenant;
        try {
          // Try the specific tenant endpoint first
          const tenantResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/${tenantSlug}`,
            {
              headers: {
                Authorization: `Bearer ${apiClient.getToken()}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (tenantResponse.ok) {
            foundTenant = await tenantResponse.json();
          } else {
            // Fallback: try to get from all tenants
            const allTenantsResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/`,
              {
                headers: {
                  Authorization: `Bearer ${apiClient.getToken()}`,
                  "Content-Type": "application/json",
                },
              }
            );
            if (allTenantsResponse.ok) {
              const allTenants = await allTenantsResponse.json();
              foundTenant = allTenants.find((t: { slug: string }) => t.slug === tenantSlug);
            }
            
            if (!foundTenant) {
              throw new Error("Tenant not found");
            }
          }
        } catch (error) {
          console.error("Error fetching tenant:", error);
          // Create fallback tenant object based on user's tenant
          if (user?.tenantId === tenantSlug) {
            foundTenant = {
              id: user?.tenantId || tenantSlug,
              name: `Organization ${
                tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1)
              }`,
              slug: tenantSlug,
              contact_email: user?.email || "contact@example.com",
              admin_email: user?.email || "admin@example.com",
              is_active: true,
              domain: null,
              description: `Dashboard for ${tenantSlug} organization`,
              created_at: new Date().toISOString(),
            };
          } else {
            throw new Error("Access denied: You don't have permission to view this tenant");
          }
        }

        setTenant(foundTenant);

        // Fetch statistics
        await fetchStats(foundTenant);
      } catch (error) {
        console.error("Error in tenant dashboard:", error);
        setError("Failed to load tenant information");
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchTenant();
    }
  }, [tenantSlug, user?.email, user?.tenantId, apiClient, fetchStats]);

  const handleBackToDashboard = () => {
    setNavigationLoading(true);
    router.push("/dashboard");
  };

  const handleCardClick = (path: string | null) => {
    if (path) {
      setCardNavigating(true);
      router.push(path);
    } else {
      alert("Feature coming soon!");
    }
  };

  if (loading || (user && isVettingOnlyUser())) {
    return <LoadingScreen message={(user && isVettingOnlyUser()) ? "Redirecting to events..." : "Loading tenant dashboard..."} />;
  }

  if (cardNavigating) {
    return <LoadingScreen message="Loading page..." />;
  }

  if (error || !tenant) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={handleBackToDashboard}
              variant="outline"
              disabled={navigationLoading}
            >
              {navigationLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowLeft className="w-4 h-4 mr-2" />
              )}
              Back to Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const quickActions = [
    {
      title: "Manage Users",
      description: `${stats.totalUsers} users in ${tenant.name}`,
      icon: UserPlus,
      path: `/tenant/${tenantSlug}/admin-users`,
      color: "blue",
      enabled: tenant?.admin_email === user?.email || user?.role?.toLowerCase() === "super_admin" || user?.tenantId === tenantSlug,
    },
    {
      title: "Manage Events",
      description: `${stats.activeEvents} active events`,
      icon: Calendar,
      path: `/tenant/${tenantSlug}/events`,
      color: "green",
      enabled: true,
    },
    {
      title: "Accommodation",
      description: "Manage guesthouses & rooms",
      icon: Hotel,
      path: `/tenant/${tenantSlug}/accommodation`,
      color: "orange",
      enabled: true,
    },
    {
      title: "Inventory Setup",
      description: `${stats.totalInventory} items available`,
      icon: Coins,
      path: `/tenant/${tenantSlug}/inventory`,
      color: "purple",
      enabled: true,
    },
    {
      title: "Travel Requirements Setup",
      description: "Manage travel requirements",
      icon: AlertCircle,
      path: `/tenant/${tenantSlug}/travel-requirements`,
      color: "indigo",
      enabled: true,
    },
    {
      title: "Transport Setup",
      description: "Manage transport settings",
      icon: Users,
      path: `/tenant/${tenantSlug}/transport-setup`,
      color: "blue",
      enabled: true,
    },
    {
      title: "News & Updates",
      description: "Latest news & announcements",
      icon: Bell,
      path: `/tenant/${tenantSlug}/news-updates`,
      color: "red",
      enabled: true,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {user?.role?.toLowerCase() === "super_admin" && (
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
                Back to Super Admin
              </Button>
            )}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {tenant.name}
                </h1>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={tenant.is_active ? "default" : "secondary"}
                    className={
                      tenant.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }
                  >
                    {tenant.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-gray-500">{tenant.slug}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.filter(action => action.enabled).map((action, index) => {
            const Icon = action.icon;
            const colorClasses = {
              blue: "bg-blue-500 hover:bg-blue-600 text-blue-600",
              green: "bg-green-500 hover:bg-green-600 text-green-600",
              orange: "bg-orange-500 hover:bg-orange-600 text-orange-600",
              purple: "bg-purple-500 hover:bg-purple-600 text-purple-600",
              indigo: "bg-indigo-500 hover:bg-indigo-600 text-indigo-600",
              red: "bg-red-500 hover:bg-red-600 text-red-600",
            };

            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-6 justify-start hover:shadow-md transition-all duration-200 border-2 hover:border-gray-300"
                onClick={() => handleCardClick(action.path)}
                disabled={cardNavigating}
              >
                <div
                  className={`p-3 rounded-lg text-white ${
                    colorClasses[
                      action.color as keyof typeof colorClasses
                    ].split(" ")[0]
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4 text-left">
                  <div className="font-medium text-sm text-gray-900">
                    {action.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent activities
                </div>
              ) : (
                recentActivities.map((activity, index) => (
                  <div
                    key={activity.id || index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900 capitalize">
                          {activity.type?.replace("_", " ") ||
                            "System Activity"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {activity.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={
                          activity.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : activity.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {activity.status || "Active"}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {activity.created_at
                          ? new Date(activity.created_at).toLocaleDateString()
                          : "Today"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tenant Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Organization Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Organization Name
                </label>
                <p className="text-xs text-gray-900">{tenant.name}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Contact Email
                </label>
                <p className="text-xs text-gray-900">{tenant.contact_email}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Status
                </label>
                <Badge
                  className={
                    tenant.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }
                >
                  {tenant.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Domain
                </label>
                <p className="text-xs text-gray-900">
                  {tenant.domain || "Not configured"}
                </p>
              </div>
              {tenant.description && (
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-500">
                    Description
                  </label>
                  <div
                    className="text-xs text-gray-900 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: tenant.description
                        .replace(/\s*data-start="[^"]*"/g, '')
                        .replace(/\s*data-end="[^"]*"/g, '')
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
