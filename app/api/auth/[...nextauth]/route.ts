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

    // Admin Credentials Provider - Fixed to handle API calls directly
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantSlug: { label: "Organization", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Direct API call without using the singleton apiClient
          const endpoint = credentials.tenantSlug
            ? "/auth/login/tenant"
            : "/auth/login";
          const baseURL =
            process.env.NEXT_PUBLIC_API_URL ||
            "https://msafiri-visitor-api.onrender.com/api/v1";

          let response;

          if (credentials.tenantSlug) {
            // JSON body for tenant login
            response = await fetch(`${baseURL}${endpoint}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
                tenant_slug: credentials.tenantSlug,
              }),
            });
          } else {
            // URLSearchParams for regular login
            response = await fetch(`${baseURL}${endpoint}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                username: credentials.email,
                password: credentials.password,
              }),
            });
          }

          if (!response.ok) {
            console.error(
              "Login API error:",
              response.status,
              response.statusText
            );
            return null;
          }

          const loginResponse = await response.json();

          // Get user details with the token
          const userResponse = await fetch(`${baseURL}/auth/test-token`, {
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
            return null;
          }

          const user = await userResponse.json();

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
          console.error("Admin login failed:", error);
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

          // Get full user details
          const userResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/test-token`,
            {
              headers: {
                Authorization: `Bearer ${ssoResult.access_token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!userResponse.ok) {
            console.error(
              "User fetch failed:",
              userResponse.status,
              userResponse.statusText
            );
            return false;
          }

          const fullUser = await userResponse.json();

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

  // Enable debug in development
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
