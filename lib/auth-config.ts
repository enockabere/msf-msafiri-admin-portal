import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";

// Admin roles that can access the portal (using actual API role strings)
const ADMIN_ROLES = ['super_admin', 'mt_admin', 'hr_admin', 'event_admin'];

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const loginUrl = `${apiUrl}/api/v1/auth/login`;
                    
          const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              username: credentials.email,
              password: credentials.password,
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API login failed:', response.status, errorText);
            return null;
          }

          const data = await response.json();
          
          // Check if user has admin role
          if (!data.role || !ADMIN_ROLES.includes(data.role)) {
            console.error('❌ Access denied - insufficient role:', data.role);
            console.error('🔑 Required roles:', ADMIN_ROLES);
            // Return null instead of throwing error
            return null;
          }
                    
          return {
            id: data.user_id?.toString() || '1',
            email: credentials.email,
            name: data.full_name || credentials.email.split('@')[0],
            role: data.role,
            tenantId: data.tenant_id,
            isActive: true,
            accessToken: data.access_token,
            firstLogin: data.first_login || false,
            mustChangePassword: data.must_change_password || false,
          };
        } catch (error) {
          console.error('💥 Credentials auth error:', error);
          // Don't throw errors, just return null to let NextAuth handle it
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Microsoft SSO
      if (account?.provider === 'azure-ad') {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                    
          // Call API SSO endpoint with Microsoft token
          const response = await fetch(`${apiUrl}/api/v1/auth/sso/microsoft`, {
            method: 'POST',
            headers: {
              'X-Microsoft-Token': account.access_token!,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ SSO authentication failed:', response.status, errorText);
            return false;
          }

          const data = await response.json();
          
          // Check if user has admin role
          if (!data.role || !ADMIN_ROLES.includes(data.role)) {
            console.error('❌ Access denied: User does not have admin role:', data.role);
            console.error('📋 Available roles in response:', Object.keys(data));
            // Redirect to error page with specific message
            throw new Error('insufficient_role');
          }

          // Store API data in user object for JWT callback
          user.id = data.user_id?.toString();
          user.role = data.role;
          user.tenantId = data.tenant_id;
          user.accessToken = data.access_token;
          user.firstLogin = data.first_login || false;
          user.isActive = true;
          
          return true;
        } catch (error) {
          console.error('SSO sign-in error:', error);
          return false;
        }
      }
      
      return !!user;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.isActive = user.isActive;
        token.accessToken = user.accessToken;
        token.firstLogin = user.firstLogin;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
        session.user.isActive = token.isActive as boolean;
        session.user.accessToken = token.accessToken as string;
        session.user.firstLogin = token.firstLogin as boolean;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.includes('/auth/error') || url.includes('error=')) {
        return `${baseUrl}/login?error=access_denied`;
      }
      
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Default redirect to dashboard
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  events: {
    async signOut() {
      // Clear any client-side storage on signout
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};