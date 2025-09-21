// utils/userUtils.ts - Enhanced utilities for user data handling
import type {
  AuthUser,
  UserProfile,
  FullUserData,
  UserData,
  ProfileCompletion,
  UserProfileUpdate,
} from "@/types/auth";

// ==========================================
// TYPE GUARDS
// ==========================================

// Enhanced type guard to check if user is FullUserData
export const isFullUserData = (user: UserData | null): user is FullUserData => {
  return (
    user !== null &&
    typeof user === "object" &&
    "full_name" in user &&
    !("has_strong_password" in user)
  );
};

// Type guard to check if user is UserProfile (full profile data)
export const isUserProfile = (user: UserData | null): user is UserProfile => {
  return (
    user !== null &&
    typeof user === "object" &&
    "auth_provider" in user &&
    "has_strong_password" in user
  );
};

// Type guard to check if user is AuthUser (NextAuth session data)
export const isAuthUser = (user: UserData | null): user is AuthUser => {
  return (
    user !== null &&
    typeof user === "object" &&
    "accessToken" in user &&
    typeof (user as AuthUser).id === "string"
  );
};

// ==========================================
// SAFE PROPERTY ACCESSORS
// ==========================================

// Get user display name with proper fallbacks
export const getUserDisplayName = (
  authUser: AuthUser | null,
  profileUser: UserProfile | null
): string => {
  // Priority: ProfileUser > AuthUser > fallback
  if (profileUser?.full_name) return profileUser.full_name;
  if (authUser?.name) return authUser.name;
  if (profileUser?.email) return profileUser.email;
  if (authUser?.email) return authUser.email;
  return "User";
};

// Get user email with proper fallbacks
export const getUserEmail = (
  authUser: AuthUser | null,
  profileUser: UserProfile | null
): string => {
  return profileUser?.email || authUser?.email || "Not available";
};

// Get user role with proper fallbacks
export const getUserRole = (
  authUser: AuthUser | null,
  profileUser: UserProfile | null
): string => {
  return profileUser?.role || authUser?.role || "guest";
};

// Check if user is active
export const isUserActive = (
  authUser: AuthUser | null,
  profileUser: UserProfile | null
): boolean => {
  // Profile data takes precedence
  if (profileUser !== null) return profileUser.is_active;
  return authUser?.isActive ?? false;
};

// Get user ID (handle both string and number IDs)
export const getUserId = (
  authUser: AuthUser | null,
  profileUser: UserProfile | null
): string | number | null => {
  if (profileUser?.id) return profileUser.id;
  if (authUser?.id) return authUser.id;
  return null;
};

// Get tenant ID
export const getTenantId = (
  authUser: AuthUser | null,
  profileUser: UserProfile | null
): string | null => {
  return profileUser?.tenant_id || authUser?.tenantId || null;
};

// ==========================================
// DISPLAY HELPERS
// ==========================================

// Helper to get user initials for avatars
export const getUserInitials = (name: string | null | undefined): string => {
  if (!name || typeof name !== "string") return "U";

  const trimmedName = name.trim();
  if (!trimmedName) return "U";

  const words = trimmedName.split(" ").filter((word) => word.length > 0);

  if (words.length === 1) {
    // Single word: take first two characters
    return words[0].substring(0, 2).toUpperCase();
  } else {
    // Multiple words: take first character of first two words
    return words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }
};

// Format role for display
export const formatRoleDisplay = (role: string): string => {
  if (!role) return "Unknown";

  // Convert enum values to display names
  const roleMap: Record<string, string> = {
    SUPER_ADMIN: "Super Administrator",
    MT_ADMIN: "Multi-Tenant Admin",
    HR_ADMIN: "HR Administrator",
    EVENT_ADMIN: "Event Administrator",
    VISITOR: "Visitor",
    GUEST: "Guest",
    STAFF: "Staff",
  };

  return roleMap[role.toUpperCase()] || role.replace(/_/g, " ");
};

// Format status for display
export const formatStatusDisplay = (status: string): string => {
  if (!status) return "Unknown";

  const statusMap: Record<string, string> = {
    ACTIVE: "Active",
    PENDING_APPROVAL: "Pending Approval",
    INACTIVE: "Inactive",
    SUSPENDED: "Suspended",
    PENDING_EMAIL_VERIFICATION: "Email Verification Pending",
  };

  return statusMap[status.toUpperCase()] || status.replace(/_/g, " ");
};

// Format auth provider for display
export const formatAuthProviderDisplay = (provider: string): string => {
  if (!provider) return "Unknown";

  const providerMap: Record<string, string> = {
    LOCAL: "Email & Password",
    MICROSOFT_SSO: "Microsoft SSO",
    GOOGLE_SSO: "Google SSO",
  };

  return providerMap[provider.toUpperCase()] || provider.replace(/_/g, " ");
};

// ==========================================
// DATE AND TIME HELPERS
// ==========================================

// Format date with fallback
export const formatUserDate = (
  dateString: string | null | undefined,
  fallback: string = "Not available"
): string => {
  if (!dateString) return fallback;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return fallback;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.warn("Failed to format date:", dateString, error);
    return fallback;
  }
};

// Get relative time (e.g., "2 days ago")
export const getRelativeTime = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "Never";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) return "In the future";

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffMinutes > 0)
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;

    return "Just now";
  } catch (error) {
    console.warn("Failed to calculate relative time:", dateString, error);
    return "Unknown";
  }
};

// ==========================================
// PROFILE HELPERS
// ==========================================

// Calculate profile completeness for any user data
export const calculateProfileCompleteness = (
  profileUser: UserProfile | null
): ProfileCompletion => {
  if (!profileUser) {
    return {
      percentage: 0,
      completed_fields: 0,
      total_basic_fields: 2,
      missing_fields: ["full_name", "phone_number"],
    };
  }

  // For super admins, only require full_name and phone_number
  if (profileUser.role === "SUPER_ADMIN" || profileUser.role === "super_admin") {
    const basicFields = [
      { field: "full_name", value: profileUser.full_name },
      { field: "phone_number", value: profileUser.phone_number },
    ];

    const completedFields = basicFields.filter(
      ({ value }) => value && value.trim().length > 0
    );

    const missingFields = basicFields
      .filter(({ value }) => !value || value.trim().length === 0)
      .map(({ field }) => field);

    const percentage = Math.round(
      (completedFields.length / basicFields.length) * 100
    );

    return {
      percentage,
      completed_fields: completedFields.length,
      total_basic_fields: basicFields.length,
      missing_fields: missingFields,
    };
  }

  // For other users, require all fields
  const basicFields = [
    { field: "full_name", value: profileUser.full_name },
    { field: "phone_number", value: profileUser.phone_number },
    { field: "department", value: profileUser.department },
    { field: "job_title", value: profileUser.job_title },
  ];

  const completedFields = basicFields.filter(
    ({ value }) => value && value.trim().length > 0
  );

  const missingFields = basicFields
    .filter(({ value }) => !value || value.trim().length === 0)
    .map(({ field }) => field);

  const percentage = Math.round(
    (completedFields.length / basicFields.length) * 100
  );

  return {
    percentage,
    completed_fields: completedFields.length,
    total_basic_fields: basicFields.length,
    missing_fields: missingFields,
  };
};

// Check if user has complete basic profile
export const hasCompleteBasicProfile = (
  profileUser: UserProfile | null
): boolean => {
  const completion = calculateProfileCompleteness(profileUser);
  return completion.percentage >= 100;
};

// Get profile completion status badge info
export const getProfileCompletionBadge = (profileUser: UserProfile | null) => {
  const completion = calculateProfileCompleteness(profileUser);

  // For super admins, show complete if they have name and phone
  if ((profileUser?.role === "SUPER_ADMIN" || profileUser?.role === "super_admin") && completion.percentage >= 100) {
    return { variant: "success", text: "Complete", color: "green" };
  }

  if (completion.percentage >= 90) {
    return { variant: "success", text: "Complete", color: "green" };
  } else if (completion.percentage >= 70) {
    return { variant: "warning", text: "Nearly Complete", color: "orange" };
  } else if (completion.percentage >= 40) {
    return { variant: "info", text: "Partial", color: "blue" };
  } else {
    return { variant: "error", text: "Incomplete", color: "red" };
  }
};

// ==========================================
// VALIDATION HELPERS
// ==========================================

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format (basic)
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

// Check if profile data is consistent
export const validateProfileConsistency = (
  authUser: AuthUser | null,
  profileUser: UserProfile | null
): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];

  if (authUser && profileUser) {
    // Check email consistency
    if (
      authUser.email &&
      profileUser.email &&
      authUser.email !== profileUser.email
    ) {
      issues.push("Email mismatch between session and profile data");
    }

    // Check role consistency
    if (
      authUser.role &&
      profileUser.role &&
      authUser.role !== profileUser.role
    ) {
      issues.push("Role mismatch between session and profile data");
    }

    // Check active status consistency
    if (authUser.isActive !== profileUser.is_active) {
      issues.push("Active status mismatch between session and profile data");
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

// ==========================================
// UTILITY FUNCTIONS FOR FORMS
// ==========================================

// Create initial form data from profile
export const createInitialFormData = (
  profile: UserProfile | null
): UserProfileUpdate => {
  if (!profile) return {};

  return {
    full_name: profile.full_name || "",
    email: profile.email || "",
    phone_number: profile.phone_number || "",
    department: profile.department || "",
    job_title: profile.job_title || "",
    date_of_birth: profile.date_of_birth || "",
    nationality: profile.nationality || "",
    passport_number: profile.passport_number || "",
    passport_issue_date: profile.passport_issue_date || "",
    passport_expiry_date: profile.passport_expiry_date || "",
    whatsapp_number: profile.whatsapp_number || "",
    email_personal: profile.email_personal || "",
  };
};

// Get fields that have changes
export const getChangedFields = (
  original: UserProfile | null,
  updated: UserProfileUpdate
): Partial<UserProfileUpdate> => {
  if (!original) return updated;

  const changes: Partial<UserProfileUpdate> = {};

  Object.entries(updated).forEach(([key, value]) => {
    const originalValue = original[key as keyof UserProfile];
    if (value !== originalValue && value !== undefined) {
      changes[key as keyof UserProfileUpdate] = value;
    }
  });

  return changes;
};
