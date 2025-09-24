"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Building2,
  Users,
  UserCheck,
  Shield,
  Loader2,
  TrendingUp,
  Mail,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthenticatedApi } from "@/lib/auth";

interface SuperAdmin {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

interface PendingInvitation {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
  invited_at?: string;
  expires_at?: string;
  status?: string;
}

interface TenantStats {
  current: {
    active: number;
    total: number;
    inactive: number;
  };
  previous: {
    active: number;
    total: number;
    inactive: number;
  };
}

interface SuperAdminStats {
  current: number;
  previous: number;
}

const STAT_THEMES = {
  active: {
    gradient: "from-red-500 to-red-600",
    bgGradient: "from-red-50 to-red-50",
    shadowColor: "shadow-red-500/20",
    iconBg: "bg-gradient-to-br from-red-100 to-red-200",
    textColor: "text-red-700",
    trendColor: "text-red-600",
  },
  total: {
    gradient: "from-blue-500 to-indigo-600",
    bgGradient: "from-blue-50 to-indigo-50",
    shadowColor: "shadow-blue-500/20",
    iconBg: "bg-gradient-to-br from-blue-100 to-indigo-200",
    textColor: "text-blue-700",
    trendColor: "text-blue-600",
  },
  inactive: {
    gradient: "from-amber-500 to-orange-600",
    bgGradient: "from-amber-50 to-orange-50",
    shadowColor: "shadow-amber-500/20",
    iconBg: "bg-gradient-to-br from-amber-100 to-orange-200",
    textColor: "text-amber-700",
    trendColor: "text-amber-600",
  },
  "super-admins": {
    gradient: "from-violet-500 to-purple-600",
    bgGradient: "from-violet-50 to-purple-50",
    shadowColor: "shadow-violet-500/20",
    iconBg: "bg-gradient-to-br from-violet-100 to-purple-200",
    textColor: "text-violet-700",
    trendColor: "text-violet-600",
  },
  "pending-invitations": {
    gradient: "from-emerald-500 to-teal-600",
    bgGradient: "from-emerald-50 to-teal-50",
    shadowColor: "shadow-emerald-500/20",
    iconBg: "bg-gradient-to-br from-emerald-100 to-teal-200",
    textColor: "text-emerald-700",
    trendColor: "text-emerald-600",
  },
} as const;

interface StatsCardsProps {
  activeTenants: number;
  totalTenants: number;
  inactiveTenants: number;
  onCardClick: (type: "active" | "total" | "inactive" | "super-admins" | "pending-invitations") => void;
  selectedCard: string | null;
  loading?: boolean;
}

export default function EnhancedStatsCards({
  activeTenants,
  totalTenants,
  inactiveTenants,
  onCardClick,
  selectedCard,
  loading = false,
}: StatsCardsProps) {
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [superAdminsLoading, setSuperAdminsLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [pendingInvitationsLoading, setPendingInvitationsLoading] = useState(false);
  const [tenantStats, setTenantStats] = useState<TenantStats | null>(null);
  const [superAdminStats, setSuperAdminStats] =
    useState<SuperAdminStats | null>(null);

  const { apiClient } = useAuthenticatedApi();

  const fetchSuperAdmins = useCallback(async () => {
    setSuperAdminsLoading(true);
    try {
      const data = await apiClient.getSuperAdmins();
      setSuperAdmins(data);

      // Calculate super admin stats based on created_at dates
      const now = new Date();
      const lastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
      );

      const current = data.length;
      const previous = data.filter(
        (admin) => new Date(admin.created_at) <= lastMonth
      ).length;

      setSuperAdminStats({ current, previous });
    } catch {
    } finally {
      setSuperAdminsLoading(false);
    }
  }, [apiClient]);

  const fetchPendingInvitations = useCallback(async () => {
    setPendingInvitationsLoading(true);
    try {
      const data = await apiClient.getPendingInvitations();
      setPendingInvitations(data);
    } catch {
    } finally {
      setPendingInvitationsLoading(false);
    }
  }, [apiClient]);

  const calculateTrend = useCallback(
    (current: number, previous: number): string => {
      const change = current - previous;
      if (change === 0) return "No change";
      return change > 0
        ? `+${change} from last month`
        : `${change} from last month`;
    },
    []
  );

  const fetchTenantStats = useCallback(async () => {
    try {
      const tenants = await apiClient.getTenants();
      const now = new Date();
      const lastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
      );

      const current = {
        active: tenants.filter((t) => t.is_active).length,
        total: tenants.length,
        inactive: tenants.filter((t) => !t.is_active).length,
      };

      const previous = {
        active: tenants.filter(
          (t) => t.is_active && new Date(t.created_at) <= lastMonth
        ).length,
        total: tenants.filter((t) => new Date(t.created_at) <= lastMonth)
          .length,
        inactive: tenants.filter(
          (t) => !t.is_active && new Date(t.created_at) <= lastMonth
        ).length,
      };

      setTenantStats({ current, previous });
    } catch {
    }
  }, [apiClient]);

  useEffect(() => {
    fetchSuperAdmins();
    fetchTenantStats();
    fetchPendingInvitations();
    
    const handleRefresh = () => {
      fetchPendingInvitations();
    };
    
    window.addEventListener('refreshPendingInvitations', handleRefresh);
    return () => window.removeEventListener('refreshPendingInvitations', handleRefresh);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const statsData = useMemo(
    () => [
      {
        id: "active" as const,
        title: "Active Tenants",
        value: loading ? "..." : activeTenants.toString(),
        description: "Organizations currently active",
        icon: UserCheck,
        trend: tenantStats
          ? calculateTrend(activeTenants, tenantStats.previous.active)
          : "+2 from last month",
        ...STAT_THEMES.active,
      },
      {
        id: "total" as const,
        title: "Total Tenants",
        value: loading ? "..." : totalTenants.toString(),
        description: "All registered organizations",
        icon: Building2,
        trend: tenantStats
          ? calculateTrend(totalTenants, tenantStats.previous.total)
          : "+3 from last month",
        ...STAT_THEMES.total,
      },
      {
        id: "inactive" as const,
        title: "Inactive Tenants",
        value: loading ? "..." : inactiveTenants.toString(),
        description: "Organizations currently inactive",
        icon: Users,
        trend: tenantStats
          ? calculateTrend(inactiveTenants, tenantStats.previous.inactive)
          : "-1 from last month",
        ...STAT_THEMES.inactive,
      },
      {
        id: "super-admins" as const,
        title: "Super Admins",
        value: superAdminsLoading ? "..." : superAdmins.length.toString(),
        description: "System administrators",
        icon: Shield,
        trend: superAdminStats
          ? calculateTrend(superAdminStats.current, superAdminStats.previous)
          : null,
        ...STAT_THEMES["super-admins"],
      },
      {
        id: "pending-invitations" as const,
        title: "Pending Super Admin Invitations",
        value: pendingInvitationsLoading ? "..." : pendingInvitations.length.toString(),
        description: "Awaiting acceptance",
        icon: Mail,
        trend: null,
        ...STAT_THEMES["pending-invitations"],
      },
    ],
    [
      loading,
      activeTenants,
      totalTenants,
      inactiveTenants,
      superAdminsLoading,
      superAdmins.length,
      pendingInvitationsLoading,
      pendingInvitations.length,
      tenantStats,
      superAdminStats,
      calculateTrend,
    ]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <Card
          key={stat.id}
          className={`group relative overflow-hidden border-0 backdrop-blur-sm transition-all duration-300 ease-out cursor-pointer hover:scale-[1.02] hover:shadow-xl ${
            stat.shadowColor
          } ${
            selectedCard === stat.id
              ? `bg-gradient-to-br ${stat.gradient} shadow-xl ${stat.shadowColor} scale-[1.02]`
              : `bg-gradient-to-br ${stat.bgGradient} hover:shadow-lg`
          }`}
          style={{
            animationDelay: `${index * 100}ms`,
            animation: "fadeInUp 0.6s ease-out forwards",
          }}
          onClick={() => {
            onCardClick(stat.id);
            // Scroll down to show the content below
            setTimeout(() => {
              window.scrollBy({ top: 400, behavior: 'smooth' });
            }, 100);
          }}
        >
          {/* Animated background gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
          />

          {/* Subtle border gradient */}
          <div
            className={`absolute inset-0 rounded-lg bg-gradient-to-br ${stat.gradient} opacity-10 p-[1px]`}
          >
            <div className="h-full w-full rounded-[calc(0.5rem-1px)] bg-white" />
          </div>

          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3 pt-6 px-6">
            <div className="space-y-1">
              <p
                className={`text-sm font-semibold tracking-wide uppercase opacity-80 ${
                  selectedCard === stat.id ? "text-white" : stat.textColor
                }`}
              >
                {stat.title}
              </p>
              {stat.trend && (
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-3 w-3 ${
                    selectedCard === stat.id ? "text-white" : stat.trendColor
                  }`} />
                  <span className={`text-xs font-medium ${
                    selectedCard === stat.id ? "text-white" : stat.trendColor
                  }`}>
                    {stat.trend}
                  </span>
                </div>
              )}
            </div>

            <div
              className={`relative p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-all duration-300 shadow-sm`}
            >
              {((stat.id === "super-admins" && superAdminsLoading) || (stat.id === "pending-invitations" && pendingInvitationsLoading) || loading) ? (
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              ) : (
                <stat.icon className={`h-6 w-6 ${
                  selectedCard === stat.id ? "text-white" : "text-gray-600"
                }`} />
              )}

              {/* Glow effect */}
              <div
                className={`absolute inset-0 rounded-xl ${stat.iconBg} opacity-0 group-hover:opacity-50 blur transition-opacity duration-300`}
              />
            </div>
          </CardHeader>

          <CardContent className="relative px-6 pb-6">
            <div className="space-y-2">
              <div
                className={`text-3xl font-bold ${
                  selectedCard === stat.id 
                    ? "text-white" 
                    : `bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`
                }`}
              >
                {stat.value}
              </div>
              <div className={`text-sm font-medium ${
                selectedCard === stat.id ? "text-white/80" : "text-gray-600"
              }`}>
                {stat.description}
              </div>
            </div>

            {/* Bottom accent line */}
            <div
              className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${stat.gradient} opacity-20 group-hover:opacity-40 transition-opacity duration-300`}
            />
          </CardContent>

          {/* Hover shimmer effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer" />
          </div>
        </Card>
      ))}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s ease-out;
        }
      `}</style>
    </div>
  );
}
