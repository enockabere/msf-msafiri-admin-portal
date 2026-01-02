"use client";

import { Button } from "@/components/ui/button";
import { Plus, Settings, Building2 } from "lucide-react";
import { AuthUtils } from "@/lib/auth";
import type { AuthUser } from "@/types/auth";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface DashboardHeaderProps {
  user: AuthUser;
  profile?: { full_name?: string };
  onProfileClick: () => void;
  onAddTenantClick: () => void;
}

export function DashboardHeader({
  user,
  profile,
  onProfileClick,
  onAddTenantClick,
}: DashboardHeaderProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <div 
      className="rounded-lg shadow-sm border p-4 sm:p-5 mb-6"
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        color: isDark ? '#ffffff' : '#000000'
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center justify-center w-10 h-10 rounded-xl border"
              style={{
                backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                borderColor: isDark ? '#374151' : '#e5e7eb'
              }}
            >
              <Building2 className="w-5 h-5" style={{ color: isDark ? '#d1d5db' : '#374151' }} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold truncate" style={{ color: isDark ? '#ffffff' : '#111827' }}>
                Welcome, {profile?.full_name || user.name || AuthUtils.getRoleDisplayName(user.role) || user.email}!
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-xs font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  Super Administrator
                </p>
                <span style={{ color: isDark ? '#4b5563' : '#d1d5db' }}>•</span>
                <p className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  Tenant Management Dashboard
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            onClick={onProfileClick}
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Profile
          </Button>
          <Button
            onClick={onAddTenantClick}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Tenant
          </Button>
        </div>
      </div>
    </div>
  );
}