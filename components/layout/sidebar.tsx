import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import {
  Users,
  Calendar,
  Bell,
  Shield,
  Home,
  LogOut,
  Settings,
  Loader2,
  Building2,
  User,
  Clock,
  ChevronRight,
  Package,
  Hotel,
  Car,
  Plane,
  Newspaper,
  Award,
  Mail,
} from "lucide-react";
import { useAuth, AuthUtils, useAuthenticatedApi } from "@/lib/auth";
import { useUserData } from "@/hooks/useUserData";
import { useNotifications } from "@/hooks/useNotifications";

import { useTheme } from "next-themes";

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

import { useEffect, useState } from "react";

export default function AppSidebar() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tenantName, setTenantName] = useState<string | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  
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

  const { stats } = useNotifications();

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

          const currentTenantSlug = typeof window !== 'undefined' ? window.location.pathname.match(/\/tenant\/([^/]+)/)?.[1] : null;
          if (currentTenantSlug && user.email) {
            try {
              const currentTenant = await apiClient.request(`/tenants/slug/${currentTenantSlug}`);
              setIsTenantAdmin((currentTenant as any)?.admin_email === user.email);
              setTenantName((currentTenant as any)?.name || null);
            } catch (error) {
              console.error('Error checking tenant admin status:', error);
              setIsTenantAdmin(false);
              setTenantName(null);
            }
          } else {
            setTenantName(null);
          }
        } catch (error) {
          console.error('Error fetching user roles:', error);
          setUserRoles(user.role ? [user.role] : []);
          setIsTenantAdmin(false);
          setTenantName(null);
        }
      }
    };
    
    fetchUserRoles();
  }, [user?.id, user?.role, user?.email, apiClient, pathname]);

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

  const getUserInitials = (name: string | null | undefined): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const getBadgeCount = (badgeType: string | null, itemHref: string) => {
    if (!badgeType) {
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

  if (!mounted) {
    return null;
  }

  return (
    <Sidebar 
      className="text-white border-r scrollbar-hide"
      style={{
        backgroundColor: isDark ? '#000000' : '#dc2626',
        borderColor: isDark ? '#333333' : '#dc2626',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <SidebarHeader 
        className="border-b bg-black/10 dark:bg-black/20 h-16 flex items-center px-4"
        style={{
          borderColor: isDark ? '#333333' : '#dc2626'
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-2 shadow-sm">
            <Image
              src="/portal/icon/favicon.png"
              alt="MSF Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              style={{ width: "auto", height: "auto" }}
            />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">MSF Msafiri</h1>
            <p className="text-xs text-red-200">{tenantName || "Admin Portal"}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarGroup 
        className="border-b bg-black/10 dark:bg-black/20 p-4"
        style={{
          borderColor: isDark ? '#333333' : '#dc2626'
        }}
      >
        {authLoading || userDataLoading ? (
          <div className="animate-pulse flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-white/20"></div>
            <div className="flex-1">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-3/4"></div>
            </div>
          </div>
        ) : displayUser ? (
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-black text-white font-semibold">
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
          </div>
        ) : (
          <div className="text-center text-red-200 text-sm py-2">
            No user data available
          </div>
        )}
      </SidebarGroup>

      <SidebarContent className="scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {navigationItems.map((section, idx) => (
          <SidebarGroup key={idx}>
            <SidebarGroupLabel className="text-white/90 font-semibold">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item, index) => {
                  const normalizedPathname = pathname?.replace('/portal', '') || '';
                  const normalizedItemHref = item.href.replace('/portal', '');
                  const isActive = normalizedPathname === normalizedItemHref || normalizedPathname?.startsWith(normalizedItemHref + '/');
                  const badgeCount = getBadgeCount(item.badge, item.href);

                  return (
                    <SidebarMenuItem key={index}>
                      {(item as any).isNested ? (
                        <>
                          <SidebarMenuButton
                            isActive={isActive}
                            className="text-red-100 hover:bg-white/10 hover:text-white data-[active=true]:bg-white/20 data-[active=true]:text-white"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                            <ChevronRight className="ml-auto h-4 w-4" />
                          </SidebarMenuButton>
                          <SidebarMenuSub>
                            {(item as any).children?.map((child: any, childIndex: number) => {
                              const normalizedChildHref = child.href.replace('/portal', '');
                              const childIsActive = normalizedPathname === normalizedChildHref || normalizedPathname?.startsWith(normalizedChildHref + '/');
                              
                              return (
                                <SidebarMenuSubItem key={childIndex}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={childIsActive}
                                    className="text-red-100 hover:bg-white/10 hover:text-white data-[active=true]:bg-white/25 data-[active=true]:text-white"
                                  >
                                    <Link href={child.href}>
                                      <child.icon className="h-3.5 w-3.5" />
                                      <span>{child.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="text-red-100 hover:bg-white/10 hover:text-white data-[active=true]:bg-white/20 data-[active=true]:text-white"
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                            {badgeCount !== null && badgeCount > 0 && (
                              <SidebarMenuBadge className="bg-white text-red-900">
                                {badgeCount > 99 ? "99+" : badgeCount}
                              </SidebarMenuBadge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        
        {(isSuperAdmin || isTenantPath) && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-white/90 font-semibold">
              System
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/admin/system" || pathname?.startsWith("/admin/system/")}
                    className="text-red-100 hover:bg-white/10 hover:text-white data-[active=true]:bg-white/20 data-[active=true]:text-white"
                  >
                    <Link href="/admin/system">
                      <Settings className="h-4 w-4" />
                      <span>System Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter
        className="border-t bg-black/10 dark:bg-black/20 py-[6px] px-4"
        style={{
          borderColor: isDark ? '#333333' : '#dc2626'
        }}
      >

        <Button
          variant="ghost"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full justify-start text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-colors"
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
      </SidebarFooter>
    </Sidebar>
  );
}