// app/api/auth/[...nextauth]/route.ts - Fixed for Production
import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";

// FIXED: Robust API URL detection for server-side
const getApiUrl = () => {
  // Check environment variables in order of preference
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log(
      "🔧 Using API URL from NEXT_PUBLIC_API_URL:",
      process.env.NEXT_PUBLIC_API_URL
    );
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (process.env.API_URL) {
    console.log("🔧 Using API URL from API_URL:", process.env.API_URL);
    return process.env.API_URL;
  }

  // Environment-based fallbacks
  if (process.env.NODE_ENV === "production") {
    const prodUrl = "https://msafiri-visitor-api.onrender.com/api/v1";
    console.log("🔧 Using production API URL:", prodUrl);
    return prodUrl;
  }

  const devUrl = "http://localhost:8000/api/v1";
  console.log("🔧 Using development API URL:", devUrl);
  return devUrl;
};

// FIXED: Get NextAuth URL dynamically
const getNextAuthUrl = () => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Fallback for production
  if (process.env.NODE_ENV === "production") {
    return "https://msf-msafiri-admin-portal.vercel.app";
  }

  return "http://localhost:3000";
};

export const authOptions: NextAuthOptions = {
  providers: [
    // Super Admin Credentials Provider - SIMPLIFIED
    CredentialsProvider({
      id: "admin-credentials",
      name: "Super Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("❌ Missing credentials");
            return null;
          }

          const apiUrl = getApiUrl();
          console.log(
            "🔧 NextAuth attempting login to:",
            `${apiUrl}/auth/login`
          );

          // Call your FastAPI login endpoint
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              username: credentials.email,
              password: credentials.password,
            }),
          });

          console.log("📡 Login response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ API login failed:", response.status, errorText);
            return null;
          }

          const loginData = await response.json();
          console.log(
            "✅ Login successful. Token received for:",
            credentials.email
          );

          // SIMPLIFIED: Return user data directly from login response
          // Your API already returns user info in the login response
          return {
            id: loginData.user_id?.toString() || "1",
            email: credentials.email,
            name: credentials.email.split("@")[0], // Use email prefix as name
            role: loginData.role || "super_admin",
            accessToken: loginData.access_token,
            tenantId: loginData.tenant_id,
            isActive: true,
            firstLogin: loginData.first_login || false,
          };
        } catch (error) {
          console.error("❌ Auth error:", error);
          return null;
        }
      },
    }),

    // Azure AD Provider (only if configured)
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            tenantId: process.env.AZURE_AD_TENANT_ID,
            authorization: {
              params: {
                scope: "openid profile email User.Read",
              },
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    async signIn({ user, account }) {
      console.log("🚪 SignIn callback - Provider:", account?.provider);

      // For Microsoft SSO, sync with your API
      if (account?.provider === "azure-ad") {
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/auth/sso/microsoft`, {
            method: "POST",
            headers: {
              "X-Microsoft-Token": account.access_token!,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            console.error("❌ SSO sync failed:", response.status);
            return false;
          }

          const ssoResult = await response.json();
          console.log("✅ SSO sync successful");

          // Add data to user object for JWT callback
          user.role = ssoResult.role;
          user.tenantId = ssoResult.tenant_id;
          user.accessToken = ssoResult.access_token;

          return true;
        } catch (error) {
          console.error("❌ SSO integration error:", error);
          return false;
        }
      }

      console.log("✅ SignIn successful for:", user.email);
      return true;
    },

    async jwt({ token, user }) {
      // First time JWT callback is run, user object is available
      if (user) {
        console.log("🎯 JWT callback - storing user data for:", user.email);
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

    async redirect({ url, baseUrl }) {
      console.log("🔄 Redirect callback - URL:", url, "BaseURL:", baseUrl);

      // FIXED: Handle production redirects properly
      const nextAuthUrl = getNextAuthUrl();

      // Handle error redirects
      if (url.includes("/auth/error") || url.includes("error=")) {
        console.log("🚨 Redirecting to login due to auth error");
        return `${nextAuthUrl}/login?error=auth_failed`;
      }

      // If url is relative, make it absolute
      if (url.startsWith("/")) {
        const redirectUrl = `${nextAuthUrl}${url}`;
        console.log("🔄 Relative redirect to:", redirectUrl);
        return redirectUrl;
      }

      // If url is on the same domain, allow it
      if (url.startsWith(nextAuthUrl)) {
        console.log("🔄 Same domain redirect to:", url);
        return url;
      }

      // Default redirect
      const defaultUrl = `${nextAuthUrl}/dashboard`;
      console.log("🔄 Default redirect to:", defaultUrl);
      return defaultUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login", // FIXED: Redirect errors back to login page
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // FIXED: Ensure secret is properly configured
  secret: process.env.NEXTAUTH_SECRET,

  // trustHost is not a valid AuthOptions property and has been removed

  // Enable debug in development only
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
