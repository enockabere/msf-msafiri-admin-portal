import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";

export default withAuth(
  // Optional middleware function
  function middleware(request: NextRequestWithAuth) {
    // Debug logging
    console.log("Middleware - Token role:", request.nextauth.token?.role);
    console.log("Middleware - Pathname:", request.nextUrl.pathname);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        console.log("Authorized callback - Token role:", token?.role);
        console.log("Authorized callback - Pathname:", pathname);

        // Public routes that don't require authentication
        if (pathname === "/" || pathname === "/login") {
          return true;
        }

        // All other routes require authentication
        if (!token) {
          console.log("No token found, denying access");
          return false;
        }

        // Admin routes require admin roles - Updated to include super_admin
        if (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/users") ||
          pathname.startsWith("/admin")
        ) {
          const adminRoles = [
            "SUPER_ADMIN",
            "super_admin", // Add the actual role from your API
            "MT_ADMIN",
            "HR_ADMIN",
            "EVENT_ADMIN",
          ];

          const hasAdminRole = !!(
            token?.role && adminRoles.includes(token.role as string)
          );
          console.log(
            "Admin route check:",
            hasAdminRole,
            "for role:",
            token.role
          );
          return hasAdminRole;
        }

        // Super admin only routes - Updated to include super_admin
        if (
          pathname.startsWith("/tenants") ||
          pathname.startsWith("/settings/system")
        ) {
          const isSuperAdmin =
            token?.role === "SUPER_ADMIN" || token?.role === "super_admin";
          console.log(
            "Super admin route check:",
            isSuperAdmin,
            "for role:",
            token.role
          );
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
    "/tenants/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/profile/:path*",
  ],
};
