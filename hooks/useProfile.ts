// hooks/useProfile.ts - COMPLETE FIX with TypeScript compliance
import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import type {
  UserProfile,
  UserProfileUpdate,
  EditableFieldsResponse,
  ProfileStatsResponse,
} from "@/types/auth";
import {
  safeString,
  safeNumber,
  safeBoolean,
  safeTenantId,
  safeDate,
  isValidApiObject,
} from "@/utils/apiHelpers";

interface UseProfileResult {
  profile: UserProfile | null;
  editableFields: EditableFieldsResponse | null;
  profileStats: ProfileStatsResponse | null;
  loading: boolean;
  error: string | null;

  // Actions
  updateProfile: (data: UserProfileUpdate) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;

  // Status flags
  hasProfileData: boolean;
  isProfileComplete: boolean;
}

// Helper function to safely transform API response to UserProfile
function transformApiProfileToUserProfile(apiProfile: unknown): UserProfile {
  try {
    // Type guard to ensure we have an object
    if (!isValidApiObject(apiProfile)) {
      throw new Error("Invalid API response: not an object");
    }

    const profile = apiProfile;

    return {
      // Basic required fields
      id: safeNumber(profile.id) || 0,
      email: safeString(profile.email) || "",
      full_name: safeString(profile.full_name) || "",
      role: safeString(profile.role) || "guest",
      status: safeString(profile.status) || "active",
      tenant_id: safeTenantId(profile.tenant_id) ?? undefined,

      // Core user properties (critical missing fields)
      is_active: safeBoolean(profile.is_active, true),
      auth_provider: safeString(profile.auth_provider) || "local",
      external_id: safeString(profile.external_id),
      auto_registered: safeBoolean(profile.auto_registered, false),

      // Basic profile information
      phone_number: safeString(profile.phone_number),
      department: safeString(profile.department),
      job_title: safeString(profile.job_title),

      // Enhanced profile information
      date_of_birth: safeDate(profile.date_of_birth),
      gender: safeString(profile.gender),
      nationality: safeString(profile.nationality),
      passport_number: safeString(profile.passport_number),
      passport_issue_date: safeDate(profile.passport_issue_date),
      passport_expiry_date: safeDate(profile.passport_expiry_date),
      whatsapp_number: safeString(profile.whatsapp_number),
      email_work: safeString(profile.email_work),
      email_personal: safeString(profile.email_personal),

      // Timestamps and metadata
      last_login: safeDate(profile.last_login),
      created_at: safeString(profile.created_at) || new Date().toISOString(),
      updated_at: safeDate(profile.updated_at),
      approved_by: safeString(profile.approved_by),
      approved_at: safeDate(profile.approved_at),
      profile_updated_at: safeDate(profile.profile_updated_at),
      email_verified_at: safeDate(profile.email_verified_at),

      // Security indicators
      has_strong_password: safeBoolean(profile.has_strong_password, false),
      password_age_days: safeNumber(profile.password_age_days),
    };
  } catch (error) {
    console.error("Error transforming API profile data:", error);
    throw new Error("Failed to process profile data");
  }
}

// Helper to validate profile data
function validateProfileData(profile: UserProfile): boolean {
  if (!profile.id || !profile.email) {
    console.warn("Invalid profile data: missing required fields");
    return false;
  }
  return true;
}

// Type guard for API responses
function isEditableFieldsResponse(
  data: unknown
): data is EditableFieldsResponse {
  return (
    data !== null &&
    typeof data === "object" &&
    "basic_fields" in data &&
    "enhanced_fields" in data &&
    "readonly_fields" in data &&
    "can_change_password" in data
  );
}

function isProfileStatsResponse(data: unknown): data is ProfileStatsResponse {
  return (
    data !== null &&
    typeof data === "object" &&
    "account_age_days" in data &&
    "profile_completion" in data &&
    "security_status" in data &&
    "activity" in data
  );
}

export function useProfile(): UseProfileResult {
  const { apiClient, isReady } = useAuthenticatedApi();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editableFields, setEditableFields] =
    useState<EditableFieldsResponse | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStatsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial profile data
  const loadProfileData = useCallback(async () => {
    if (!isReady) {
      console.log("API not ready, skipping profile load");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Loading profile data...");

      // Load profile data first (required)
      const apiProfileData = await apiClient.getMyProfile().catch((err) => {
        console.error("Failed to load profile:", err);
        throw new Error(`Profile: ${err.message}`);
      });

      // Transform and validate the profile data
      const profileData = transformApiProfileToUserProfile(apiProfileData);

      if (!validateProfileData(profileData)) {
        throw new Error("Invalid profile data received from server");
      }

      console.log("Profile data loaded successfully:", {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role,
      });

      setProfile(profileData);

      // Load optional data (non-blocking)
      try {
        const fieldsData = await apiClient.getEditableFields();
        if (isEditableFieldsResponse(fieldsData)) {
          setEditableFields(fieldsData);
        } else {
          console.warn("Invalid editable fields response format");
        }
      } catch (err) {
        console.warn("Failed to load editable fields:", err);
        // Continue without this data
      }

      try {
        const statsData = await apiClient.getProfileStats();
        if (isProfileStatsResponse(statsData)) {
          setProfileStats(statsData);
        } else {
          console.warn("Invalid profile stats response format");
        }
      } catch (err) {
        console.warn("Failed to load profile stats:", err);
        // Continue without this data
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load profile data";
      setError(errorMessage);
      console.error("Profile loading error:", err);

      // Clear profile data on auth errors
      if (
        errorMessage.includes("Session expired") ||
        errorMessage.includes("Authentication")
      ) {
        setProfile(null);
        setEditableFields(null);
        setProfileStats(null);
      }
    } finally {
      setLoading(false);
    }
  }, [apiClient, isReady]);

  // Update profile with optimistic updates
  const updateProfile = useCallback(
    async (data: UserProfileUpdate): Promise<boolean> => {
      if (!isReady) {
        setError("API not ready for profile update");
        return false;
      }

      if (!profile) {
        setError("No profile data available to update");
        return false;
      }

      try {
        setError(null);

        console.log("🔄 Updating profile with data:", data);
        console.log("🔑 API client has token:", apiClient.hasToken());
        console.log("🌐 API base URL:", apiClient.getBaseUrl());
        console.log("👤 Current profile:", {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          auth_provider: profile.auth_provider
        });

        // Check editable fields first
        if (editableFields) {
          console.log("📝 Editable fields:", editableFields);
          const allEditableFields = [...editableFields.basic_fields, ...editableFields.enhanced_fields];
          const attemptedFields = Object.keys(data);
          const restrictedFields = attemptedFields.filter(field => !allEditableFields.includes(field));
          if (restrictedFields.length > 0) {
            console.warn("⚠️ Attempting to edit restricted fields:", restrictedFields);
          }
        }

        // Optimistic update - update local state immediately
        const optimisticProfile: UserProfile = {
          ...profile,
          ...data,
          profile_updated_at: new Date().toISOString(),
        };
        setProfile(optimisticProfile);

        // Prepare clean data for API
        const cleanData = {
          ...data,
          phone_number:
            data.phone_number === null ? undefined : data.phone_number,
          email_work: data.email_work === null ? undefined : data.email_work,
        };
        
        console.log("📤 Sending to API:", cleanData);

        // Update profile on server
        const result = await apiClient.updateMyProfile(cleanData);

        console.log("✅ Profile updated successfully on server:", result);

        // Refresh profile data to get the latest server state
        // We do this to ensure we have the complete, up-to-date profile
        await loadProfileData();

        return true;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update profile";
        setError(errorMessage);
        console.error("Profile update error:", err);

        // Revert optimistic update by reloading data
        await loadProfileData();

        return false;
      }
    },
    [profile, loadProfileData, apiClient, isReady]
  );

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    console.log("Refreshing profile data...");
    await loadProfileData();
  }, [loadProfileData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Compute derived values
  const hasProfileData = Boolean(profile);
  const isProfileComplete = Boolean(
    profile &&
      profile.full_name &&
      profile.phone_number &&
      profile.email_work
  );

  return {
    profile,
    editableFields,
    profileStats,
    loading,
    error,
    updateProfile,
    refreshProfile,
    clearError,
    hasProfileData,
    isProfileComplete,
  };
}
