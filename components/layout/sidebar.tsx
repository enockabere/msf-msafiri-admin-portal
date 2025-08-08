import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  Calendar,
  Car,
  Hotel,
  Ticket,
  Coins,
  CreditCard,
  MessageSquare,
  Bell,
  Shield,
  FileText,
  Home,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Loader2,
} from "lucide-react";
import { useAuth, AuthUtils } from "@/lib/auth";

interface SidebarProps {
  collapsed: boolean;
  toggleCollapse: () => void;
}

const navigationItems = [
  {
    title: "Overview",
    items: [
      { icon: Home, label: "Dashboard", href: "/dashboard", badge: null },
      {
        icon: BarChart3,
        label: "Analytics & Reports",
        href: "/analytics",
        badge: null,
      },
    ],
  },
  {
    title: "User Management",
    items: [
      { icon: Users, label: "Visitors", href: "/visitors", badge: 24 },
      { icon: Shield, label: "Admin Roles", href: "/admin-roles", badge: null },
      {
        icon: FileText,
        label: "Document Review",
        href: "/documents",
        badge: 8,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        icon: Calendar,
        label: "Event Management",
        href: "/events",
        badge: null,
      },
      {
        icon: Car,
        label: "Transport & Movement",
        href: "/transport",
        badge: null,
      },
      {
        icon: Hotel,
        label: "Accommodation",
        href: "/accommodation",
        badge: null,
      },
      { icon: Ticket, label: "Item Distribution", href: "/items", badge: null },
    ],
  },
  {
    title: "Finance & HR",
    items: [
      {
        icon: Coins,
        label: "PerDiem Management",
        href: "/perdiem",
        badge: null,
      },
      {
        icon: CreditCard,
        label: "Reimbursements",
        href: "/reimbursements",
        badge: null,
      },
    ],
  },
  {
    title: "Communication",
    items: [
      {
        icon: MessageSquare,
        label: "Chat Management",
        href: "/chat",
        badge: null,
      },
      {
        icon: Bell,
        label: "Notifications",
        href: "/notifications",
        badge: null,
      },
    ],
  },
];

export default function Sidebar({ collapsed, toggleCollapse }: SidebarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, isSuperAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Sign out with NextAuth
      await signOut({
        redirect: false,
      });

      // Manual redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className={cn(
        "bg-gradient-msf text-white transition-all duration-300 flex flex-col shadow-xl",
        collapsed ? "w-20" : "w-80"
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-1">
              <Image
                src="/icon/favicon.png"
                alt="MSF Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold">MSF Msafiri</h1>
                <p className="text-xs opacity-80">Super Admin Portal</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="text-white hover:bg-white/10 p-1 h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.name || user.email}
              </p>
              <p className="text-xs opacity-70 truncate">
                {AuthUtils.getRoleDisplayName(user.role || "")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {navigationItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            {!collapsed && (
              <div className="px-6 mb-2">
                <p className="text-xs uppercase tracking-wider opacity-70 font-semibold">
                  {section.title}
                </p>
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item, index) => (
                <Link key={index} href={item.href}>
                  <button
                    className={cn(
                      "w-full flex items-center px-6 py-3 text-left transition-all duration-200 border-l-3 group",
                      pathname === item.href
                        ? "bg-white/10 border-l-white"
                        : "border-l-transparent hover:bg-white/5 hover:border-l-white/50"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="ml-3 font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="ml-auto bg-yellow-400 text-gray-900 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* System Settings for Super Admin */}
        {isSuperAdmin && (
          <div className="mb-6">
            {!collapsed && (
              <div className="px-6 mb-2">
                <p className="text-xs uppercase tracking-wider opacity-70 font-semibold">
                  System
                </p>
              </div>
            )}
            <div className="space-y-1">
              <Link href="/admin/system">
                <button
                  className={cn(
                    "w-full flex items-center px-6 py-3 text-left transition-all duration-200 border-l-3 group",
                    pathname === "/admin/system"
                      ? "bg-white/10 border-l-white"
                      : "border-l-transparent hover:bg-white/5 hover:border-l-white/50"
                  )}
                >
                  <Settings className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="ml-3 font-medium">System Settings</span>
                  )}
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Logout */}
      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "w-full justify-start text-white hover:bg-red-500/20 hover:text-white transition-colors",
            collapsed ? "px-2" : "px-4"
          )}
        >
          {isLoggingOut ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          {!collapsed && (
            <span className="ml-3">
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
