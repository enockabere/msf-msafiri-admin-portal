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
    };
  }

  interface User {
    role?: string;
    tenantId?: string;
    isActive?: boolean;
    accessToken?: string;
    firstLogin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    tenantId?: string;
    isActive?: boolean;
    accessToken?: string;
    firstLogin?: boolean;
  }
}
