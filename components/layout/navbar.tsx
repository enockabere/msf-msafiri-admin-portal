"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  LogOut,
  User,
  Settings,
  Shield,
  Loader2,
  Check,
  Clock,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { useAuth, AuthUtils } from "@/lib/auth";
import { useUserData } from "@/hooks/useUserData";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationPriority } from "@/lib/api";

export default function Navbar() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  // Use your existing auth hook for session data
  const { user, isAuthenticated, isSuperAdmin, loading } = useAuth();

  // Use new hooks for real API data
  const {
    user: fullUserData,
    loading: userDataLoading,
    error: userError,
    refetchUser,
  } = useUserData();

  const {
    notifications,
    stats,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    refetch: refetchNotifications,
  } = useNotifications();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({
        redirect: false,
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNotificationRead = async (id: number) => {
    await markAsRead(id);
  };

  const handleClearAllNotifications = async () => {
    await markAllAsRead();
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null | undefined): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get notification icon based on priority
  const getNotificationIcon = (priority: string) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case NotificationPriority.HIGH:
        return <X className="h-4 w-4 text-orange-500" />;
      case NotificationPriority.LOW:
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Get current date
  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get the best available user data (API first, then session fallback)
  const displayName = fullUserData?.full_name || user?.name || user?.email;

  // Get unread count from stats or fallback to counting notifications
  const unreadCount =
    stats?.unread || notifications.filter((n) => !n.is_read).length;

  // Loading state
  if (loading || userDataLoading) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="hidden md:block h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Not authenticated state
  if (!isAuthenticated || !user) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-center">
            <div className="text-sm text-gray-500">
              Please log in to access the dashboard
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left Section - Greeting and Info */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              {/* Main greeting */}
              <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">
                {getGreeting()}, {displayName?.split(" ")[0] || "Admin"}
              </h1>

              {/* Secondary info - hidden on mobile */}
              <div className="hidden sm:flex items-center space-x-3 mt-1">
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {getCurrentDate()}
                </div>



                {user.firstLogin && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                  >
                    New User
                  </Badge>
                )}
              </div>


            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notifications Dropdown - Hidden on small screens */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-9 w-9 rounded-full p-0 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 border border-gray-200"
                  >
                    <Bell className="h-4 w-4 text-gray-600" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                    <span className="sr-only">
                      {unreadCount > 0
                        ? `${unreadCount} notifications`
                        : "Notifications"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-80 bg-white border border-gray-200 shadow-lg rounded-lg z-50 max-h-96 overflow-hidden"
                  align="end"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="font-normal bg-gray-50/50 border-b border-gray-100 p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm text-gray-900">
                        Notifications
                      </h3>
                      <div className="flex items-center space-x-1">
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={handleClearAllNotifications}
                          >
                            Mark all read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-100"
                          onClick={refetchNotifications}
                          disabled={notificationsLoading}
                        >
                          <RefreshCw
                            className={`h-3 w-3 ${
                              notificationsLoading ? "animate-spin" : ""
                            }`}
                          />
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <div className="max-h-80 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="p-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          Loading notifications...
                        </p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-500">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`p-3 cursor-pointer border-b border-gray-50 last:border-b-0 hover:bg-gray-50 focus:bg-gray-50 ${
                            !notification.is_read ? "bg-blue-50/50" : ""
                          }`}
                          onClick={() =>
                            handleNotificationRead(notification.id)
                          }
                        >
                          <div className="flex items-start space-x-3 w-full">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.priority)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-medium text-gray-900 line-clamp-1">
                                  {notification.title}
                                </p>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center mt-2">
                                <Clock className="h-3 w-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-400">
                                  {formatTimeAgo(notification.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-center text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => {
                            const pathname = window.location.pathname;
                            const tenantMatch = pathname.match(/\/tenant\/([^/]+)/);
                            const notificationsUrl = tenantMatch 
                              ? `/tenant/${tenantMatch[1]}/notifications` 
                              : "/notifications";
                            router.push(notificationsUrl);
                          }}
                        >
                          View all notifications
                        </Button>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile notification button */}
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 rounded-full p-0 hover:bg-gray-100 border border-gray-200"
                onClick={() => {
                  const pathname = window.location.pathname;
                  const tenantMatch = pathname.match(/\/tenant\/([^/]+)/);
                  const notificationsUrl = tenantMatch 
                    ? `/tenant/${tenantMatch[1]}/notifications` 
                    : "/notifications";
                  router.push(notificationsUrl);
                }}
              >
                <Bell className="h-4 w-4 text-gray-600" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full p-0 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 border border-gray-200"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm">
                      {getUserInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-72 bg-white border border-gray-200 shadow-lg rounded-lg z-50"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="font-normal bg-gray-50/50 p-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                            {getUserInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {displayName || "User"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {fullUserData?.email || user.email}
                          </p>
                        </div>
                      </div>
                      {userError && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-100"
                          onClick={refetchUser}
                          title="Retry loading user data"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {fullUserData?.job_title && (
                      <p className="text-xs text-gray-600">
                        {fullUserData.job_title}
                      </p>
                    )}

                    <div className="flex items-center space-x-2 pt-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${AuthUtils.getRoleColor(
                          user.role || ""
                        )}`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {AuthUtils.getRoleDisplayName(user.role || "")}
                      </Badge>
                      {(fullUserData?.is_active ?? user.isActive) && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 text-xs"
                        >
                          Active
                        </Badge>
                      )}
                    </div>

                    {fullUserData?.last_login && (
                      <p className="text-xs text-gray-500">
                        Last login: {formatTimeAgo(fullUserData.last_login)}
                      </p>
                    )}

                    {userError && (
                      <p className="text-xs text-red-500">
                        Failed to load full profile
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <div className="py-1">
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 px-4 py-2"
                  >
                    <User className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="text-xs">Profile Settings</span>
                  </DropdownMenuItem>

                  {isSuperAdmin && (
                    <DropdownMenuItem
                      onClick={() => router.push("/admin/system")}
                      className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 px-4 py-2"
                    >
                      <Settings className="mr-3 h-4 w-4 text-gray-500" />
                      <span className="text-xs">System Settings</span>
                    </DropdownMenuItem>
                  )}
                </div>

                <DropdownMenuSeparator />

                <div className="py-1">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 hover:text-red-700 px-4 py-2"
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
        </div>
      </div>
    </header>
  );
}
