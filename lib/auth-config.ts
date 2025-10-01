import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import { JWT } from "next-auth/jwt";

// Admin roles that can access the portal (using actual API role strings)
const ADMIN_ROLES = ['super_admin', 'mt_admin', 'hr_admin', 'event_admin'];

// Token refresh function
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.refreshToken || token.accessToken}`,
      },
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + (refreshedTokens.expires_in || 3600) * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug for troubleshooting
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

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const loginUrl = `${apiUrl}/api/v1/auth/login`;
        const healthUrl = `${apiUrl}/health`;
        
        try {
          // First, check if API is reachable via health endpoint
          console.log('🏥 Checking API health:', healthUrl);
          const healthResponse = await fetch(healthUrl);
          console.log('🏥 Health check result:', {
            status: healthResponse.status,
            ok: healthResponse.ok,
            statusText: healthResponse.statusText
          });
          
          if (healthResponse.ok) {
            const healthData = await healthResponse.text();
            console.log('🏥 Health response:', healthData);
          }
          
          console.log('🔍 Attempting login with:', {
            apiUrl,
            loginUrl,
            email: credentials.email,
            hasPassword: !!credentials.password
          });
                    
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
          
          console.log('📡 API Response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API login failed:', {
              status: response.status,
              statusText: response.statusText,
              url: loginUrl,
              errorText,
              headers: Object.fromEntries(response.headers.entries())
            });
            return null;
          }

          const data = await response.json();
          console.log('✅ API login success:', {
            userId: data.user_id,
            role: data.role,
            tenantId: data.tenant_id,
            hasToken: !!data.access_token
          });
          
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
            refreshToken: data.refresh_token || data.access_token,
            firstLogin: data.first_login || false,
            mustChangePassword: data.must_change_password || false,
          };
        } catch (error) {
          console.error('💥 Credentials auth error:', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            apiUrl,
            loginUrl,
            email: credentials.email
          });
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
          user.refreshToken = data.refresh_token || data.access_token;
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
        token.refreshToken = user.refreshToken;
        token.firstLogin = user.firstLogin;
        token.mustChangePassword = user.mustChangePassword;
        token.accessTokenExpires = Date.now() + (60 * 60 * 1000); // 1 hour from now
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token);
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
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
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