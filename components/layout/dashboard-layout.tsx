"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { CustomSidebar } from "@/components/app-sidebar";
import { SuperAdminFooter } from "./SuperAdminFooter";
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home, Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Settings as SettingsIcon, Shield, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useUserData } from "@/hooks/useUserData";
import { MenuSearch } from "@/components/menu-search";
import { TooltipProvider } from "@/components/ui/tooltip";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Load sidebar state from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);
  
  // Save sidebar state to localStorage when it changes
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    }
  };
  const { user, isSuperAdmin } = useAuth();
  const { user: fullUserData } = useUserData();
  const pathname = usePathname();
  const router = useRouter();

  const isTenantPath = pathname?.includes('/tenant/');

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({ redirect: false });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getUserInitials = (name: string | null | undefined): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const displayName = fullUserData?.full_name || user?.name || user?.email;
  const isVettingOnly = user?.role && ['vetting_committee', 'VETTING_COMMITTEE', 'vetting_approver', 'VETTING_APPROVER'].includes(user.role);

  // Get breadcrumb from pathname
  const getBreadcrumbs = () => {
    const paths = pathname?.split('/').filter(Boolean) || [];
    const breadcrumbs = [];

    // Skip "tenant" and slug in breadcrumb display
    let skipNext = false;
    for (let i = 0; i < paths.length; i++) {
      if (paths[i] === 'tenant') {
        skipNext = true;
        continue;
      }
      if (skipNext) {
        skipNext = false;
        continue;
      }

      const label = paths[i]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbs.push({ label, href: `/${paths.slice(0, i + 1).join('/')}` });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Show sidebar only on tenant paths
  const shouldShowLayout = isTenantPath;
  
  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-black overflow-hidden">
        <CustomSidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={toggleSidebar} 
        />
      
      {/* Main Content */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white dark:bg-black px-2 md:px-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Separator orientation="vertical" className="mr-2 h-4" />

            {/* Breadcrumb */}
            <Breadcrumb className="min-w-0">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={isTenantPath ? pathname.split('/').slice(0, 4).join('/') : "/dashboard"}>
                      <Home className="h-4 w-4" />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center gap-1.5">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href} className="truncate">{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Search */}
            <MenuSearch className="hidden lg:block" />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 md:h-9 md:w-9 relative">
                  <Bell className="h-4 w-4" />
                  {/* Add notification badge if needed */}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                <DropdownMenuLabel className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                  Notifications
                </DropdownMenuLabel>
                <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                  <DropdownMenuItem disabled className="p-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      <span className="text-sm">No notifications</span>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 md:h-9 md:w-9 rounded-full p-0">
                  <Avatar className="h-7 w-7 md:h-8 md:w-8">
                    <AvatarFallback className="bg-black text-white font-semibold text-xs md:text-sm">
                      {getUserInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-72 shadow-lg rounded-lg bg-white dark:bg-gray-900 border"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="font-normal p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                          {getUserInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-gray-900 dark:text-white">
                          {displayName || "User"}
                        </p>
                        <p className="text-xs truncate text-gray-600 dark:text-gray-400">
                          {fullUserData?.email || user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <div className="py-1">
                  {!isVettingOnly && (
                    <DropdownMenuItem
                      onClick={() => router.push("/profile")}
                      className="cursor-pointer"
                    >
                      <UserIcon className="mr-3 h-4 w-4" />
                      <span className="text-xs">Profile Settings</span>
                    </DropdownMenuItem>
                  )}

                  {(isSuperAdmin || user?.role === 'super_admin') && (
                    <DropdownMenuItem
                      onClick={() => router.push("/admin/system")}
                      className="cursor-pointer"
                    >
                      <SettingsIcon className="mr-3 h-4 w-4" />
                      <span className="text-xs">System Settings</span>
                    </DropdownMenuItem>
                  )}
                </div>

                <DropdownMenuSeparator />

                <div className="py-1">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer text-red-600 dark:text-red-400"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-3 h-4 w-4" />
                    )}
                    <span className="text-xs">
                      {isLoggingOut ? "Signing out..." : "Sign Out"}
                    </span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>

        {isTenantPath && <SuperAdminFooter />}
      </div>
    </div>
    </TooltipProvider>
  );
}
