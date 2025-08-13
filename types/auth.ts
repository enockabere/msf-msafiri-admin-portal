// types/auth.ts

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

// Full user data from API
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

// For form editing
export interface EditableUserData {
  full_name: string;
  phone_number: string;
  department: string;
  job_title: string;
}

// Union type for components that might receive either
export type UserData = AuthUser | FullUserData;
