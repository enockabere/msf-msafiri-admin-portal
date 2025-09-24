"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  User,
  Bell,
  Loader2,
  RefreshCw,
  Clock,
  AlertTriangle,
  Info,
  Check,
  X,
} from "lucide-react";
import type { AuthUser } from "@/types/auth";
import { getUserInitials } from "@/utils/userUtils";
import { useUserData } from "@/hooks/useUserData";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationContext } from "@/context/NotificationContext";
import { NotificationPriority } from "@/lib/api";
import { AuthUtils } from "@/lib/auth";

interface SuperAdminNavbarProps {
  user: AuthUser | null;
  onProfileClick: () => void;
}

export function SuperAdminNavbar({
  user,
  onProfileClick,
}: SuperAdminNavbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { user: fullUserData } = useUserData();
  const {
    notifications,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    refetch: refetchNotifications,
  } = useNotifications();
  
  const { stats } = useNotificationContext();

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

  const displayName = user?.name || user?.email;
  const unreadCount = stats?.unread || 0;

  // Shared notification content for both mobile and desktop
  const NotificationContent = () => (
    <>
      <DropdownMenuLabel className="font-normal bg-gray-50 border-b border-gray-100 p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <div className="flex items-center space-x-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
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
            <p className="text-sm text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`p-3 cursor-pointer border-b border-gray-50 last:border-b-0 hover:bg-gray-50 focus:bg-gray-50 ${
                !notification.is_read ? "bg-blue-50/50" : ""
              }`}
              onClick={() => handleNotificationRead(notification.id)}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.priority)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2"></div>
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
              className="w-full justify-center text-sm text-red-600 hover:text-red-800 hover:bg-red-50"
              onClick={() => router.push("/notifications")}
            >
              View all notifications
            </Button>
          </div>
        </>
      )}
    </>
  );

  // Shared user menu content for both mobile and desktop
  const UserMenuContent = () => (
    <>
      <DropdownMenuLabel className="font-normal bg-red-50 border-b border-red-100 p-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold">
                {getUserInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayName || "Super Administrator"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {fullUserData?.email || user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white">
              {AuthUtils.getRoleDisplayName(user?.role || "")}
            </Badge>
            <Badge
              variant="outline"
              className="border-green-300 text-green-700"
            >
              Active
            </Badge>
          </div>

          {fullUserData?.last_login && (
            <p className="text-xs text-gray-500">
              Last login:{" "}
              {new Date(fullUserData.last_login).toLocaleDateString()}
            </p>
          )}
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={onProfileClick}
        className="cursor-pointer hover:bg-gray-50 px-4 py-2"
      >
        <User className="w-4 h-4 mr-2" />
        Profile Settings
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => router.push("/notifications")}
        className="cursor-pointer hover:bg-gray-50 px-4 py-2"
      >
        <Bell className="w-4 h-4 mr-2" />
        All Notifications
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-auto text-xs">
            {unreadCount}
          </Badge>
        )}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="text-red-600 focus:text-red-600 cursor-pointer hover:bg-red-50 px-4 py-2"
      >
        {isLoggingOut ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4 mr-2" />
        )}
        {isLoggingOut ? "Signing out..." : "Sign out"}
      </DropdownMenuItem>
    </>
  );

  // Show loading state if user is null
  if (!user) {
    return (
      <nav className="text-white shadow-lg border-b border-red-600 sticky top-0 z-50" style={{ backgroundColor: '#ee0000' }}>
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/20 p-2 backdrop-blur-sm border border-red-300/40">
                <Image
                  src="/icon/favicon.png"
                  alt="MSF Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain filter brightness-0 invert"
                  style={{ width: "auto", height: "auto" }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MSF Msafiri</h1>
                <p className="text-xs text-red-200 hidden sm:block">
                  Super Admin Portal
                </p>
              </div>
            </div>
            <div className="animate-pulse bg-white/20 rounded-full h-8 w-24"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav 
      className={`text-white border-b border-red-600 sticky top-0 z-50 transition-shadow duration-200 ${
      isScrolled ? 'shadow-lg' : 'shadow-sm'
    }`}
      style={{ backgroundColor: '#ee0000' }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section - Always Visible */}
          <div className="flex items-center space-x-3 min-w-0 flex-1 sm:flex-none">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/20 p-2 backdrop-blur-sm border border-red-300/40 flex-shrink-0">
              <Image
                src="/icon/favicon.png"
                alt="MSF Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain filter brightness-0 invert"
                style={{ width: "auto", height: "auto" }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white truncate">
                MSF Msafiri
              </h1>
              <p className="text-xs text-red-200 hidden sm:block">
                Super Admin Portal
              </p>
            </div>
          </div>

          {/* Actions Section - Responsive */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Notifications */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative text-white hover:bg-white/20 border border-white/20 bg-white/10 backdrop-blur-sm rounded-lg h-10 w-10 p-0"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-red-900">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-80 sm:w-80 bg-white border border-gray-200 shadow-xl rounded-lg z-[9999] max-h-96 overflow-hidden"
                align="end"
                sideOffset={8}
                alignOffset={-10}
                avoidCollisions={true}
                collisionPadding={16}
              >
                <NotificationContent />
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20 border border-white/20 bg-white/10 backdrop-blur-sm rounded-lg h-10 w-10 p-0"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm">
                      {getUserInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 sm:w-72 bg-white border border-gray-200 shadow-xl rounded-lg z-[9999]"
                sideOffset={8}
                alignOffset={-10}
                avoidCollisions={true}
                collisionPadding={16}
              >
                <UserMenuContent />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
