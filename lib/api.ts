// lib/api.ts - Updated for NextAuth integration
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
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://msafiri-visitor-api.onrender.com/api/v1";

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // UPDATED: Simplified token management - no localStorage
  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // UPDATED: Don't redirect directly, let NextAuth/components handle auth errors
          throw new Error("Unauthorized - session may have expired");
        }

        const errorData: ApiError = await response.json().catch(() => ({
          detail: response.statusText,
          status_code: response.status,
        }));

        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  // REMOVED: clearToken method - NextAuth handles session clearing

  // Authentication - Updated for NextAuth integration
  async login(
    email: string,
    password: string,
    tenantSlug?: string
  ): Promise<LoginResponse> {
    const endpoint = tenantSlug ? "/auth/login/tenant" : "/auth/login";
    const body = tenantSlug
      ? JSON.stringify({ email, password, tenant_slug: tenantSlug })
      : new URLSearchParams({ username: email, password });

    const options: RequestOptions = {
      method: "POST",
      headers: tenantSlug
        ? {}
        : { "Content-Type": "application/x-www-form-urlencoded" },
      body: body,
    };

    const response = await this.request<LoginResponse>(endpoint, options);

    // UPDATED: Don't automatically store token - NextAuth handles this
    // The token will be set via useApiClient hook when needed

    return response;
  }

  async getCurrentUser(): Promise<User> {
    return await this.request<User>("/auth/test-token");
  }

  // Users
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

  async changeUserRole(userId: number, newRole: UserRole): Promise<User> {
    return await this.request<User>(
      `/users/change-role/${userId}?new_role=${newRole}`,
      {
        method: "POST",
      }
    );
  }

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    return await this.request<Tenant[]>("/tenants/");
  }

  async createTenant(tenantData: TenantCreateRequest): Promise<Tenant> {
    return await this.request<Tenant>("/tenants/", {
      method: "POST",
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

  // Notifications
  async getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
    return await this.request<Notification[]>(
      `/notifications/?unread_only=${unreadOnly}`
    );
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

  // Health check
  async healthCheck(): Promise<{
    status: string;
    environment: string;
    database: string;
  }> {
    return await this.request<{
      status: string;
      environment: string;
      database: string;
    }>("/health", {
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();
export default apiClient;
