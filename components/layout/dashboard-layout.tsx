"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { CustomSidebar } from "@/components/app-sidebar";
import { SuperAdminFooter } from "./SuperAdminFooter";
import { FloatingQuickLinks } from "@/components/floating-quick-links";
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home, Search, Bell, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Settings as SettingsIcon, Shield, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useUserData } from "@/hooks/useUserData";
import { MenuSearch } from "@/components/menu-search";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const { user, isSuperAdmin } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const { user: fullUserData, refetchUser: refetchUserData } = useUserData();

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image size must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/upload-avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      // Update user profile with new avatar URL
      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar_url: data.url }),
      });

      if (updateResponse.ok) {
        await refetchUserData();
        toast({ title: "Success", description: "Avatar updated successfully" });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({ title: "Error", description: "Failed to upload avatar", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
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
  const isLimitedUser = () => {
    if (!user) return false;
    
    const adminRoles = ['MT_ADMIN', 'HR_ADMIN', 'EVENT_ADMIN'];
    const vettingRoles = ['VETTING_COMMITTEE', 'VETTING_APPROVER'];
    const superAdminRoles = ['SUPER_ADMIN', 'super_admin'];
    const guestRoles = ['GUEST', 'guest'];
    
    // Get all user roles
    const allRoles = user.all_roles || [];
    const allUserRoles = [user.role, ...allRoles].filter(Boolean);
    
    const hasAdminRole = allUserRoles.some(role => adminRoles.includes(role));
    const hasVettingRole = allUserRoles.some(role => vettingRoles.includes(role));
    const hasSuperAdminRole = allUserRoles.some(role => superAdminRoles.includes(role));
    const hasGuestRole = allUserRoles.some(role => guestRoles.includes(role));
    
    // Show limited UI ONLY if user has ONLY vetting/guest roles without any admin roles
    // If user has any admin role (MT_ADMIN, HR_ADMIN, EVENT_ADMIN), they get full access
    return (hasVettingRole || hasGuestRole) && !hasAdminRole && !hasSuperAdminRole;
  };
  
  const isLimitedUserAccess = isLimitedUser();

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
        {/* Sidebar - Hidden for limited users */}
        {!isLimitedUserAccess && (
          <div className="hidden lg:block">
            <CustomSidebar 
              isCollapsed={isSidebarCollapsed} 
              onToggle={toggleSidebar} 
            />
          </div>
        )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300 min-w-0">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white dark:bg-black px-2 md:px-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Mobile menu button - Hidden for limited users */}
            {!isLimitedUserAccess && (
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={toggleMobileSidebar}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            )}
            
            <Separator orientation="vertical" className="mr-2 h-4" />

            {/* Breadcrumb - Hide home icon for limited users */}
            <Breadcrumb className="min-w-0">
              <BreadcrumbList>
                {!isLimitedUserAccess && (
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={isTenantPath ? pathname.split('/').slice(0, 4).join('/') : "/dashboard"}>
                        <Home className="h-4 w-4" />
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                )}
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center gap-1.5">
                    {!isLimitedUserAccess && <BreadcrumbSeparator />}
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
            {/* Search - Hidden for limited users */}
            {!isLimitedUserAccess && (
              <MenuSearch className="hidden lg:block" />
            )}

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
                    {fullUserData?.avatar_url && (
                      <AvatarImage src={fullUserData.avatar_url} alt="Avatar" className="object-cover" />
                    )}
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
                      <div className="relative group">
                        <Avatar className="h-10 w-10">
                          {fullUserData?.avatar_url && (
                            <AvatarImage src={fullUserData.avatar_url} alt="Avatar" className="object-cover" />
                          )}
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                            {getUserInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={uploading}
                          className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed"
                          title={uploading ? "Uploading..." : "Change avatar"}
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4 text-white" />
                          )}
                        </button>
                      </div>
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
                  {!isLimitedUserAccess && (
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

        {/* Mobile sidebar overlay - Hidden for limited users */}
        {!isLimitedUserAccess && isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/50" onClick={toggleMobileSidebar} />
            <div className="relative flex w-64 flex-col bg-white dark:bg-black">
              <CustomSidebar 
                isCollapsed={false} 
                onToggle={toggleMobileSidebar} 
                isMobile={true}
              />
            </div>
          </div>
        )}

        {/* Floating Quick Links - Show on all tenant pages except mobile and limited users */}
        {!isLimitedUserAccess && (
          <div className="hidden lg:block">
            <FloatingQuickLinks />
          </div>
        )}

        {isTenantPath && <SuperAdminFooter />}
      </div>
    </div>
    
    {/* Hidden avatar upload input */}
    <input
      ref={avatarInputRef}
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleAvatarUpload(file);
      }}
      className="hidden"
    />
    </TooltipProvider>
  );
}