import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Calendar,
  MessageSquare,
  Bell,
  Shield,
  Home,
  LogOut,
  Settings,
  Loader2,
  Building2,
  User,
  Clock,
  ChevronDown,
  ChevronRight,
  X,
  PanelLeftOpen,
  PanelLeftClose,
  Package,
  Hotel,
  Car,
  Plane,
  Newspaper,
} from "lucide-react";
import { useAuth, AuthUtils, useAuthenticatedApi } from "@/lib/auth";
import { useUserData } from "@/hooks/useUserData";
import { useNotifications } from "@/hooks/useNotifications";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
// import { useWebSocketNotifications } from "@/hooks/useWebSocketNotifications";

import { useEffect, useState } from "react";

interface SidebarProps {
  collapsed: boolean;
  toggleCollapse: () => void;
  onMobileClose?: () => void;
  isMobile?: boolean;
}

// Enhanced Tooltip component with better z-index and positioning
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "right" | "left";
}

function Tooltip({ children, content, side = "right" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <>
          {/* Backdrop to ensure tooltip appears above everything */}
          <div className="fixed inset-0 pointer-events-none z-[9999]">
            <div
              className={cn(
                "absolute px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-xl whitespace-nowrap border border-gray-700",
                "animate-in fade-in-0 zoom-in-95 duration-150",
                side === "right"
                  ? "left-[calc(100%+12px)] top-1/2 -translate-y-1/2"
                  : "right-[calc(100%+12px)] top-1/2 -translate-y-1/2"
              )}
              style={{
                position: "fixed",
                left: side === "right" ? "92px" : "auto",
                right: side === "left" ? "92px" : "auto",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              {content}
              {/* Arrow */}
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-700",
                  side === "right" ? "-left-1" : "-right-1"
                )}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const getNavigationItems = (userRoles: string[], isAdmin: boolean, isTenantAdmin: boolean, isSuperAdmin: boolean) => {
  const sections = [];
  
  // Overview - All roles
  sections.push({
    title: "Overview",
    items: [
      { icon: Home, label: "Dashboard", href: "/dashboard", badge: null },
    ],
  });
  
  // User Management - Only for Super Admin or Tenant Admin (owner)
  if (isSuperAdmin || isTenantAdmin) {
    sections.push({
      title: "User Management",
      items: [
        { icon: Users, label: "Admin Users", href: "/admin-users", badge: null },
        { icon: Shield, label: "Admin Roles", href: "/admin-roles", badge: null },
      ],
    });
  }
  
  // Operations - Show to all users for now
  const operationsItems = [
    {
      icon: Settings,
      label: "Setups",
      href: "/setups",
      badge: null,
      isNested: true,
      children: [
        {
          icon: Hotel,
          label: "Vendor Hotels",
          href: "/setups?tab=vendor-hotels",
          badge: null,
        },
        {
          icon: Home,
          label: "Guest House Setup",
          href: "/guest-house-setup",
          badge: null,
        },
        {
          icon: Package,
          label: "Stationary & Equipment",
          href: "/inventory",
          badge: null,
        },
        {
          icon: Plane,
          label: "Travel Requirements",
          href: "/travel-requirements",
          badge: null,
        },
        {
          icon: Car,
          label: "Transport Setup",
          href: "/transport-setup",
          badge: null,
        },
      ],
    },
    {
      icon: Calendar,
      label: "Event Management",
      href: "/events",
      badge: null,
    },
    {
      icon: Hotel,
      label: "Visitor Accommodations",
      href: "/accommodation",
      badge: null,
    },
    {
      icon: Car,
      label: "Transport Management",
      href: "/transport",
      badge: null,
    },

  ];
  
  sections.push({
    title: "Operations",
    items: operationsItems,
  });
  
  // Communication - Show all to all users for now
  const communicationItems = [
    {
      icon: Bell,
      label: "Notifications",
      href: "/notifications",
      badge: "notifications",
    },

    {
      icon: User,
      label: "Useful Contacts",
      href: "/useful-contacts",
      badge: null,
    },
    {
      icon: Newspaper,
      label: "News & Updates",
      href: "/news-updates",
      badge: null,
    },
  ];
  
  sections.push({
    title: "Communication",
    items: communicationItems,
  });
  
  return sections;

};

export default function Sidebar({
  collapsed,
  toggleCollapse,
  onMobileClose,
  isMobile = false,
}: SidebarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  
  const { user, isSuperAdmin, isAdmin, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const router = useRouter();
  const pathname = usePathname();
  const {
    user: fullUserData,
    loading: userDataLoading,
    error: userError,
    refetchUser,
  } = useUserData();

  // Use real notifications
  const { stats } = useNotifications();

  // Fetch user roles and check tenant admin status
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (user?.id) {
        try {
          const roles = await apiClient.request<Array<{ role: string }>>(`/user-roles/user/${user.id}`).catch(() => []);
          const roleNames = roles.map((r: { role: string }) => r.role);
          if (user.role) {
            roleNames.push(user.role);
          }
          const uniqueRoles = [...new Set(roleNames)];
          setUserRoles(uniqueRoles);

          // Check if user is tenant admin for current tenant
          const currentTenantSlug = typeof window !== 'undefined' ? window.location.pathname.match(/\/tenant\/([^/]+)/)?.[1] : null;
          if (currentTenantSlug && user.email) {
            try {
              // Try to get the specific tenant by slug instead of all tenants
              const currentTenant = await apiClient.request(`/tenants/slug/${currentTenantSlug}`);
              setIsTenantAdmin(currentTenant?.admin_email === user.email);
            } catch (error) {
              console.error('Error checking tenant admin status:', error);
              setIsTenantAdmin(false);
            }
          }
        } catch (error) {
          console.error('Error fetching user roles:', error);
          setUserRoles(user.role ? [user.role] : []);
          setIsTenantAdmin(false);
        }
      }
    };
    
    fetchUserRoles();
  }, [user?.id, user?.role, user?.email, apiClient]);

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

  const handleNavItemClick = (isNested: boolean = false) => {
    // Collapse all nested menus when clicking a non-nested menu item
    if (!isNested) {
      setExpandedMenus([]);
    }

    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const toggleNestedMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  // Get user initials
  const getUserInitials = (name: string | null | undefined): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  // Format last login
  const formatLastLogin = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getBadgeCount = (badgeType: string | null, itemHref: string) => {
    if (!badgeType) {
      // Special case for chat - show unread count even without badge type
      if (itemHref.includes('/chat')) {
        return unreadChatCount > 0 ? unreadChatCount : null;
      }
      return null;
    }

    switch (badgeType) {
      case "notifications":
        return stats?.unread || 0;
      case "dynamic":
        return 0;
      default:
        return null;
    }
  };

  const displayUser = fullUserData || user;
  const displayName = fullUserData?.full_name || user?.name || user?.email;
  const isTenantPath = pathname?.startsWith('/tenant/');
  const tenantSlugMatch = pathname?.match(/\/tenant\/([^/]+)/);
  const tenantSlug = tenantSlugMatch ? tenantSlugMatch[1] : null;
  
  // Get chat unread count
  const { unreadCount: unreadChatCount } = useChatUnreadCount({ 
    tenantSlug: tenantSlug || 'default', 
    enabled: !!tenantSlug 
  });
  
  const getNavigationItemsWithTenantContext = (userRoles: string[], isTenantPath: boolean, tenantSlug: string | null, isAdmin: boolean, isTenantAdmin: boolean, isSuperAdmin: boolean) => {
    const items = getNavigationItems(userRoles, isAdmin, isTenantAdmin, isSuperAdmin);
    if (isTenantPath && tenantSlug) {
      return items.map(section => ({
        ...section,
        items: section.items.map(item => ({
          ...item,
          href: item.href === '/dashboard' ? `/tenant/${tenantSlug}/dashboard` :
                item.href === '/admin-users' ? `/tenant/${tenantSlug}/admin-users` :
                item.href === '/admin-roles' ? `/tenant/${tenantSlug}/admin-roles` :
                item.href === '/notifications' ? `/tenant/${tenantSlug}/notifications` :
                item.href === '/events' ? `/tenant/${tenantSlug}/events` :
                item.href === '/inventory' ? `/tenant/${tenantSlug}/inventory` :

                item.href === '/chat' ? `/tenant/${tenantSlug}/chat` :
                item.href === '/useful-contacts' ? `/tenant/${tenantSlug}/useful-contacts` :
                item.href === '/news-updates' ? `/tenant/${tenantSlug}/news-updates` :
                item.href === '/accommodation' ? `/tenant/${tenantSlug}/accommodation` :
                item.href === '/transport' ? `/tenant/${tenantSlug}/transport` :
                item.href === '/setups' ? `/tenant/${tenantSlug}/setups` :

                item.href === '/travel-requirements' ? `/tenant/${tenantSlug}/travel-requirements` :
                item.href === '/transport-setup' ? `/tenant/${tenantSlug}/transport-setup` :
                item.href === '/guest-house-setup' ? `/tenant/${tenantSlug}/guest-house-setup` :
                item.href.startsWith('/setups?') ? `/tenant/${tenantSlug}${item.href}` :
                item.href,
          children: item.children ? item.children.map(child => ({
            ...child,
            href: child.href === '/inventory' ? `/tenant/${tenantSlug}/inventory` :
                  child.href === '/travel-requirements' ? `/tenant/${tenantSlug}/travel-requirements` :
                  child.href === '/transport-setup' ? `/tenant/${tenantSlug}/transport-setup` :
                  child.href === '/guest-house-setup' ? `/tenant/${tenantSlug}/guest-house-setup` :
                  child.href.startsWith('/setups?') ? `/tenant/${tenantSlug}${child.href}` :
                  child.href
          })) : undefined
        }))
      }));
    }
    return items;
  };
  
  const navigationItems = getNavigationItemsWithTenantContext(userRoles, isTenantPath, tenantSlug, isAdmin, isTenantAdmin, isSuperAdmin);

  // Auto-expand nested menus when a child is active
  useEffect(() => {
    if (!pathname) return;

    const menusToExpand: string[] = [];
    const navItems = getNavigationItemsWithTenantContext(userRoles, isTenantPath, tenantSlug, isAdmin, isTenantAdmin, isSuperAdmin);

    navItems.forEach(section => {
      section.items.forEach(item => {
        if (item.isNested && item.children) {
          const hasActiveChild = item.children.some(child => {
            if (child.href.includes('?tab=')) {
              const [basePath, query] = child.href.split('?');
              return pathname === basePath && (typeof window !== 'undefined' && window.location.search.includes(query));
            }
            return pathname === child.href;
          });

          if (hasActiveChild) {
            menusToExpand.push(item.label);
          }
        }
      });
    });

    // Only update if there are menus to expand
    if (menusToExpand.length > 0) {
      setExpandedMenus(prev => {
        const newMenus = [...new Set([...prev, ...menusToExpand])];
        // Only update state if the array actually changed
        if (JSON.stringify(prev.sort()) !== JSON.stringify(newMenus.sort())) {
          return newMenus;
        }
        return prev;
      });
    }
  }, [pathname, userRoles, isTenantPath, tenantSlug, isAdmin, isTenantAdmin, isSuperAdmin]);

  return (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <div
        className={cn(
          "text-white transition-all duration-300 flex flex-col shadow-2xl relative z-50 h-screen",
          "border-r border-red-700/50",
          "bg-[#ee0000]",
          isMobile
            ? "fixed left-0 top-0 h-full w-80"
            : collapsed
            ? "w-20"
            : "w-80"
        )}
      >
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-red-700/50 bg-black/10">
          <div className="flex items-center justify-between">
            {/* Logo and Title - Hidden when collapsed */}
            {(!collapsed || isMobile) && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-2 shadow-sm">
                  <Image
                    src="/icon/favicon.png"
                    alt="MSF Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                    style={{ width: "auto", height: "auto" }}
                  />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white">MSF Msafiri</h1>
                  <p className="text-xs text-red-200">Admin Portal</p>
                </div>
              </div>
            )}

            {/* Expand button when collapsed (desktop only) */}
            {collapsed && !isMobile && (
              <div className="w-full flex justify-center">
                <Tooltip content="Expand sidebar">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCollapse}
                    className="text-white hover:bg-white/20 p-2 h-10 w-10 border border-white/20 bg-white/10 backdrop-blur-sm rounded-lg"
                  >
                    <PanelLeftOpen className="h-5 w-5" />
                  </Button>
                </Tooltip>
              </div>
            )}

            {/* Collapse button when expanded (desktop only) */}
            {!collapsed && !isMobile && (
              <Tooltip content="Collapse sidebar">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleCollapse}
                  className="text-white hover:bg-white/20 p-1 h-8 w-8 border border-white/20 bg-white/10 backdrop-blur-sm"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </Tooltip>
            )}

            {/* Mobile close button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileClose}
                className="text-white hover:bg-white/10 p-1 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* User Info */}
        {(!collapsed || isMobile) && (
          <div className="p-4 border-b border-red-700/50 bg-black/10">
            {authLoading || userDataLoading ? (
              <div className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-white/20"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/20 rounded mb-2"></div>
                    <div className="h-3 bg-white/20 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ) : displayUser ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12 border-2 border-red-500/50">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                      {getUserInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {displayName || "User"}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Shield className="h-3 w-3 text-red-200" />
                      <p className="text-xs text-red-200 truncate">
                        {AuthUtils.getRoleDisplayName(user?.role || "")}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserDetails(!showUserDetails)}
                    className="text-red-200 hover:bg-white/10 p-1 h-6 w-6"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform",
                        showUserDetails && "rotate-180"
                      )}
                    />
                  </Button>
                </div>

                {/* Expandable user details */}
                {showUserDetails && (
                  <div className="pt-3 border-t border-red-600/30 space-y-2">
                    {fullUserData?.department && (
                      <div className="flex items-center space-x-2 text-xs">
                        <Building2 className="h-3 w-3 text-red-300" />
                        <span className="text-red-100">
                          {fullUserData.department}
                        </span>
                      </div>
                    )}

                    {fullUserData?.job_title && (
                      <div className="flex items-center space-x-2 text-xs">
                        <User className="h-3 w-3 text-red-300" />
                        <span className="text-red-100">
                          {fullUserData.job_title}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-xs">
                      <Clock className="h-3 w-3 text-red-300" />
                      <span className="text-red-100">
                        Last login: {formatLastLogin(fullUserData?.last_login)}
                      </span>
                    </div>

                    {userError && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-red-300">
                          Profile load failed
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={refetchUser}
                          className="text-red-300 hover:bg-red-500/10 p-1 h-5"
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-red-200 text-sm py-2">
                No user data available
              </div>
            )}
          </div>
        )}

        {/* Collapsed user avatar */}
        {collapsed && !isMobile && user && (
          <div className="p-3 border-b border-red-700/50 flex justify-center">
            <Tooltip content={displayName || "User Profile"}>
              <Avatar className="h-10 w-10 border-2 border-red-500/50">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm">
                  {getUserInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </Tooltip>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {navigationItems.map((section, idx) => (
            <div key={idx} className="mb-6">
              {(!collapsed || isMobile) && (
                <div className="px-4 lg:px-6 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-[2px] w-6 bg-gradient-to-r from-white/60 to-transparent rounded-full"></div>
                    <p className="text-[10px] uppercase tracking-wider text-white/90 font-semibold drop-shadow-lg">
                      {section.title}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2 px-2 lg:px-3">
                {section.items.map((item, index) => {
                  const hasActiveChild = item.children && item.children.some(child => {
                    if (child.href.includes('?tab=')) {
                      // For tab-based URLs, check if pathname + search params match
                      const [basePath, query] = child.href.split('?');
                      return pathname === basePath && (typeof window !== 'undefined' && window.location.search.includes(query));
                    }
                    return pathname === child.href;
                  });
                  const isActive = pathname === item.href || hasActiveChild;
                  const badgeCount = getBadgeCount(item.badge, item.href);
                  const isExpanded = expandedMenus.includes(item.label);

                  return (
                    <div key={index}>
                      {/* Main menu item */}
                      {item.isNested ? (
                        <div>
                          <button
                            onClick={() => {
                              if (!collapsed || isMobile) {
                                toggleNestedMenu(item.label);
                              }
                            }}
                            className={cn(
                              "w-full flex items-center px-2 lg:px-3 py-2 text-left transition-all duration-300 rounded-xl group relative overflow-hidden",
                              "hover:scale-[1.02] active:scale-[0.98]",
                              isActive
                                ? "bg-gradient-to-r from-white/20 to-white/10 text-white shadow-xl backdrop-blur-md border-2 border-white/30"
                                : "text-red-100 hover:bg-white/10 hover:text-white border-2 border-transparent"
                            )}
                          >
                            {isActive && (
                              <>
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-white via-white/90 to-white/80 rounded-r-full shadow-lg" />
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
                              </>
                            )}

                            <div className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                              isActive
                                ? "bg-white/20 shadow-lg ring-2 ring-white/40"
                                : "bg-white/5 group-hover:bg-white/15"
                            )}>
                              <item.icon
                                className={cn(
                                  "h-4 w-4 flex-shrink-0 transition-all duration-300",
                                  isActive
                                    ? "text-white drop-shadow-lg"
                                    : "text-red-200 group-hover:text-white group-hover:scale-110"
                                )}
                              />
                            </div>

                            {(!collapsed || isMobile) && (
                              <>
                                <span className={cn(
                                  "ml-3 font-medium text-xs flex-1 transition-all duration-300",
                                  isActive ? "text-white" : ""
                                )}>
                                  {item.label}
                                </span>
                                <ChevronRight
                                  className={cn(
                                    "h-4 w-4 transition-all duration-300",
                                    isExpanded && "rotate-90",
                                    isActive ? "text-white" : "text-red-300"
                                  )}
                                />
                              </>
                            )}
                          </button>

                          {/* Nested items */}
                          {(!collapsed || isMobile) && isExpanded && item.children && (
                            <div className="ml-6 mt-1.5 space-y-1 border-l-2 border-white/20 pl-3">
                              {item.children.map((child, childIndex) => {
                                let childIsActive = false;
                                if (child.href.includes('?tab=')) {
                                  const [basePath, query] = child.href.split('?');
                                  childIsActive = pathname === basePath && (typeof window !== 'undefined' && window.location.search.includes(query));
                                } else {
                                  childIsActive = pathname === child.href;
                                }

                                return (
                                  <Link key={childIndex} href={child.href}>
                                    <button
                                      onClick={() => {
                                        // Ensure parent menu stays expanded when clicking child
                                        if (!expandedMenus.includes(item.label)) {
                                          setExpandedMenus(prev => [...prev, item.label]);
                                        }
                                        handleNavItemClick(true);
                                      }}
                                      className={cn(
                                        "w-full flex items-center px-2 py-1.5 text-left transition-all duration-300 rounded-lg group relative overflow-hidden",
                                        "hover:scale-[1.02] active:scale-[0.98]",
                                        childIsActive
                                          ? "bg-gradient-to-r from-white/25 to-white/15 text-white shadow-xl backdrop-blur-md border-2 border-white/40"
                                          : "text-red-100 hover:bg-white/10 hover:text-white border-2 border-transparent hover:border-white/20"
                                      )}
                                    >
                                      {childIsActive && (
                                        <>
                                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-white via-white/90 to-white/80 rounded-r-full shadow-lg" />
                                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-60 animate-pulse" />
                                        </>
                                      )}

                                      <div className={cn(
                                        "flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300",
                                        childIsActive
                                          ? "bg-white/30 shadow-lg ring-2 ring-white/50"
                                          : "bg-white/5 group-hover:bg-white/15"
                                      )}>
                                        <child.icon
                                          className={cn(
                                            "h-3.5 w-3.5 flex-shrink-0 transition-all duration-300",
                                            childIsActive
                                              ? "text-white drop-shadow-lg scale-110"
                                              : "text-red-200 group-hover:text-white group-hover:scale-110"
                                          )}
                                        />
                                      </div>
                                      <span className={cn(
                                        "ml-2 font-medium text-[11px] transition-all duration-300",
                                        childIsActive ? "text-white" : ""
                                      )}>
                                        {child.label}
                                      </span>
                                    </button>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link href={item.href}>
                          <button
                            onClick={() => handleNavItemClick(false)}
                            className={cn(
                              "w-full flex items-center px-2 lg:px-3 py-2 text-left transition-all duration-300 rounded-xl group relative overflow-hidden",
                              "hover:scale-[1.02] active:scale-[0.98]",
                              isActive
                                ? "bg-gradient-to-r from-white/20 to-white/10 text-white shadow-xl backdrop-blur-md border-2 border-white/30"
                                : "text-red-100 hover:bg-white/10 hover:text-white border-2 border-transparent"
                            )}
                          >
                            {isActive && (
                              <>
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-white via-white/90 to-white/80 rounded-r-full shadow-lg" />
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
                              </>
                            )}

                            <div className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                              isActive
                                ? "bg-white/20 shadow-lg ring-2 ring-white/40"
                                : "bg-white/5 group-hover:bg-white/15"
                            )}>
                              <item.icon
                                className={cn(
                                  "h-4 w-4 flex-shrink-0 transition-all duration-300",
                                  isActive
                                    ? "text-white drop-shadow-lg"
                                    : "text-red-200 group-hover:text-white group-hover:scale-110"
                                )}
                              />
                            </div>

                            {(!collapsed || isMobile) && (
                              <>
                                <span className={cn(
                                  "ml-3 font-medium text-xs flex-1 transition-all duration-300",
                                  isActive ? "text-white" : ""
                                )}>
                                  {item.label}
                                </span>
                                {badgeCount !== null && badgeCount > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-auto bg-gradient-to-r from-white to-white/90 text-red-900 text-[10px] font-bold px-2 py-0.5 shadow-lg ring-2 ring-white/50 animate-pulse"
                                  >
                                    {badgeCount > 99 ? "99+" : badgeCount}
                                  </Badge>
                                )}
                              </>
                            )}

                            {collapsed &&
                              !isMobile &&
                              badgeCount !== null &&
                              badgeCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-white to-white/90 rounded-full flex items-center justify-center text-xs font-bold text-red-900 shadow-lg ring-2 ring-white/30 animate-pulse">
                                  {badgeCount > 9 ? "9+" : badgeCount}
                                </div>
                              )}
                          </button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* System Settings for Super Admin or Tenant Admin */}
          {(isSuperAdmin || isTenantPath) && (
            <div className="mb-6">
              {(!collapsed || isMobile) && (
                <div className="px-4 lg:px-6 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-[2px] w-6 bg-gradient-to-r from-white/60 to-transparent rounded-full"></div>
                    <p className="text-[10px] uppercase tracking-wider text-white/90 font-semibold drop-shadow-lg">
                      System
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2 px-2 lg:px-3">
                <Link href="/admin/system">
                  {collapsed && !isMobile ? (
                    <Tooltip content="System Settings">
                      <button
                        onClick={() => handleNavItemClick(false)}
                        className={cn(
                          "w-full flex items-center px-2 lg:px-3 py-2 text-left transition-all duration-300 rounded-xl group relative overflow-hidden",
                          "hover:scale-[1.02] active:scale-[0.98]",
                          pathname === "/admin/system"
                            ? "bg-gradient-to-r from-white/20 to-white/10 text-white shadow-xl backdrop-blur-md border-2 border-white/30"
                            : "text-red-100 hover:bg-white/10 hover:text-white border-2 border-transparent"
                        )}
                      >
                        {pathname === "/admin/system" && (
                          <>
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-white via-white/90 to-white/80 rounded-r-full shadow-lg" />
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
                          </>
                        )}

                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                          pathname === "/admin/system"
                            ? "bg-white/20 shadow-lg ring-2 ring-white/40"
                            : "bg-white/5 group-hover:bg-white/15"
                        )}>
                          <Settings
                            className={cn(
                              "h-4 w-4 flex-shrink-0 transition-all duration-300",
                              pathname === "/admin/system"
                                ? "text-white drop-shadow-lg"
                                : "text-red-200 group-hover:text-white group-hover:scale-110"
                            )}
                          />
                        </div>
                      </button>
                    </Tooltip>
                  ) : (
                    <button
                      onClick={() => handleNavItemClick(false)}
                      className={cn(
                        "w-full flex items-center px-2 lg:px-3 py-2 text-left transition-all duration-300 rounded-xl group relative overflow-hidden",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        pathname === "/admin/system"
                          ? "bg-gradient-to-r from-white/20 to-white/10 text-white shadow-xl backdrop-blur-md border-2 border-white/30"
                          : "text-red-100 hover:bg-white/10 hover:text-white border-2 border-transparent"
                      )}
                    >
                      {pathname === "/admin/system" && (
                        <>
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-white via-white/90 to-white/80 rounded-r-full shadow-lg" />
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
                        </>
                      )}

                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                        pathname === "/admin/system"
                          ? "bg-white/20 shadow-lg ring-2 ring-white/40"
                          : "bg-white/5 group-hover:bg-white/15"
                      )}>
                        <Settings
                          className={cn(
                            "h-4 w-4 flex-shrink-0 transition-all duration-300",
                            pathname === "/admin/system"
                              ? "text-white drop-shadow-lg"
                              : "text-red-200 group-hover:text-white group-hover:scale-110"
                          )}
                        />
                      </div>

                      {(!collapsed || isMobile) && (
                        <span className={cn(
                          "ml-3 font-medium text-xs transition-all duration-300",
                          pathname === "/admin/system" ? "text-white" : ""
                        )}>
                          System Settings
                        </span>
                      )}
                    </button>
                  )}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-red-700/50 bg-black/10">
          {collapsed && !isMobile ? (
            <Tooltip content="Sign Out">
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={cn(
                  "w-full justify-center text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-colors rounded-lg",
                  "border border-transparent hover:border-red-500/30",
                  "px-2"
                )}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
              </Button>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                "w-full justify-start text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-colors rounded-lg",
                "border border-transparent hover:border-red-500/30",
                "px-4"
              )}
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
              <span className="ml-3 font-medium text-xs">
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </span>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
