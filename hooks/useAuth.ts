import { useSession } from "next-auth/react";
import { UserRole } from "@/lib/api";

export function useAuth() {
  const { data: session, status } = useSession();

  const adminRoles = [
    UserRole.SUPER_ADMIN,
    UserRole.MT_ADMIN,
    UserRole.HR_ADMIN,
    UserRole.EVENT_ADMIN,
  ];

  return {
    user: session?.user || null,
    isAuthenticated: status === "authenticated",
    loading: status === "loading",
    isAdmin: session?.user?.role
      ? adminRoles.includes(session.user.role as UserRole)
      : false,
    isSuperAdmin: session?.user?.role === UserRole.SUPER_ADMIN,
    hasRole: (role: UserRole) => session?.user?.role === role,
    hasAnyRole: (roles: UserRole[]) =>
      session?.user?.role
        ? roles.includes(session.user.role as UserRole)
        : false,
    accessToken: session?.user?.accessToken,
    firstLogin: session?.user?.firstLogin || false,
    tenantId: session?.user?.tenantId,
  };
}
