// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      tenantId?: string;
      isActive: boolean;
      accessToken: string;
      firstLogin: boolean;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: string;
    tenantId?: string;
    isActive?: boolean;
    accessToken?: string;
    refreshToken?: string;
    firstLogin?: boolean;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: string;
    tenantId?: string;
    isActive?: boolean;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    firstLogin?: boolean;
    mustChangePassword?: boolean;
    error?: string;
  }
}
