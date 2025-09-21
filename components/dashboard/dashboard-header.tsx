"use client";

import { Button } from "@/components/ui/button";
import { Plus, Settings, Building2 } from "lucide-react";
import { AuthUtils } from "@/lib/auth";
import type { AuthUser } from "@/types/auth";

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
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                Welcome,{" "}
                {profile?.full_name ||
                  user.name ||
                  AuthUtils.getRoleDisplayName(user.role) ||
                  user.email}
                !
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-xs text-gray-500 font-medium">
                  {AuthUtils.getRoleDisplayName(user.role)}
                </p>
                <span className="text-gray-300">•</span>
                <p className="text-xs text-gray-500">
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
            className="border-gray-200 hover:bg-gray-50"
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
