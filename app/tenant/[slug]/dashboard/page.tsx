"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { Tenant } from "@/lib/api";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

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
        {/* Quick Actions - Stats Cards */}
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: isDark ? '#ffffff' : '#111827' }}>Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Manage Users */}
            {(tenant?.admin_email === user?.email || user?.role?.toLowerCase() === "super_admin" || user?.tenantId === tenantSlug) && (
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                style={{
                  backgroundColor: isDark ? '#000000' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#fecaca'
                }}
                onClick={() => handleCardClick(`/tenant/${tenantSlug}/admin-users`)}
              >
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Users</h3>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#1a1a1a' : '#fef2f2' }}>
                        <UserPlus className="h-4 w-4" style={{ color: isDark ? '#f87171' : '#dc2626' }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                        +{stats.totalUsers > 0 ? '1' : '0'} from last month
                      </div>
                      <div className="text-2xl font-bold" style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                        {stats.totalUsers}
                      </div>
                      <div className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                        Users in {tenant.name}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Manage Events */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
              style={{
                backgroundColor: isDark ? '#000000' : '#ffffff',
                borderColor: isDark ? '#374151' : '#fecaca'
              }}
              onClick={() => handleCardClick(`/tenant/${tenantSlug}/events`)}
            >
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Active Events</h3>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#1a1a1a' : '#fef2f2' }}>
                      <Calendar className="h-4 w-4" style={{ color: isDark ? '#f87171' : '#dc2626' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      +{stats.activeEvents > 0 ? '1' : '0'} from last month
                    </div>
                    <div className="text-2xl font-bold" style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                      {stats.activeEvents}
                    </div>
                    <div className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                      Events currently active
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Inventory */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
              style={{
                backgroundColor: isDark ? '#000000' : '#ffffff',
                borderColor: isDark ? '#374151' : '#fecaca'
              }}
              onClick={() => handleCardClick(`/tenant/${tenantSlug}/inventory`)}
            >
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Inventory Items</h3>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#1a1a1a' : '#fef2f2' }}>
                      <Coins className="h-4 w-4" style={{ color: isDark ? '#f87171' : '#dc2626' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      +{stats.totalInventory > 0 ? '1' : '0'} from last month
                    </div>
                    <div className="text-2xl font-bold" style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                      {stats.totalInventory}
                    </div>
                    <div className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                      Items available
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activities */}
        <Card 
          className="border-2"
          style={{
            backgroundColor: isDark ? '#000000' : '#ffffff',
            borderColor: isDark ? '#374151' : '#e5e7eb'
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: isDark ? '#ffffff' : '#111827' }}>
              <Clock className="w-5 h-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  No recent activities
                </div>
              ) : (
                recentActivities.map((activity, index) => (
                  <div
                    key={activity.id || index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    style={{
                      backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                      borderColor: isDark ? '#374151' : '#e5e7eb'
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: isDark ? '#1e3a8a' : '#dbeafe'
                        }}
                      >
                        <Activity className="h-4 w-4" style={{ color: isDark ? '#60a5fa' : '#2563eb' }} />
                      </div>
                      <div>
                        <div className="font-medium text-sm capitalize" style={{ color: isDark ? '#ffffff' : '#111827' }}>
                          {activity.type?.replace("_", " ") ||
                            "System Activity"}
                        </div>
                        <div className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                          {activity.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        style={{
                          backgroundColor: activity.status === "completed"
                            ? (isDark ? '#14532d' : '#dcfce7')
                            : activity.status === "pending"
                            ? (isDark ? '#713f12' : '#fef3c7')
                            : (isDark ? '#1e3a8a' : '#dbeafe'),
                          color: activity.status === "completed"
                            ? (isDark ? '#4ade80' : '#166534')
                            : activity.status === "pending"
                            ? (isDark ? '#fbbf24' : '#92400e')
                            : (isDark ? '#60a5fa' : '#1e40af')
                        }}
                      >
                        {activity.status || "Active"}
                      </Badge>
                      <div className="text-xs mt-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
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
        <Card 
          className="border-2"
          style={{
            backgroundColor: isDark ? '#000000' : '#ffffff',
            borderColor: isDark ? '#374151' : '#e5e7eb'
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: isDark ? '#ffffff' : '#111827' }}>
              <Building2 className="w-5 h-5" />
              Organization Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  Organization Name
                </label>
                <p className="text-xs" style={{ color: isDark ? '#ffffff' : '#111827' }}>{tenant.name}</p>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  Contact Email
                </label>
                <p className="text-xs" style={{ color: isDark ? '#ffffff' : '#111827' }}>{tenant.contact_email}</p>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  Status
                </label>
                <Badge
                  style={{
                    backgroundColor: tenant.is_active
                      ? (isDark ? '#14532d' : '#dcfce7')
                      : (isDark ? '#1f2937' : '#f3f4f6'),
                    color: tenant.is_active
                      ? (isDark ? '#4ade80' : '#166534')
                      : (isDark ? '#9ca3af' : '#4b5563')
                  }}
                >
                  {tenant.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  Domain
                </label>
                <p className="text-xs" style={{ color: isDark ? '#ffffff' : '#111827' }}>
                  {tenant.domain || "Not configured"}
                </p>
              </div>
              {tenant.description && (
                <div className="md:col-span-2">
                  <label className="text-xs font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                    Description
                  </label>
                  <div
                    className="text-xs prose prose-sm max-w-none"
                    style={{ color: isDark ? '#ffffff' : '#111827' }}
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
