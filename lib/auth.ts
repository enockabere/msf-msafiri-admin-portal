// lib/auth.ts - Updated with proper TypeScript types
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import apiClient, { UserRole } from "@/lib/api";

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

type ValidRole = UserRole | "super_admin";

// Main authentication hook
export function useAuth() {
  const { data: session, status } = useSession();

  // Updated to include both formats of super admin role
  const adminRoles: ValidRole[] = [
    UserRole.SUPER_ADMIN,
    "super_admin", // Add the actual role from your API
    UserRole.MT_ADMIN,
    UserRole.HR_ADMIN,
    UserRole.EVENT_ADMIN,
  ];

  return {
    // User data
    user: session?.user || null,

    // Authentication state
    isAuthenticated: status === "authenticated",
    loading: status === "loading",

    // Role-based permissions - Updated to handle super_admin
    isAdmin: session?.user?.role
      ? adminRoles.includes(session.user.role as ValidRole)
      : false,

    // Updated super admin check to handle both formats
    isSuperAdmin:
      session?.user?.role === UserRole.SUPER_ADMIN ||
      session?.user?.role === "super_admin",

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

// Utility functions for role-based access - Updated to handle super_admin
export const AuthUtils = {
  // Check if role is admin - Updated to include super_admin
  isAdminRole: (role: string): boolean => {
    const adminRoles: ValidRole[] = [
      UserRole.SUPER_ADMIN,
      "super_admin", // Add the actual role from your API
      UserRole.MT_ADMIN,
      UserRole.HR_ADMIN,
      UserRole.EVENT_ADMIN,
    ];
    return adminRoles.includes(role as ValidRole);
  },

  // Check if role is super admin - Updated to handle both formats
  isSuperAdminRole: (role: string): boolean => {
    return role === UserRole.SUPER_ADMIN || role === "super_admin";
  },

  // Get role display name - Updated to handle super_admin
  getRoleDisplayName: (role: string): string => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case "super_admin":
        return "Super Administrator";
      case UserRole.MT_ADMIN:
        return "MT Administrator";
      case UserRole.HR_ADMIN:
        return "HR Administrator";
      case UserRole.EVENT_ADMIN:
        return "Event Administrator";
      case UserRole.STAFF:
        return "Staff";
      case UserRole.VISITOR:
        return "Visitor";
      case UserRole.GUEST:
        return "Guest";
      default:
        return "Unknown Role";
    }
  },

  // Get role color classes for UI - Updated to handle super_admin
  getRoleColor: (role: string): string => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case "super_admin":
        return "bg-red-100 text-red-800";
      case UserRole.MT_ADMIN:
        return "bg-yellow-100 text-yellow-800";
      case UserRole.HR_ADMIN:
        return "bg-orange-100 text-orange-800";
      case UserRole.EVENT_ADMIN:
        return "bg-blue-100 text-blue-800";
      case UserRole.STAFF:
        return "bg-green-100 text-green-800";
      case UserRole.VISITOR:
        return "bg-purple-100 text-purple-800";
      case UserRole.GUEST:
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
