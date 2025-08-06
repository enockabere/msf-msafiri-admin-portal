// middleware.ts - Fixed NextAuth middleware
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";

export default withAuth(
  // Optional middleware function - can be omitted if not needed
  function middleware(request: NextRequestWithAuth) {
    // Additional middleware logic if needed
    // You can access request.nextauth.token here
    console.log("Token:", request.nextauth.token);
    console.log("Pathname:", request.nextUrl.pathname);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes that don't require authentication
        if (pathname === "/" || pathname === "/login") {
          return true;
        }

        // All other routes require authentication
        if (!token) {
          return false;
        }

        // Admin routes require admin roles
        if (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/users") ||
          pathname.startsWith("/admin")
        ) {
          const adminRoles = [
            "SUPER_ADMIN",
            "MT_ADMIN",
            "HR_ADMIN",
            "EVENT_ADMIN",
          ];
          return !!(token?.role && adminRoles.includes(token.role as string));
        }

        // Super admin only routes
        if (
          pathname.startsWith("/tenants") ||
          pathname.startsWith("/settings/system")
        ) {
          return token?.role === "SUPER_ADMIN";
        }

        // Default: user needs to be authenticated (already checked above)
        return true;
      },
    },
    // Optional: customize pages
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    // Protected routes
    "/dashboard/:path*",
    "/users/:path*",
    "/admin/:path*",
    "/tenants/:path*",
    "/settings/:path*",
    "/notifications/:path*",

    // Add any other protected routes
    "/profile/:path*",
  ],
};
