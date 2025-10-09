import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";

export default withAuth(
  // Optional middleware function
  function middleware(request: NextRequestWithAuth) {
    // Debug logging
    // Debug logging removed for production
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Debug logging removed for production

        // Public routes that don't require authentication
        if (pathname === "/" || pathname === "/login" || pathname.startsWith("/public")) {
          return true;
        }

        // All other routes require authentication
        if (!token) {
          // No token found, denying access
          return false;
        }

        // Admin routes require admin roles (using actual API role strings)
        if (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/users") ||
          pathname.startsWith("/admin") ||
          pathname.startsWith("/tenant")
        ) {
          const adminRoles = [
            "super_admin",
            "mt_admin",
            "hr_admin",
            "event_admin",
          ];

          const hasAdminRole = !!(
            token?.role && adminRoles.includes(token.role as string)
          );
          // Admin route check completed
          return hasAdminRole;
        }

        // Super admin only routes (using actual API role string)
        if (
          pathname.startsWith("/tenants") ||
          pathname.startsWith("/settings/system")
        ) {
          const isSuperAdmin = token?.role === "super_admin";
          // Super admin route check completed
          return isSuperAdmin;
        }

        // Default: user needs to be authenticated (already checked above)
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/admin/:path*",
    "/admin-roles/:path*",
    "/admin-users/:path*",
    "/tenant/:path*",
    "/tenants/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/change-password",
  ],
};
