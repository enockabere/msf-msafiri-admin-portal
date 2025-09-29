import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { useState, useEffect } from "react";
import {
  UserPlus,
  Calendar,
  Hotel,
  Coins,
  BarChart3,
  Bell,
  Users,
} from "lucide-react";

export default function QuickActions() {
  const { user, isSuperAdmin } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);

  // Check if user is tenant admin
  useEffect(() => {
    const checkTenantAdmin = async () => {
      if (user?.email) {
        try {
          // Get tenant slug from current path
          const currentTenantSlug = window.location.pathname.match(/\/tenant\/([^/]+)/)?.[1];
          if (currentTenantSlug) {
            const tenants = await apiClient.getTenants();
            const currentTenant = tenants.find(t => t.slug === currentTenantSlug);
            setIsTenantAdmin(currentTenant?.admin_email === user.email);
          } else {
            setIsTenantAdmin(false);
          }
        } catch (error) {
          console.error('Error checking tenant admin status:', error);
          setIsTenantAdmin(false);
        }
      }
    };
    
    checkTenantAdmin();
  }, [user?.email, apiClient]);

  const quickActions = [
    {
      title: "Add New Visitor",
      icon: UserPlus,
      color: "bg-blue-500 hover:bg-blue-600",
      description: "Register a new visitor",
      requiresUserManagement: false,
    },
    {
      title: "Manage Users",
      icon: Users,
      color: "bg-indigo-500 hover:bg-indigo-600",
      description: "Manage admin users",
      requiresUserManagement: true,
    },
    {
      title: "Create Event",
      icon: Calendar,
      color: "bg-green-500 hover:bg-green-600",
      description: "Schedule new event",
      requiresUserManagement: false,
    },
    {
      title: "Assign Rooms",
      icon: Hotel,
      color: "bg-orange-500 hover:bg-orange-600",
      description: "Manage accommodation",
      requiresUserManagement: false,
    },
    {
      title: "Process PerDiem",
      icon: Coins,
      color: "bg-purple-500 hover:bg-purple-600",
      description: "Handle payments",
      requiresUserManagement: false,
    },
    {
      title: "Generate Report",
      icon: BarChart3,
      color: "bg-indigo-500 hover:bg-indigo-600",
      description: "Create analytics report",
      requiresUserManagement: false,
    },
    {
      title: "Send Notification",
      icon: Bell,
      color: "bg-red-500 hover:bg-red-600",
      description: "Broadcast message",
      requiresUserManagement: false,
    },
  ];

  const handleActionClick = (actionTitle: string) => {
    // For demo purposes, show alert
    alert(`Opening ${actionTitle}...`);
  };

  // Filter actions based on user permissions
  const visibleActions = quickActions.filter(action => {
    if (action.requiresUserManagement) {
      // Only show user management actions to super admins or tenant admins (owners)
      return isSuperAdmin || isTenantAdmin;
    }
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-all duration-200 border-2 hover:border-gray-300"
              onClick={() => handleActionClick(action.title)}
            >
              <div
                className={`p-3 rounded-lg text-white ${action.color} transition-colors duration-200`}
              >
                <action.icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 mb-1">
                  {action.title}
                </div>
                <div className="text-xs text-gray-500">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
