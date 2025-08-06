import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import apiClient from "@/lib/api";

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
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "staff", // Default role, will be updated from your API
        };
      },
    }),

    // Admin Credentials Provider (for Super Admins)
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
          // Use your existing API client
          const response = await apiClient.login(
            credentials.email,
            credentials.password,
            credentials.tenantSlug || undefined
          );

          // Get user details
          const user = await apiClient.getCurrentUser();

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.full_name,
            role: user.role,
            tenantId: user.tenant_id,
            isActive: user.is_active,
            accessToken: response.access_token,
            firstLogin: response.first_login || false,
          };
        } catch (error) {
          console.error("Admin login failed:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // For Microsoft SSO, sync with your API
      if (account?.provider === "azure-ad") {
        try {
          // Call your SSO endpoint to create/update user
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
            console.error("SSO sync failed");
            return false;
          }

          const ssoResult = await response.json();

          // Add API data to user object
          user.accessToken = ssoResult.access_token;
          user.firstLogin = ssoResult.first_login || false;

          // Get full user details from your API
          apiClient.setToken(ssoResult.access_token);
          const fullUser = await apiClient.getCurrentUser();

          user.role = fullUser.role;
          user.tenantId = fullUser.tenant_id;
          user.isActive = fullUser.is_active;

          return true;
        } catch (error) {
          console.error("SSO integration error:", error);
          return false;
        }
      }

      // For admin credentials, user is already validated
      return true;
    },

    async jwt({ token, user, account }) {
      // Store additional user data in JWT
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
      if (token) {
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
    signIn: "/login", // Custom login page
    error: "/auth/error", // Error page
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
