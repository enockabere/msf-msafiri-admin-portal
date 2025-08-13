// utils/userUtils.ts
import type { AuthUser, FullUserData } from "@/types/auth";

// Type guard to check if user is FullUserData
export const isFullUserData = (
  user: AuthUser | FullUserData | null
): user is FullUserData => {
  return user !== null && "full_name" in user;
};

// Safe property accessors
export const getUserDisplayName = (
  authUser: AuthUser | null,
  fullUser: FullUserData | null
): string => {
  return fullUser?.full_name || authUser?.name || authUser?.email || "User";
};

export const getUserEmail = (
  authUser: AuthUser | null,
  fullUser: FullUserData | null
): string => {
  return fullUser?.email || authUser?.email || "Not available";
};

export const getUserRole = (
  authUser: AuthUser | null,
  fullUser: FullUserData | null
): string => {
  return fullUser?.role || authUser?.role || "";
};

export const isUserActive = (
  authUser: AuthUser | null,
  fullUser: FullUserData | null
): boolean => {
  return fullUser?.is_active ?? authUser?.isActive ?? false;
};

// Helper to get user initials
export const getUserInitials = (name: string | null | undefined): string => {
  if (!name) return "SA"; // Super Admin default
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
};
