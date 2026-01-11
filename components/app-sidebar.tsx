"use client";

import * as React from "react";
import {
  Users,
  Calendar,
  Bell,
  Home,
  Settings,
  Building2,
  User,
  Newspaper,
  Plus,
  Menu,
  X,
  LogOut,
  Shield,
  Loader2,
  ChevronRight,
  Package,
  Hotel,
  Car,
  Plane,
  Award,
  Mail,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, AuthUtils, useAuthenticatedApi } from "@/lib/auth";
import { useUserData } from "@/hooks/useUserData";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const getNavigationItems = (userRoles: string[], isAdmin: boolean, isTenantAdmin: boolean, isSuperAdmin: boolean) => {
  const sections = [];
  
  const hasRealAdminRoles = isTenantAdmin || isSuperAdmin || 
    userRoles.some(role => ['SUPER_ADMIN', 'super_admin', 'MT_ADMIN', 'mt_admin', 'HR_ADMIN', 'hr_admin', 'EVENT_ADMIN', 'event_admin'].includes(role));
  
  const isVettingCommitteeOnly = userRoles.some(role => ['vetting_committee', 'VETTING_COMMITTEE'].includes(role)) && !hasRealAdminRoles;
  const isApproverOnly = userRoles.some(role => ['vetting_approver', 'VETTING_APPROVER'].includes(role)) && !hasRealAdminRoles;

  if (isVettingCommitteeOnly || isApproverOnly) {
    sections.push({
      title: "Overview",
      items: [
        { icon: Home, label: "Dashboard", href: "/dashboard", badge: null },
      ],
    });

    sections.push({
      title: "Operations",
      items: [
        {
          icon: Calendar,
          label: "Event Management",
          href: "/events",
          badge: null,
        },
      ],
    });

    sections.push({
      title: "Communication",
      items: [
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
      ],
    });

    return sections;
  }

  sections.push({
    title: "Overview",
    items: [
      { icon: Home, label: "Dashboard", href: "/dashboard", badge: null },
    ],
  });

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
          href: "/vendor-hotels",
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
        {
          icon: Newspaper,
          label: "Code of Conduct",
          href: "/code-of-conduct",
          badge: null,
        },
        {
          icon: Award,
          label: "Certificate Design",
          href: "/setups/certificates",
          badge: null,
        },
        {
          icon: Mail,
          label: "LOI Design",
          href: "/setups/invitations",
          badge: null,
        },
        {
          icon: Award,
          label: "Badge Design",
          href: "/setups/badges",
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

  sections.push({
    title: "System",
    items: [
      { icon: Settings, label: "System Settings", href: "/settings", badge: null },
    ],
  });

  if (isSuperAdmin || isTenantAdmin) {
    sections.push({
      title: "User Management",
      items: [
        { icon: Users, label: "Admin Users", href: "/admin-users", badge: null },
      ],
    });
  }

  return sections;
};

interface CustomSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function CustomSidebar({ isCollapsed, onToggle, isMobile = false }: CustomSidebarProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  
  const { user, isSuperAdmin, isAdmin, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const router = useRouter();
  const pathname = usePathname();
  const {
    user: fullUserData,
    loading: userDataLoading,
  } = useUserData();

  const { stats } = useNotifications();

  useEffect(() => {
    setMounted(true);
    
    // Auto-expand Setups menu if on a setup-related page
    const setupPaths = [
      '/vendor-hotels',
      '/guest-house-setup', 
      '/inventory',
      '/travel-requirements',
      '/transport-setup',
      '/code-of-conduct',
      '/setups/certificates',
      '/setups/invitations', 
      '/setups/badges'
    ];
    
    const normalizedPathname = pathname?.replace('/portal', '') || '';
    const isOnSetupPage = setupPaths.some(path => 
      normalizedPathname.includes(path)
    );
    
    if (isOnSetupPage) {
      setExpandedMenus(prev => new Set([...prev, 'Setups']));
    }
  }, [pathname]);

  const isDark = resolvedTheme === 'dark';
  const isTenantPath = pathname?.startsWith('/tenant/');
  const tenantSlugMatch = pathname?.match(/\/tenant\/([^/]+)/);
  const tenantSlug = tenantSlugMatch ? tenantSlugMatch[1] : null;

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

          if (tenantSlug && user.email) {
            try {
              const currentTenant = await apiClient.request(`/tenants/slug/${tenantSlug}`);
              setIsTenantAdmin((currentTenant as any)?.admin_email === user.email);
              setTenantName((currentTenant as any)?.name || null);
            } catch (error) {
              setIsTenantAdmin(false);
              setTenantName(null);
            }
          } else {
            setTenantName(null);
          }
        } catch (error) {
          setUserRoles(user.role ? [user.role] : []);
          setIsTenantAdmin(false);
          setTenantName(null);
        }
      }
    };
    
    fetchUserRoles();
  }, [user?.id, user?.role, user?.email, apiClient, pathname, tenantSlug]);

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

  const toggleMenu = (menuLabel: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuLabel)) {
        newSet.delete(menuLabel);
      } else {
        newSet.add(menuLabel);
      }
      return newSet;
    });
  };

  const getBadgeCount = (badgeType: string | null) => {
    if (!badgeType) return null;
    switch (badgeType) {
      case "notifications":
        return stats?.unread || 0;
      default:
        return null;
    }
  };

  const displayUser = fullUserData || user;
  const displayName = fullUserData?.full_name || user?.name || user?.email;
  
  const getNavigationItemsWithTenantContext = (userRoles: string[], isTenantPath: boolean, tenantSlug: string | null, isAdmin: boolean, isTenantAdmin: boolean, isSuperAdmin: boolean) => {
    const items = getNavigationItems(userRoles, isAdmin, isTenantAdmin, isSuperAdmin);
    if (isTenantPath && tenantSlug) {
      return items.map(section => ({
        ...section,
        items: section.items.map(item => ({
          ...item,
          href: item.href === '/dashboard' ? `/tenant/${tenantSlug}/dashboard` :
                item.href === '/admin-users' ? `/tenant/${tenantSlug}/admin-users` :
                item.href === '/notifications' ? `/tenant/${tenantSlug}/notifications` :
                item.href === '/events' ? `/tenant/${tenantSlug}/events` :
                item.href === '/inventory' ? `/tenant/${tenantSlug}/inventory` :
                item.href === '/vendor-hotels' ? `/tenant/${tenantSlug}/vendor-hotels` :
                item.href === '/useful-contacts' ? `/tenant/${tenantSlug}/useful-contacts` :
                item.href === '/news-updates' ? `/tenant/${tenantSlug}/news-updates` :
                item.href === '/accommodation' ? `/tenant/${tenantSlug}/accommodation` :
                item.href === '/transport' ? `/tenant/${tenantSlug}/transport` :
                item.href === '/setups' ? `/tenant/${tenantSlug}/setups` :
                item.href === '/travel-requirements' ? `/tenant/${tenantSlug}/travel-requirements` :
                item.href === '/transport-setup' ? `/tenant/${tenantSlug}/transport-setup` :
                item.href === '/guest-house-setup' ? `/tenant/${tenantSlug}/guest-house-setup` :
                item.href === '/settings' ? `/tenant/${tenantSlug}/settings` :
                item.href,
          children: (item as any).children ? (item as any).children.map((child: any) => ({
            ...child,
            href: child.href === '/inventory' ? `/tenant/${tenantSlug}/inventory` :
                  child.href === '/vendor-hotels' ? `/tenant/${tenantSlug}/vendor-hotels` :
                  child.href === '/travel-requirements' ? `/tenant/${tenantSlug}/travel-requirements` :
                  child.href === '/transport-setup' ? `/tenant/${tenantSlug}/transport-setup` :
                  child.href === '/guest-house-setup' ? `/tenant/${tenantSlug}/guest-house-setup` :
                  child.href === '/code-of-conduct' ? `/tenant/${tenantSlug}/code-of-conduct` :
                  child.href === '/setups/certificates' ? `/tenant/${tenantSlug}/setups/certificates` :
                  child.href === '/setups/invitations' ? `/tenant/${tenantSlug}/setups/invitations` :
                  child.href === '/setups/badges' ? `/tenant/${tenantSlug}/setups/badges` :
                  child.href
          })) : undefined
        }))
      }));
    }
    return items;
  };
  
  const navigationItems = getNavigationItemsWithTenantContext(userRoles, isTenantPath, tenantSlug, isAdmin, isTenantAdmin, isSuperAdmin);

  if (!mounted) return null;

  return (
    <TooltipProvider>
      {/* Sidebar */}
      <div 
        className={`${isMobile ? 'relative' : 'sticky top-0'} h-full bg-gray-50 dark:bg-black border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {isCollapsed ? (
              <button
                onClick={onToggle}
                className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 h-8 w-8 flex items-center justify-center"
              >
                <Menu className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            ) : (
              <>
                <div className="w-8 h-8 bg-white p-1.5 shadow-sm rounded">
                  <Image
                    src="/portal/icon/favicon.png"
                    alt="MSF Logo"
                    width={20}
                    height={20}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xs font-medium text-gray-900 dark:text-white">MSF Msafiri</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{tenantName || "Admin Portal"}</p>
                </div>
                <button
                  onClick={onToggle}
                  className="ml-auto p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 h-8 w-8 flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
            {authLoading || userDataLoading ? (
              <div className="animate-pulse flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                </div>
              </div>
            ) : displayUser ? (
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  {fullUserData?.avatar_url && (
                    <AvatarImage src={fullUserData.avatar_url} alt="Avatar" className="object-cover" />
                  )}
                  <AvatarFallback className="bg-black text-white font-semibold text-sm">
                    {getUserInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {displayName || "User"}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Shield className="h-3 w-3 text-gray-500" />
                    <p className="text-xs text-gray-500 truncate">
                      {AuthUtils.getRoleDisplayName(user?.role || "")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm py-2 text-gray-500">
                No user data available
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 p-4 min-h-0">
          {navigationItems.map((section, idx) => (
            <div key={idx} className="mb-6">
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
              )}
              <nav className="space-y-1">
                {section.items.map((item, index) => {
                  const normalizedPathname = pathname?.replace('/portal', '') || '';
                  const normalizedItemHref = item.href.replace('/portal', '');
                  const isActive = normalizedPathname === normalizedItemHref || normalizedPathname?.startsWith(normalizedItemHref + '/');
                  const badgeCount = getBadgeCount(item.badge);

                  return (
                    <div key={index}>
                      {(item as any).isNested ? (
                        isCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={`flex items-center justify-center p-0.5 rounded-md transition-colors cursor-pointer ${
                                isActive 
                                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}>
                                <item.icon className="h-16 w-16" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-gray-900 text-white border border-gray-700">
                              <p>{item.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="space-y-1">
                            <button
                              onClick={() => toggleMenu(item.label)}
                              className={`w-full flex items-center px-2 py-1.5 text-xs font-medium rounded-md ${
                                isActive 
                                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              <item.icon className="h-4 w-4 mr-2" />
                              <span className="flex-1 text-left text-xs">{item.label}</span>
                              <ChevronRight className={`h-3 w-3 transition-transform ${
                                expandedMenus.has(item.label) ? 'rotate-90' : ''
                              }`} />
                            </button>
                            {expandedMenus.has(item.label) && (item as any).children && (
                              <div className="ml-4 space-y-1">
                                {(item as any).children.map((child: any, childIndex: number) => {
                                  const normalizedChildHref = child.href.replace('/portal', '');
                                  const childIsActive = normalizedPathname === normalizedChildHref || normalizedPathname?.startsWith(normalizedChildHref + '/');
                                  return (
                                    <Link
                                      key={childIndex}
                                      href={child.href}
                                      className={`flex items-center px-2 py-1.5 text-xs rounded-md ${
                                        childIsActive 
                                          ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                      }`}
                                    >
                                      <child.icon className="h-3 w-3 mr-2" />
                                      <span>{child.label}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )
                      ) : isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.href}
                              className={`flex items-center justify-center p-0.5 rounded-md transition-colors ${
                                isActive 
                                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              <item.icon className="h-16 w-16" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-gray-900 text-white border border-gray-700">
                            <p>{item.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Link
                          href={item.href}
                          className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
                            isActive 
                              ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-xs font-medium">{item.label}</span>
                          {badgeCount !== null && badgeCount > 0 && (
                            <Badge className="ml-auto bg-red-500 text-white text-xs">
                              {badgeCount > 99 ? "99+" : badgeCount}
                            </Badge>
                          )}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
              isCollapsed ? 'px-2' : ''
            }`}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {!isCollapsed && (
              <span className="ml-2 text-xs">
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </span>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
