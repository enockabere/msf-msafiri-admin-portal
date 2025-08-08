// app/api/auth/[...nextauth]/route.ts - Fixed for Super Admin only
import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";

const authOptions: NextAuthOptions = {
  providers: [
    // Microsoft SSO Provider
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),

    // Super Admin Credentials Provider - Fixed to use correct endpoints
    CredentialsProvider({
      id: "admin-credentials",
      name: "Super Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const baseURL =
            process.env.NEXT_PUBLIC_API_URL ||
            "https://msafiri-visitor-api.onrender.com/api/v1";

          console.log(
            "Attempting super admin login to:",
            `${baseURL}/auth/login`
          );

          // Super Admin login - ALWAYS use /auth/login (not /auth/login/tenant)
          const response = await fetch(`${baseURL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              username: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              "Login API error:",
              response.status,
              response.statusText,
              errorText
            );
            return null;
          }

          const loginResponse = await response.json();
          console.log("Login successful, getting user details...");

          // Get user details with the token - Use POST method for test-token
          const userResponse = await fetch(`${baseURL}/auth/test-token`, {
            method: "POST", // Changed from GET to POST
            headers: {
              Authorization: `Bearer ${loginResponse.access_token}`,
              "Content-Type": "application/json",
            },
          });

          if (!userResponse.ok) {
            console.error(
              "User fetch error:",
              userResponse.status,
              userResponse.statusText
            );
            const errorText = await userResponse.text();
            console.error("Error details:", errorText);
            return null;
          }

          const user = await userResponse.json();
          console.log("User details fetched:", user.email, user.role);

          // Validate that this is actually a super admin
          // Handle both possible role formats: 'SUPER_ADMIN' and 'super_admin'
          const validSuperAdminRoles = ["SUPER_ADMIN", "super_admin"];
          if (!validSuperAdminRoles.includes(user.role)) {
            console.error(
              "Access denied: User role is",
              user.role,
              "but super admin role is required"
            );
            return null;
          }

          // Validate that super admin doesn't have tenant restrictions
          if (user.tenant_id) {
            console.error(
              "Super admin should not have tenant restrictions, but tenant_id is:",
              user.tenant_id
            );
            return null;
          }

          console.log("Super admin login successful for:", user.email);

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.full_name,
            role: user.role,
            tenantId: user.tenant_id,
            isActive: user.is_active,
            accessToken: loginResponse.access_token,
            firstLogin: loginResponse.first_login || false,
          };
        } catch (error) {
          console.error("Super admin login failed:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // For Microsoft SSO, sync with your API
      if (account?.provider === "azure-ad") {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/sso/microsoft`,
            {
              method: "POST",
              headers: {
                "X-Microsoft-Token": account.access_token!,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            console.error(
              "SSO sync failed:",
              response.status,
              response.statusText
            );
            return false;
          }

          const ssoResult = await response.json();

          // Get full user details - Use POST method
          const userResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/test-token`,
            {
              method: "POST", // Changed from GET to POST
              headers: {
                Authorization: `Bearer ${ssoResult.access_token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!userResponse.ok) {
            console.error(
              "SSO user fetch failed:",
              userResponse.status,
              userResponse.statusText
            );
            return false;
          }

          const fullUser = await userResponse.json();

          // For SSO, also validate super admin role
          const validSuperAdminRoles = ["SUPER_ADMIN", "super_admin"];
          if (!validSuperAdminRoles.includes(fullUser.role)) {
            console.error(
              "SSO Access denied: User role is",
              fullUser.role,
              "but super admin role is required"
            );
            return false;
          }

          // Add data to user object for JWT callback
          user.role = fullUser.role;
          user.tenantId = fullUser.tenant_id;
          user.isActive = fullUser.is_active;
          user.accessToken = ssoResult.access_token;
          user.firstLogin = ssoResult.first_login || false;

          return true;
        } catch (error) {
          console.error("SSO integration error:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      // First time JWT callback is run, user object is available
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.isActive = user.isActive;
        token.accessToken = user.accessToken;
        token.firstLogin = user.firstLogin;
      }
      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
        session.user.isActive = token.isActive as boolean;
        session.user.accessToken = token.accessToken as string;
        session.user.firstLogin = token.firstLogin as boolean;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,

  // Enable debug in development to see detailed logs
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
