"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  User,
  Settings,
  Shield,
  Loader2,
  Calendar,
  Search,
} from "lucide-react";
import { useAuth, AuthUtils } from "@/lib/auth";
import { useUserData } from "@/hooks/useUserData";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";

interface NavbarProps {
  showLogo?: boolean;
}

export default function Navbar({ showLogo = false }: NavbarProps) {
  console.log('🔍 NAVBAR RENDER:', {
    showLogo,
    location: 'navbar.tsx',
    timestamp: new Date().toISOString()
  });
  
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const { user, isAuthenticated, isSuperAdmin, loading } = useAuth();
  const { user: fullUserData, loading: userDataLoading } = useUserData();

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const displayName = fullUserData?.full_name || user?.name || user?.email;
  const isVettingOnly = user?.role && ['vetting_committee', 'VETTING_COMMITTEE', 'vetting_approver', 'VETTING_APPROVER'].includes(user.role);

  if (loading || userDataLoading || !mounted) {
    return (
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-8 rounded w-32 animate-pulse" style={{
            backgroundColor: mounted && resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'
          }}></div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full animate-pulse" style={{
            backgroundColor: mounted && resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'
          }}></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-16 items-center justify-center">
        <div className="text-sm" style={{
          color: mounted && resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280'
        }}>
          Please log in to access the dashboard
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-16 items-center justify-between w-full px-4">
      {console.log('📌 NAVBAR CONTAINER RENDER:', {
        width: 'w-full',
        className: 'flex h-16 items-center justify-between w-full px-4',
        shouldNotRenderInShadcnLayout: true
      })}
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        {showLogo && (
          <div className="flex-shrink-0">
            <img
              src="/portal/icon/msafiri.jpeg"
              alt="MSafiri Logo"
              width={70}
              height={70}
              className="rounded-lg object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-base lg:text-lg font-semibold truncate text-black">
            {getGreeting()}, {displayName?.split(" ")[0] || "Admin"}
          </h1>

          <div className="hidden sm:flex items-center space-x-3 mt-1">
            <div className="flex items-center text-xs text-gray-600">
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

      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 w-64 h-10"
              style={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                color: isDark ? '#ffffff' : '#000000'
              }}
            />
          </div>
        </div>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="rounded-lg h-10 w-10 p-0"
              style={{
                color: isDark ? '#ffffff' : '#000000',
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb'
              }}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-black text-white font-semibold text-sm">
                  {getUserInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-72 shadow-lg rounded-lg z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
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
                      {fullUserData?.email || user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${AuthUtils.getRoleColor(user.role || "")}`}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {AuthUtils.getRoleDisplayName(user.role || "")}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <div className="py-1">
              {!isVettingOnly && (
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 text-gray-900 dark:text-gray-200"
                >
                  <User className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs">Profile Settings</span>
                </DropdownMenuItem>
              )}

              {(isSuperAdmin || user?.role === 'super_admin') && (
                <DropdownMenuItem
                  onClick={() => router.push("/admin/system")}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 text-gray-900 dark:text-gray-200"
                >
                  <Settings className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs">System Settings</span>
                </DropdownMenuItem>
              )}
            </div>

            <DropdownMenuSeparator />

            <div className="py-1">
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2"
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
  );
}