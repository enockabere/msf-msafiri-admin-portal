// lib/api.ts - Rewritten for NextAuth integration
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
  description?: string;
  created_at: string;
  updated_at?: string;
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
  domain?: string;
  description?: string;
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

// Request options type
interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | URLSearchParams;
  skipAuthError?: boolean; // Skip 401 error handling for login endpoints
}

// API Configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://msafiri-visitor-api.onrender.com/api/v1";

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Token management - simplified for NextAuth integration
  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  // Clear token (used by useApiClient hook)
  clearToken(): void {
    this.token = null;
  }

  // Core request method with improved error handling
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add authorization header if token exists
    if (token && token !== "") {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestConfig: RequestInit = {
      method: options.method || "GET",
      headers,
      ...(options.body && { body: options.body }),
    };

    try {
      const response = await fetch(url, requestConfig);

      if (!response.ok) {
        // Handle 401 errors differently for login vs authenticated endpoints
        if (response.status === 401) {
          // Skip auth error handling for login endpoints or when explicitly requested
          if (options.skipAuthError || endpoint.includes("/auth/login")) {
            const errorData = await response.json().catch(() => ({
              detail: "Invalid credentials",
              status_code: 401,
            }));
            throw new Error(errorData.detail || "Authentication failed");
          }

          // For authenticated endpoints, this indicates session expiry
          throw new Error("Session expired - please log in again");
        }

        // Handle other HTTP errors
        const errorData: ApiError = await response.json().catch(() => ({
          detail: response.statusText,
          status_code: response.status,
        }));

        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Parse JSON response
      const data = await response.json();
      return data;
    } catch (error) {
      // Log error for debugging
      console.error(
        `API Request failed [${options.method || "GET"} ${endpoint}]:`,
        error
      );
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
    return await this.request<User>("/auth/test-token");
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
    tenantData: Partial<TenantCreateRequest>
  ): Promise<Tenant> {
    return await this.request<Tenant>(`/tenants/${tenantId}`, {
      method: "PUT",
      body: JSON.stringify(tenantData),
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
    return await this.request<Notification[]>(`/notifications/${query}`);
  }

  async getNotification(notificationId: number): Promise<Notification> {
    return await this.request<Notification>(`/notifications/${notificationId}`);
  }

  async getNotificationStats(): Promise<NotificationStats> {
    return await this.request<NotificationStats>("/notifications/stats");
  }

  async markNotificationRead(
    notificationId: number
  ): Promise<{ message: string }> {
    return await this.request<{ message: string }>(
      `/notifications/mark-read/${notificationId}`,
      {
        method: "POST",
      }
    );
  }

  async markAllNotificationsRead(): Promise<{ message: string }> {
    return await this.request<{ message: string }>(
      "/notifications/mark-all-read",
      {
        method: "POST",
      }
    );
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
    return await this.request<Notification>("/notifications/send-to-tenant", {
      method: "POST",
      body: JSON.stringify(notificationData),
    });
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
    return await this.request<{
      status: string;
      environment: string;
      database: string;
      timestamp: string;
    }>("/health");
  }

  // Get API base URL (useful for debugging)
  getBaseUrl(): string {
    return this.baseURL;
  }

  // Check if client has token
  hasToken(): boolean {
    return this.token !== null && this.token !== "";
  }
}

// Create and export singleton instance
const apiClient = new ApiClient();
export default apiClient;

// Export the class for testing purposes
export { ApiClient };
