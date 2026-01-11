"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { Tenant } from "@/lib/api";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
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
  Plus,
} from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading";
import { SetupWizard } from "@/components/setup-wizard";

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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const tenantSlug = params.slug as string;
  const isVettingOnlyUser = () => {
    if (!user) return false;
    
    // Check if user has admin roles
    const adminRoles = ['MT_ADMIN', 'HR_ADMIN', 'EVENT_ADMIN'];
    const allRoles = user.all_roles || user.allRoles || [];
    const allUserRoles = [user.role, ...allRoles].filter(Boolean);
    
    const hasAdminRole = allUserRoles.some((role: string) => adminRoles.includes(role));
    const hasSuperAdminRole = allUserRoles.some((role: string) => ['SUPER_ADMIN', 'super_admin'].includes(role));
    
    // Check if user has vetting roles
    const vettingRoles = ['VETTING_COMMITTEE', 'VETTING_APPROVER'];
    const hasVettingRole = allUserRoles.some((role: string) => vettingRoles.includes(role));
    
    // Only redirect if user has ONLY vetting roles without any admin or super admin roles
    return hasVettingRole && !hasAdminRole && !hasSuperAdminRole;
  };

  // Redirect vetting-only users to events page
  useEffect(() => {
    if (user && isVettingOnlyUser() && !loading) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      window.location.href = `${baseUrl}/tenant/${tenantSlug}/events`;
    }
  }, [user, loading, tenantSlug]);

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

  useEffect(() => {
    const fetchTenant = async () => {
      // Skip if data already loaded for this tenant
      if (dataLoaded && tenant?.slug === tenantSlug) {
        setLoading(false);
        return;
      }

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
              // Create fallback tenant instead of throwing error
              foundTenant = {
                id: tenantSlug,
                name: `Organization ${tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1)}`,
                slug: tenantSlug,
                contact_email: user?.email || "contact@example.com",
                admin_email: user?.email || "admin@example.com",
                is_active: true,
                domain: null,
                description: `Dashboard for ${tenantSlug} organization`,
                created_at: new Date().toISOString(),
              };
            }
          }
        } catch (error) {
          console.error("Error fetching tenant:", error);
          // Create fallback tenant object - be more permissive
          foundTenant = {
            id: tenantSlug,
            name: `Organization ${tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1)}`,
            slug: tenantSlug,
            contact_email: user?.email || "contact@example.com",
            admin_email: user?.email || "admin@example.com",
            is_active: true,
            domain: null,
            description: `Dashboard for ${tenantSlug} organization`,
            created_at: new Date().toISOString(),
          };
        }

        setTenant(foundTenant);

        // Fetch statistics inline
        try {
          let totalUsers = 1;
          let activeEvents = 0;
          let totalVisitors = 0;
          let totalInventory = 0;

          // Get users count filtered by current tenant
          try {
            const users = await apiClient.getUsers(foundTenant.slug);
            const tenantUsers = users.filter(user => 
              user.tenant_id === foundTenant.slug || 
              user.tenant_id === foundTenant.id.toString() ||
              user.tenant_id === tenantSlug
            );
            totalUsers = tenantUsers.length;
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
              
              // Show setup wizard only if no events exist
              if (tenantEvents.length === 0) {
                setShowSetupWizard(true);
              }

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
            // Show setup wizard if we can't fetch events (likely means no events exist)
            setShowSetupWizard(true);
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
        setDataLoaded(true);
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
  }, [tenantSlug, user?.email, user?.tenantId, apiClient, dataLoaded, tenant?.slug]);

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
      <div className="p-6">
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
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Greeting Section */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Hello, <span className="text-red-600">{user?.name || user?.email?.split('@')[0] || 'User'}</span>! 👋
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Welcome back to your {tenant.name} dashboard. Here's what's happening today.
        </p>
      </div>

      {/* Setup Wizard Modal - Show as overlay */}
      {showSetupWizard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[85vh]">
            <SetupWizard onDismiss={() => setShowSetupWizard(false)} />
          </div>
        </div>
      )}

      {/* Quick Actions - Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Manage Users */}
        {(tenant?.admin_email === user?.email || user?.role?.toLowerCase() === "super_admin" || user?.tenantId === tenantSlug) && (
          <Card className="group relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-2xl cursor-pointer transform hover:-translate-y-1 transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800"
            onClick={() => handleCardClick(`/tenant/${tenantSlug}/admin-users`)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-400/20 dark:via-blue-400/10 dark:to-transparent"></div>
            <CardContent className="relative p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 group-hover:scale-110 transition-all duration-300">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                    +{stats.totalUsers > 0 ? '1' : '0'} this month
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Users</h3>
                  <div className="h-0.5 w-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {stats.totalUsers}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Users in {tenant.name}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Active Events */}
        <Card className="group relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-2xl cursor-pointer transform hover:-translate-y-1 transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800"
          onClick={() => handleCardClick(`/tenant/${tenantSlug}/events`)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-400/20 dark:via-purple-400/10 dark:to-transparent"></div>
          <CardContent className="relative p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-purple-500/25 group-hover:scale-110 transition-all duration-300">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col items-end">
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                  +{stats.activeEvents > 0 ? '1' : '0'} this month
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Active Events</h3>
                <div className="h-0.5 w-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {stats.activeEvents}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Events currently active
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Inventory Items */}
        <Card className="group relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-2xl cursor-pointer transform hover:-translate-y-1 transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800"
          onClick={() => handleCardClick(`/tenant/${tenantSlug}/inventory`)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent dark:from-orange-400/20 dark:via-orange-400/10 dark:to-transparent"></div>
          <CardContent className="relative p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:shadow-orange-500/25 group-hover:scale-110 transition-all duration-300">
                <Coins className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col items-end">
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                  +{stats.totalInventory > 0 ? '1' : '0'} this month
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Inventory Items</h3>
                <div className="h-0.5 w-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {stats.totalInventory}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Items available
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Create Event - New Card */}
        <Card className="group relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-2xl cursor-pointer transform hover:-translate-y-1 transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800"
          onClick={() => handleCardClick(`/tenant/${tenantSlug}/events`)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-400/20 dark:via-emerald-400/10 dark:to-transparent"></div>
          <CardContent className="relative p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-emerald-500/25 group-hover:scale-110 transition-all duration-300">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col items-end">
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-500/20">
                  Quick Action
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Create Event</h3>
                <div className="h-0.5 w-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                <Plus className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Start planning new events
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="bg-muted/50 mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent activities
              </div>
            ) : (
              recentActivities.map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg bg-background gap-3 sm:gap-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm capitalize">
                        {activity.type?.replace("_", " ") || "System Activity"}
                      </div>
                      <div className="text-xs text-muted-foreground break-words">
                        {activity.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right">
                    <Badge variant={activity.status === "completed" ? "default" : "secondary"}>
                      {activity.status || "Active"}
                    </Badge>
                    <div className="text-xs mt-0 sm:mt-1 text-muted-foreground">
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
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Organization Name
              </label>
              <p className="text-xs break-words">{tenant.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Contact Email
              </label>
              <p className="text-xs break-all">{tenant.contact_email}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <Badge variant={tenant.is_active ? "default" : "secondary"}>
                {tenant.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Domain
              </label>
              <p className="text-xs">
                {tenant.domain || "Not configured"}
              </p>
            </div>
            {tenant.description && (
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Description
                </label>
                <div
                  className="text-xs prose prose-sm max-w-none"
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
  );
}