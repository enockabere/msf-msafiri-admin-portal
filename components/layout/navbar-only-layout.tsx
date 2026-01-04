"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { useUserData } from "@/hooks/useUserData";
import { useNotifications } from "@/hooks/useNotifications";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Home, Bell, LogOut, User as UserIcon, Settings as SettingsIcon, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { AuthUtils } from "@/lib/auth";

interface NavbarOnlyLayoutProps {
  children: React.ReactNode;
}

export default function NavbarOnlyLayout({ children }: NavbarOnlyLayoutProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isSuperAdmin } = useAuth();
  const { user: fullUserData } = useUserData();
  const { notifications, stats } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({ 
        redirect: true,
        callbackUrl: "/login"
      });
    } catch (error) {
      console.error("Logout error:", error);
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

  if (isLoggingOut) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Signing out...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className={`flex h-16 shrink-0 items-center gap-2 border-b bg-red-600 dark:bg-black border-red-700 dark:border-gray-700 px-2 sm:px-4 transition-shadow duration-200 ${isScrolled ? 'shadow-md' : ''}`}>
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 bg-white p-1.5 shadow-sm rounded">
            <Image
              src="/portal/icon/favicon.png"
              alt="MSF Logo"
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-medium text-white dark:text-white">MSF Msafiri</h1>
            <p className="text-xs text-red-100 dark:text-gray-400">Admin Portal</p>
          </div>
        </div>

        <Separator orientation="vertical" className="mx-2 h-4 bg-red-300 dark:bg-gray-600 hidden sm:block" />

        {/* Breadcrumb */}
        <div className="hidden md:block">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard" className="text-white dark:text-gray-300 hover:text-red-100 dark:hover:text-white">
                    <Home className="h-4 w-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-red-200 dark:text-gray-500" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white dark:text-gray-300">Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-9 sm:w-9 relative text-white hover:bg-red-700 dark:text-gray-300 dark:hover:bg-gray-800">
                <Bell className="h-4 w-4" />
                {stats && stats.unread > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center bg-yellow-500 text-black text-xs font-semibold">
                    {stats.unread > 9 ? '9+' : stats.unread}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
              <DropdownMenuLabel className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                Notifications
                {stats && stats.unread > 0 && (
                  <Badge className="ml-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {stats.unread} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      <div className="flex items-start justify-between w-full">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">{notification.title}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{notification.message}</div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </div>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled className="p-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      <span className="text-sm">No notifications</span>
                    </div>
                  </DropdownMenuItem>
                )}
              </div>
              {notifications && notifications.length > 5 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    View all notifications
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0 hover:bg-red-700 dark:hover:bg-gray-800">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  {fullUserData?.avatar_url ? (
                    <img 
                      src={fullUserData.avatar_url} 
                      alt={displayName || "User"}
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-white text-red-600 dark:bg-black dark:text-white font-semibold text-xs sm:text-sm">
                      {getUserInitials(displayName)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-64 sm:w-72 shadow-lg rounded-lg bg-white dark:bg-gray-900 border"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-10 w-10">
                      {fullUserData?.avatar_url ? (
                        <img 
                          src={fullUserData.avatar_url} 
                          alt={displayName || "User"}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                          {getUserInitials(displayName)}
                        </AvatarFallback>
                      )}
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
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="cursor-pointer"
                >
                  <UserIcon className="mr-3 h-4 w-4" />
                  <span className="text-xs">Profile Settings</span>
                </DropdownMenuItem>

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
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}