import { signOut } from "next-auth/react";
import { tokenManager } from "./token-refresh";
import { getInternalApiUrl } from "./base-path";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
  tenant_id?: string;
  auth_provider: AuthProvider;
  external_id?: string;
  auto_registered: boolean;
  last_login?: string;
  created_at: string;
  updated_at?: string;
  approved_by?: string;
  approved_at?: string;
  department?: string;
  job_title?: string;
  phone_number?: string;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  domain?: string;
  is_active: boolean;
  contact_email: string;
  admin_email: string;
  description?: string;
  country?: string;
  created_at: string;
  updated_at?: string;
  last_modified_by?: string;
  created_by?: string;
}

export interface Notification {
  id: number;
  user_id?: number;
  user_email?: string;
  tenant_id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
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

// Enums
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  MT_ADMIN = "MT_ADMIN",
  HR_ADMIN = "HR_ADMIN",
  EVENT_ADMIN = "EVENT_ADMIN",
  VISITOR = "VISITOR",
  GUEST = "GUEST",
  STAFF = "STAFF",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum AuthProvider {
  LOCAL = "LOCAL",
  MICROSOFT_SSO = "MICROSOFT_SSO",
  GOOGLE_SSO = "GOOGLE_SSO",
}

export enum NotificationType {
  USER_CREATED = "USER_CREATED",
  USER_ACTIVATED = "USER_ACTIVATED",
  USER_DEACTIVATED = "USER_DEACTIVATED",
  ROLE_CHANGED = "ROLE_CHANGED",
  TENANT_CREATED = "TENANT_CREATED",
  TENANT_ACTIVATED = "TENANT_ACTIVATED",
  TENANT_DEACTIVATED = "TENANT_DEACTIVATED",
  VISITOR_INVITED = "VISITOR_INVITED",
  EVENT_CREATED = "EVENT_CREATED",
  DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
  SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

// Request/Response types
export interface LoginResponse {
  access_token: string;
  token_type: string;
  first_login?: boolean;
  welcome_message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenant_slug?: string;
}

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

export interface TenantCreateRequest {
  name: string;
  slug: string;
  contact_email: string;
  admin_email: string;
  domain?: string;
  description?: string;
  country?: string;
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

// API Error type
export interface ApiError {
  detail: string;
  status_code: number;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: string;
  status: string;
  tenant_id?: string;

  // Profile information
  date_of_birth?: string;
  nationality?: string;
  passport_number?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  whatsapp_number?: string;
  email_work?: string;
  email_personal?: string;
  phone_number?: string;
  department?: string;
  job_title?: string;

  // Metadata
  auth_provider: string;
  last_login?: string;
  profile_updated_at?: string;
  email_verified_at?: string;
  created_at: string;

  // Security indicators
  has_strong_password: boolean;
  password_age_days?: number;
}

export interface UserProfileUpdate {
  full_name?: string;
  email?: string;
  date_of_birth?: string;
  nationality?: string;
  passport_number?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  whatsapp_number?: string;
  email_personal?: string;
  phone_number?: string;
  department?: string;
  job_title?: string;
}

export interface EditableFieldsResponse {
  basic_fields: string[];
  enhanced_fields: string[];
  readonly_fields: string[];
  can_change_password: boolean;
  profile_completion: {
    percentage: number;
    completed_fields: number;
    total_basic_fields: number;
    missing_fields: string[];
  };
}

export interface ProfileStatsResponse {
  account_age_days: number;
  last_login?: string;
  profile_completion: {
    percentage: number;
    completed_fields: number;
    total_basic_fields: number;
    missing_fields: string[];
  };
  security_status: {
    auth_method: string;
    has_password: boolean;
    password_age_days?: number;
    email_verified: boolean;
  };
  activity: {
    profile_last_updated?: string;
    password_last_changed?: string;
  };
}

// Request options type
interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | URLSearchParams;
  skipAuthError?: boolean; // Skip 401 error handling for login endpoints
}

// API Configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://msafiri-visitor-api.onrender.com";

// Add /api/v1 prefix to all endpoints
const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_BASE_URL.endsWith("/api/v1")
    ? API_BASE_URL
    : `${API_BASE_URL}/api/v1`;
  const fullUrl = `${baseUrl}${endpoint}`;
  return fullUrl;
};

const handleSessionExpiry = async (): Promise<void> => {
  try {
    // Clear any browser storage
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();

      // Clear any cached data
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }
    }

    // Sign out with NextAuth
    await signOut({
      redirect: false,
      callbackUrl: "/login",
    });

    // Force redirect to login with session expiry flag
    if (typeof window !== "undefined") {
      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("sessionExpired", "true");
      loginUrl.searchParams.set("reason", "inactivity");
      window.location.href = loginUrl.toString();
    }
  } catch {
    // Fallback: force page reload to clear any cached state
    if (typeof window !== "undefined") {
      window.location.href = "/login?sessionExpired=true&reason=error";
    }
  }
};

// Retry mechanism for failed requests
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on authentication errors or client errors (4xx)
      if (
        error instanceof Error &&
        (error.message.includes("Session expired") ||
          error.message.includes("Authentication failed") ||
          error.message.includes("4"))
      ) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private isHandlingSessionExpiry: boolean = false;

  constructor() {
    this.baseURL = API_BASE_URL.endsWith("/api/v1")
      ? API_BASE_URL.replace("/api/v1", "")
      : API_BASE_URL;
  }

  // Token management - simplified for NextAuth integration
  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  // Clear token (used by hooks)
  clearToken(): void {
    this.token = null;
  }

  // Check if currently handling session expiry to prevent multiple simultaneous logouts
  private isHandlingExpiry(): boolean {
    return this.isHandlingSessionExpiry;
  }

  // Core request method with enhanced error handling and retry logic
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // Prevent requests if we're already handling session expiry
    if (this.isHandlingExpiry() && !options.skipAuthError) {
      throw new Error("Session expired - logout in progress");
    }

    const makeRequest = async (): Promise<T> => {
      const url = getApiUrl(endpoint);

      // Use current token - NextAuth will handle refresh automatically
      const token = this.getToken();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      // Add authorization header if token exists
      if (token && token !== "") {
        headers.Authorization = `Bearer ${token}`;
      }

      // Add request ID for debugging
      const requestId = Math.random().toString(36).substring(7);
      headers["X-Request-ID"] = requestId;

      const requestConfig: RequestInit = {
        method: options.method || "GET",
        headers,
        ...(options.body && { body: options.body }),
        // Add timeout for requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      };

      try {
        const response = await fetch(url, requestConfig);

        if (!response.ok) {
          // Handle 401 errors (authentication/authorization issues)
          if (response.status === 401) {
            // Skip auth error handling for login endpoints or when explicitly requested
            if (options.skipAuthError || endpoint.includes("/auth/login")) {
              const errorData = await response.json().catch(() => ({
                detail: "Invalid credentials",
                status_code: 401,
              }));
              throw new Error(errorData.detail || "Authentication failed");
            }

            // Set flag to prevent concurrent session expiry handling
            this.isHandlingSessionExpiry = true;

            // Handle session expiry asynchronously to avoid blocking the current request
            setTimeout(() => handleSessionExpiry(), 100);

            throw new Error("Session expired - please log in again");
          }

          // Handle 403 errors (insufficient permissions)
          if (response.status === 403) {
            const errorData = await response.json().catch(() => ({
              detail: "Access denied",
              status_code: 403,
            }));
            throw new Error(errorData.detail || "Insufficient permissions");
          }

          // Handle other HTTP errors
          const errorText = await response.text();

          let errorData: unknown;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = {
              detail: response.statusText,
              status_code: response.status,
            };
          }

          // Handle array of errors (validation errors)
          if (Array.isArray(errorData)) {
            const errorMessages = errorData
              .map((err) => err.msg || err.detail || JSON.stringify(err))
              .join(", ");
            throw new Error(`Validation errors: ${errorMessages}`);
          }

          const errorMessage =
            (errorData && typeof errorData === "object" && "detail" in errorData
              ? (errorData as { detail: string }).detail
              : null) ||
            (errorData &&
            typeof errorData === "object" &&
            "message" in errorData
              ? (errorData as { message: string }).message
              : null) ||
            `HTTP ${response.status}: ${response.statusText}`;

          throw new Error(errorMessage);
        }

        // Parse JSON response
        const data = await response.json();

        return data;
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            throw new Error("Request timeout - please try again");
          }
          if (error.name === "TypeError" && error.message.includes("fetch")) {
            throw new Error("Network error - please check your connection");
          }
        }
        throw error;
      }
    };

    try {
      // Use retry mechanism for non-authentication requests
      if (options.skipAuthError || endpoint.includes("/auth/login")) {
        return await makeRequest();
      } else {
        return await retryRequest(makeRequest, 1, 1000); // Reduced retries for authenticated requests
      }
    } catch (error) {
      // If it's a token-related error and we haven't tried refreshing yet
      if (
        error instanceof Error &&
        error.message.includes("Session expired") &&
        !options.skipAuthError &&
        !endpoint.includes("/auth/")
      ) {
        try {
          const newToken = await tokenManager.refreshToken();
          if (newToken) {
            this.setToken(newToken);
            return await this.request(endpoint, {
              ...options,
              skipAuthError: true,
            });
          }
        } catch (refreshError) {
          console.error("Final token refresh attempt failed:", refreshError);
        }
      }
      throw error;
    }
  }

  // Authentication methods (not used by NextAuth, but available for direct API calls)
  async login(
    email: string,
    password: string,
    tenantSlug?: string
  ): Promise<LoginResponse> {
    const endpoint = tenantSlug ? "/auth/login/tenant" : "/auth/login";

    let body: string | URLSearchParams;
    let contentType: string;

    if (tenantSlug) {
      // JSON body for tenant login
      body = JSON.stringify({
        email,
        password,
        tenant_slug: tenantSlug,
      });
      contentType = "application/json";
    } else {
      // URLSearchParams for standard login
      body = new URLSearchParams({
        username: email,
        password: password,
      });
      contentType = "application/x-www-form-urlencoded";
    }

    const options: RequestOptions = {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: body,
      skipAuthError: true, // Don't treat 401 as session expiry during login
    };

    return await this.request<LoginResponse>(endpoint, options);
  }

  async getCurrentUser(): Promise<User> {
    return await this.request<User>("/users/me");
  }

  // User management methods
  async getUsers(tenantId?: string): Promise<User[]> {
    const headers: Record<string, string> = {};
    if (tenantId) {
      headers["X-Tenant-ID"] = tenantId;
    }
    return await this.request<User[]>("/users/", { headers });
  }

  async createUser(userData: UserCreateRequest): Promise<User> {
    return await this.request<User>("/users/", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async getUser(userId: number): Promise<User> {
    return await this.request<User>(`/users/${userId}`);
  }

  async updateUser(
    userId: number,
    userData: Partial<UserCreateRequest>
  ): Promise<User> {
    return await this.request<User>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async activateUser(userId: number): Promise<User> {
    return await this.request<User>(`/users/activate/${userId}`, {
      method: "POST",
    });
  }

  async deactivateUser(userId: number): Promise<User> {
    return await this.request<User>(`/users/deactivate/${userId}`, {
      method: "POST",
    });
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    return await this.request<{ message: string }>(`/users/${userId}`, {
      method: "DELETE",
    });
  }

  async changeUserRole(userId: number, newRole: UserRole): Promise<User> {
    return await this.request<User>(`/users/change-role/${userId}`, {
      method: "POST",
      body: JSON.stringify({ new_role: newRole }),
    });
  }

  async getSuperAdmins(): Promise<User[]> {
    return await this.request<User[]>("/super-admin/super-admins");
  }

  async inviteSuperAdmin(
    email: string,
    full_name: string
  ): Promise<{ message: string }> {
    return await this.request("/super-admin/invite-super-admin", {
      method: "POST",
      body: JSON.stringify({ email, full_name }),
    });
  }

  async removeSuperAdmin(userId: number): Promise<{ message: string }> {
    return await this.request(`/super-admin/remove-super-admin/${userId}`, {
      method: "DELETE",
    });
  }

  async getPendingInvitations(): Promise<
    Array<{ id: number; email: string; full_name: string; created_at: string }>
  > {
    const response = await fetch(getInternalApiUrl("/api/super-admin/pending-invitations"));
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to fetch pending invitations" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  async resendInvitation(invitationId: number): Promise<{ message: string }> {
    const response = await fetch(getInternalApiUrl("/api/super-admin/resend-invitation"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId }),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to resend invitation" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  async cancelInvitation(invitationId: number): Promise<{ message: string }> {
    const response = await fetch(getInternalApiUrl("/api/super-admin/cancel-invitation"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId }),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to cancel invitation" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  async acceptInvitation(token: string): Promise<{ message: string }> {
    return await this.request(`/invitations/accept/${token}`, {
      method: "POST",
    });
  }

  async requestEmailChange(newEmail: string): Promise<{ message: string }> {
    return await this.request("/profile/request-email-change", {
      method: "POST",
      body: JSON.stringify({ new_email: newEmail }),
    });
  }

  async confirmEmailChange(token: string): Promise<{ message: string }> {
    return await this.request("/profile/confirm-email-change", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async getMyProfile(): Promise<UserProfile> {
    // Use Next.js API route instead of direct external API call
    const response = await fetch(getInternalApiUrl("/api/profile/me"));
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to fetch profile" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  async updateMyProfile(profileData: UserProfileUpdate): Promise<User> {
    try {
      // Use Next.js API route instead of direct external API call
      const response = await fetch(getInternalApiUrl("/api/profile/me"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));

        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getEditableFields(): Promise<EditableFieldsResponse> {
    const response = await fetch(getInternalApiUrl("/api/profile/editable-fields"));
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to fetch editable fields" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  async getProfileStats(): Promise<ProfileStatsResponse> {
    const response = await fetch(getInternalApiUrl("/api/profile/stats"));
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to fetch profile stats" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  // Tenant management methods
  async getTenants(): Promise<Tenant[]> {
    return await this.request<Tenant[]>("/tenants/");
  }

  async getTenant(tenantId: number): Promise<Tenant> {
    return await this.request<Tenant>(`/tenants/${tenantId}`);
  }

  async createTenant(tenantData: TenantCreateRequest): Promise<Tenant> {
    return await this.request<Tenant>("/tenants/", {
      method: "POST",
      body: JSON.stringify(tenantData),
    });
  }

  async updateTenant(
    tenantId: number,
    tenantData: Partial<TenantCreateRequest>,
    reason: string = "Updated via admin portal",
    notifyAdmins: boolean = true
  ): Promise<Tenant> {
    const requestBody = {
      changes: tenantData,
      reason,
      notify_admins: notifyAdmins,
    };
    return await this.request<Tenant>(`/tenants/${tenantId}`, {
      method: "PUT",
      body: JSON.stringify(requestBody),
    });
  }

  async activateTenant(tenantId: number): Promise<Tenant> {
    return await this.request<Tenant>(`/tenants/activate/${tenantId}`, {
      method: "POST",
    });
  }

  async deactivateTenant(tenantId: number): Promise<Tenant> {
    return await this.request<Tenant>(`/tenants/deactivate/${tenantId}`, {
      method: "POST",
    });
  }

  async deleteTenant(tenantId: number): Promise<{ message: string }> {
    return await this.request<{ message: string }>(`/tenants/${tenantId}`, {
      method: "DELETE",
    });
  }

  // Notification methods
  async getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
    const query = unreadOnly ? "?unread_only=true" : "";
    const response = await fetch(getInternalApiUrl(`/api/notifications${query}`));
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to fetch notifications" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  async getNotification(notificationId: number): Promise<Notification> {
    return await this.request<Notification>(`/notifications/${notificationId}`);
  }

  async getNotificationStats(): Promise<NotificationStats> {
    const response = await fetch(getInternalApiUrl("/api/notifications/stats"));
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to fetch notification stats" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  async markNotificationRead(
    notificationId: number
  ): Promise<{ message: string }> {
    const response = await fetch(getInternalApiUrl("/api/notifications/mark-read"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to mark notification as read" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  async markAllNotificationsRead(): Promise<{ message: string }> {
    const response = await fetch(getInternalApiUrl("/api/notifications/mark-all-read"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to mark all notifications as read" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  async sendNotificationToUser(
    notificationData: NotificationCreateRequest
  ): Promise<Notification> {
    return await this.request<Notification>("/notifications/send-to-user", {
      method: "POST",
      body: JSON.stringify(notificationData),
    });
  }

  async sendBroadcastNotification(
    notificationData: BroadcastNotificationRequest
  ): Promise<Notification> {
    const response = await fetch(getInternalApiUrl("/api/notifications/broadcast"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notificationData),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to send broadcast notification" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  async getSentNotifications(): Promise<Notification[]> {
    return await this.request<Notification[]>("/notifications/sent");
  }

  async editNotification(
    notificationId: number,
    editData: {
      title?: string;
      message?: string;
      priority?: string;
      action_url?: string;
    }
  ): Promise<Notification> {
    return await this.request<Notification>(
      `/notifications/edit/${notificationId}`,
      {
        method: "PUT",
        body: JSON.stringify(editData),
      }
    );
  }

  async deleteNotification(
    notificationId: number
  ): Promise<{ message: string }> {
    return await this.request<{ message: string }>(
      `/notifications/delete/${notificationId}`,
      {
        method: "DELETE",
      }
    );
  }

  // System health and utilities
  async healthCheck(): Promise<{
    status: string;
    environment: string;
    database: string;
    timestamp: string;
  }> {
    // Health endpoint is at root level, not under /api/v1
    const url = `${this.baseURL}/health`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return await response.json();
  }

  // Utility methods
  getBaseUrl(): string {
    return this.baseURL;
  }

  hasToken(): boolean {
    return this.token !== null && this.token !== "";
  }

  // Reset session expiry flag (useful for testing)
  resetSessionExpiryFlag(): void {
    this.isHandlingSessionExpiry = false;
  }

  // Check API connection
  async checkConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  // Tenant statistics
  async getTenantStats(tenantSlug: string): Promise<{
    totalUsers: number;
    activeEvents: number;
    totalRoles: number;
    totalVisitors: number;
    tenantStatus: string;
    trends: {
      usersChange: number;
      eventsChange: number;
      rolesChange: number;
      visitorsChange: number;
    };
  }> {
    const [users, events, roles] = await Promise.all([
      this.request<Array<{ id: number; is_active: boolean }>>(`/users/`, {
        headers: { "X-Tenant-ID": tenantSlug },
      }),
      this.request<Array<{ id: number; is_active: boolean }>>(`/events/`),
      this.request<Array<{ id: number; name: string }>>(
        `/roles/tenant/${tenantSlug}`
      ),
    ]);

    // Get all participants for all events
    const allParticipants = await Promise.all(
      events.map((event) =>
        this.request<Array<{ id: number }>>(
          `/events/${event.id}/participants`
        ).catch(() => [])
      )
    );
    const totalVisitors = allParticipants.flat().length;

    // Calculate trends (mock data for now - would need historical data from API)

    return {
      totalUsers: users.length,
      activeEvents: events.filter((e) => e.is_active).length,
      totalRoles: roles.length,
      totalVisitors,
      tenantStatus: "Active",
      trends: {
        usersChange: Math.floor(Math.random() * 20) - 10, // Mock trend data
        eventsChange: Math.floor(Math.random() * 10) - 5,
        rolesChange: Math.floor(Math.random() * 5) - 2,
        visitorsChange: Math.floor(Math.random() * 50) - 25,
      },
    };
  }
}

// Create and export singleton instance
const apiClient = new ApiClient();
export default apiClient;

// Export the class for testing purposes
export { ApiClient };
