"use client";

import { useAuth } from "@/lib/auth";
import SuperAdminDashboard from "@/components/layout/SuperAdminDashboard";
import DashboardLayout from "@/components/layout/dashboard-layout";
import NavbarOnlyLayout from "@/components/layout/navbar-only-layout";
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
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Building2,
  Activity,
  Clock,
  Coins,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  console.log('📊 Dashboard Page - User:', user?.role, user);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading only if not mounted, but allow user to be null during logout
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If user is null (during logout), don't render anything
  if (!user) {
    return null;
  }

  // Check if user has tenant access (has tenant_id and is not pure super admin)
  const hasTenantAccess = user?.tenantId && user?.tenantId !== 'null';
  const isPureSuperAdmin = user?.role === "SUPER_ADMIN" && !hasTenantAccess;
  
  // Check if user has admin roles (should get tenant dashboard)
  const hasAdminRoles = user?.allRoles?.some(role => 
    ['MT_ADMIN', 'HR_ADMIN', 'EVENT_ADMIN'].includes(role)
  ) || ['MT_ADMIN', 'HR_ADMIN', 'EVENT_ADMIN'].includes(user?.role);
  
  // If user is pure super admin (no tenant access), show SuperAdminDashboard
  if (isPureSuperAdmin) {
    console.log('🔧 Pure super admin detected, wrapping in NavbarOnlyLayout');
    return (
      <NavbarOnlyLayout>
        <SuperAdminDashboard />
      </NavbarOnlyLayout>
    );
  }
  
  // If user has admin roles and tenant access, show tenant dashboard (not super admin dashboard)
  if (hasAdminRoles && hasTenantAccess) {
    console.log('🔧 Admin user with tenant access - showing tenant dashboard');
    const isDark = mounted && resolvedTheme === 'dark';

    const stats = {
      totalUsers: 12,
      activeEvents: 3,
      totalTenants: 5,
      totalInventory: 45,
    };

    const recentActivities = [
      {
        id: 1,
        type: "user_login",
        description: "New user registered",
        status: "completed",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        type: "event_created",
        description: "New event created",
        status: "pending",
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    return (
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid auto-rows-min gap-4 md:grid-cols-4 mb-6">
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {stats.totalUsers}
                </div>
                <div className="text-xs text-muted-foreground">
                  Registered users
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Active Events</h3>
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {stats.activeEvents}
                </div>
                <div className="text-xs text-muted-foreground">
                  Events running
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Organizations</h3>
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {stats.totalTenants}
                </div>
                <div className="text-xs text-muted-foreground">
                  Active tenants
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Inventory</h3>
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {stats.totalInventory}
                </div>
                <div className="text-xs text-muted-foreground">
                  Items available
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm capitalize">
                        {activity.type.replace("_", " ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activity.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={activity.status === "completed" ? "default" : "secondary"}>
                      {activity.status}
                    </Badge>
                    <div className="text-xs mt-1 text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If user is super admin with tenant access but no admin roles, show SuperAdminDashboard
  if (user?.role === "SUPER_ADMIN" || user?.role === "super_admin") {
    console.log('🔧 Super admin detected');
    return (
      <NavbarOnlyLayout>
        <SuperAdminDashboard />
      </NavbarOnlyLayout>
    );
  }

  // Other users get the tenant dashboard with sidebar
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div className="p-6">
      <p className="text-center text-gray-600 dark:text-gray-400">
        Welcome to your dashboard. Please contact your administrator for access.
      </p>
    </div>
  );
}
