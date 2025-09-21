// types/auth.ts - Complete and unified type definitions

// ==========================================
// AUTHENTICATION TYPES
// ==========================================

// Basic authentication user from NextAuth
export interface AuthUser {
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

// ==========================================
// USER PROFILE TYPES (ALIGNED WITH API)
// ==========================================

// Complete user profile matching your API's UserProfile schema
export interface UserProfile {
  // Core identification
  id: number;
  email: string;
  full_name: string;
  role: string;
  status: string;
  tenant_id?: string;

  // CRITICAL: Core user properties (matching API)
  is_active: boolean;
  auth_provider: string;
  external_id?: string | null;
  auto_registered: boolean;

  // Basic profile information
  phone_number?: string | null;
  department?: string | null;
  job_title?: string | null;

  // Enhanced profile information
  date_of_birth?: string | null;
  nationality?: string | null;
  passport_number?: string | null;
  passport_issue_date?: string | null;
  passport_expiry_date?: string | null;
  whatsapp_number?: string | null;
  email_work?: string | null;
  email_personal?: string | null;

  // Timestamps and metadata
  last_login?: string | null;
  created_at: string;
  updated_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  profile_updated_at?: string | null;
  email_verified_at?: string | null;

  // Security indicators
  has_strong_password: boolean;
  password_age_days?: number | null;
}

// Legacy interface for backward compatibility
export interface FullUserData {
  id: number;
  email: string;
  full_name?: string | null;
  role: string;
  status: string;
  is_active: boolean;
  tenant_id?: string | null;
  auth_provider: string;
  external_id?: string | null;
  auto_registered: boolean;
  last_login?: string | null;
  created_at: string;
  updated_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  department?: string | null;
  job_title?: string | null;
  phone_number?: string | null;
}

// ==========================================
// FORM AND UPDATE TYPES
// ==========================================

// For profile editing form (matching API's UserProfileUpdate)
export interface UserProfileUpdate {
  full_name?: string;
  email?: string;
  phone_number?: string | null;
  department?: string | null;
  job_title?: string | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  passport_number?: string | null;
  passport_issue_date?: string | null;
  passport_expiry_date?: string | null;
  whatsapp_number?: string | null;
  email_personal?: string | null;
}

// ==========================================
// PROFILE MANAGEMENT TYPES (MATCHING API)
// ==========================================

// Profile completion information
export interface ProfileCompletion {
  percentage: number;
  completed_fields: number;
  total_basic_fields: number;
  missing_fields: string[];
}

// Security status information
export interface SecurityStatus {
  auth_method: string;
  has_password: boolean;
  password_age_days?: number | null;
  email_verified: boolean;
}

// Activity tracking information
export interface ActivityInfo {
  profile_last_updated?: string | null;
  password_last_changed?: string | null;
}

// Response from editable fields endpoint
export interface EditableFieldsResponse {
  basic_fields: string[];
  enhanced_fields: string[];
  readonly_fields: string[];
  can_change_password: boolean;
  profile_completion: ProfileCompletion;
}

// Response from profile stats endpoint
export interface ProfileStatsResponse {
  account_age_days: number;
  last_login?: string | null;
  profile_completion: ProfileCompletion;
  security_status: SecurityStatus;
  activity: ActivityInfo;
}

// ==========================================
// TYPE GUARDS AND UTILITIES
// ==========================================

// Union type for components that might receive either auth or profile data
export type UserData = AuthUser | UserProfile | FullUserData;

// Type guard to check if user data is AuthUser
export function isAuthUser(user: UserData): user is AuthUser {
  return typeof (user as AuthUser).id === "string" && "accessToken" in user;
}

// Type guard to check if user data is UserProfile
export function isUserProfile(user: UserData): user is UserProfile {
  return (
    typeof (user as UserProfile).id === "number" && "auth_provider" in user
  );
}

// Type guard to check if user data is FullUserData
export function isFullUserData(user: UserData): user is FullUserData {
  return (
    typeof (user as FullUserData).id === "number" &&
    !("has_strong_password" in user)
  );
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

// Standard API error response
export interface ApiError {
  detail: string;
  status_code: number;
}

// Login response
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  role: string;
  tenant_id?: string;
  first_login?: boolean;
  welcome_message?: string;
}

// ==========================================
// PASSWORD MANAGEMENT TYPES
// ==========================================

// Password management types
export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
  confirm_password: string;
}

// ==========================================
// ADDITIONAL TYPES FOR COMPLETE INTEGRATION
// ==========================================

// User roles enum
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  MT_ADMIN = "MT_ADMIN",
  HR_ADMIN = "HR_ADMIN",
  EVENT_ADMIN = "EVENT_ADMIN",
  VISITOR = "VISITOR",
  GUEST = "GUEST",
  STAFF = "STAFF",
}

// User status enum
export enum UserStatus {
  ACTIVE = "ACTIVE",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING_EMAIL_VERIFICATION = "PENDING_EMAIL_VERIFICATION",
}

// Auth provider enum
export enum AuthProvider {
  LOCAL = "LOCAL",
  MICROSOFT_SSO = "MICROSOFT_SSO",
  GOOGLE_SSO = "GOOGLE_SSO",
}

// User creation request
export interface UserCreateRequest {
  email: string;
  full_name: string;
  password?: string;
  tenant_id?: string;
  role?: UserRole;
  phone_number?: string;
  department?: string;
  job_title?: string;
  auth_provider?: AuthProvider;
}

// Tenant types
export interface Tenant {
  id: number;
  name: string;
  slug: string;
  domain?: string;
  is_active: boolean;
  contact_email: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface TenantCreateRequest {
  name: string;
  slug: string;
  contact_email: string;
  domain?: string;
  description?: string;
}

// Notification types
export interface Notification {
  id: number;
  user_id?: number;
  user_email?: string;
  tenant_id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  send_in_app: boolean;
  send_email: boolean;
  send_push: boolean;
  is_read: boolean;
  read_at?: string;
  sent_at?: string;
  failed_at?: string;
  error_message?: string;
  action_url?: string;
  expires_at?: string;
  triggered_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  by_type?: Record<string, number>;
}

export interface NotificationCreateRequest {
  user_id: number;
  title: string;
  message: string;
  priority?: string;
  send_email?: boolean;
  send_push?: boolean;
  action_url?: string;
}

export interface BroadcastNotificationRequest {
  title: string;
  message: string;
  priority?: string;
  send_email?: boolean;
  send_push?: boolean;
  action_url?: string;
}
