// lib/auth.ts - Updated with proper TypeScript types
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import apiClient from "@/lib/api";

// Define the user type that comes from NextAuth session
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
  tenantId?: string;
  isActive: boolean;
  accessToken: string;
  firstLogin: boolean;
}

// Use actual API role strings instead of enum
type ValidRole = "super_admin" | "mt_admin" | "hr_admin" | "event_admin" | "staff" | "visitor" | "guest";

// Main authentication hook
export function useAuth() {
  const { data: session, status } = useSession();

  // Use actual API role strings
  const adminRoles: ValidRole[] = [
    "super_admin",
    "mt_admin", 
    "hr_admin",
    "event_admin",
  ];

  return {
    // User data
    user: session?.user || null,

    // Authentication state
    isAuthenticated: status === "authenticated",
    loading: status === "loading",

    // Role-based permissions - handle both uppercase and lowercase
    isAdmin: session?.user?.role
      ? adminRoles.includes(session.user.role.toLowerCase() as ValidRole) ||
        ['SUPER_ADMIN', 'MT_ADMIN', 'HR_ADMIN', 'EVENT_ADMIN'].includes(session.user.role.toUpperCase())
      : false,

    // Super admin check using actual API role - handle both cases
    isSuperAdmin: session?.user?.role === "super_admin" || session?.user?.role === "SUPER_ADMIN",

    // Role checking utilities
    hasRole: (role: ValidRole) => session?.user?.role === role,
    hasAnyRole: (roles: ValidRole[]) =>
      session?.user?.role
        ? roles.includes(session.user.role as ValidRole)
        : false,

    // Session data
    accessToken: session?.user?.accessToken,
    firstLogin: session?.user?.firstLogin || false,
    tenantId: session?.user?.tenantId,

    // Additional user info
    isActive: session?.user?.isActive || false,
  };
}

// Hook that automatically sets API client token from NextAuth session
export function useApiClient() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.accessToken) {
      apiClient.setToken(session.user.accessToken);
    } else {
      // Clear token if no session
      apiClient.setToken("");
    }
  }, [session?.user?.accessToken]);

  return apiClient;
}

// Hook for making authenticated API calls with ready state
export function useAuthenticatedApi() {
  const apiClientInstance = useApiClient();
  const { isAuthenticated, loading } = useAuth();

  return {
    apiClient: apiClientInstance,
    isReady: isAuthenticated && !loading,
    isLoading: loading,
  };
}

// Utility functions for role-based access using actual API roles
export const AuthUtils = {
  // Check if role is admin - handle both uppercase and lowercase
  isAdminRole: (role: string): boolean => {
    const adminRoles: ValidRole[] = [
      "super_admin",
      "mt_admin", 
      "hr_admin",
      "event_admin",
    ];
    const upperAdminRoles = ['SUPER_ADMIN', 'MT_ADMIN', 'HR_ADMIN', 'EVENT_ADMIN'];
    return adminRoles.includes(role.toLowerCase() as ValidRole) || upperAdminRoles.includes(role.toUpperCase());
  },

  // Check if role is super admin - handle both cases
  isSuperAdminRole: (role: string): boolean => {
    return role.toLowerCase() === "super_admin" || role.toUpperCase() === "SUPER_ADMIN";
  },

  // Get role display name using actual API roles
  getRoleDisplayName: (role: string): string => {
    switch (role) {
      case "super_admin":
        return "Super Administrator";
      case "mt_admin":
        return "MT Administrator";
      case "hr_admin":
        return "HR Administrator";
      case "event_admin":
        return "Event Administrator";
      case "staff":
        return "Staff";
      case "visitor":
        return "Visitor";
      case "guest":
        return "Guest";
      default:
        return "Unknown Role";
    }
  },

  // Get role color classes for UI using actual API roles
  getRoleColor: (role: string): string => {
    switch (role) {
      case "super_admin":
        return "bg-[#fee2e2] text-[#ee0000]";
      case "mt_admin":
        return "bg-yellow-100 text-yellow-800";
      case "hr_admin":
        return "bg-orange-100 text-orange-800";
      case "event_admin":
        return "bg-blue-100 text-blue-800";
      case "staff":
        return "bg-green-100 text-green-800";
      case "visitor":
        return "bg-purple-100 text-purple-800";
      case "guest":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  },
};

// Session status type for components that need detailed session info
export interface SessionStatus {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  user: SessionUser | null;
  loading: boolean;
  hasRole: (role: ValidRole) => boolean;
  hasAnyRole: (roles: ValidRole[]) => boolean;
}

// Hook to get session status object
export function useSessionStatus(): SessionStatus {
  const auth = useAuth();

  return {
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin,
    isSuperAdmin: auth.isSuperAdmin,
    user: auth.user as SessionUser | null,
    loading: auth.loading,
    hasRole: auth.hasRole,
    hasAnyRole: auth.hasAnyRole,
  };
}

// Export types for use in other files
export type { SessionUser, ValidRole };
