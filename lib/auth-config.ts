import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import { JWT } from "next-auth/jwt";

// Roles that can access the portal (using actual API role strings)
const ALLOWED_ROLES = ['SUPER_ADMIN', 'MT_ADMIN', 'HR_ADMIN', 'EVENT_ADMIN', 'VETTING_COMMITTEE', 'VETTING_APPROVER', 'vetting_approver', 'super_admin', 'mt_admin', 'hr_admin', 'event_admin', 'vetting_committee'];

// Token refresh function with improved error handling
let refreshInProgress = false;
let refreshPromise: Promise<JWT> | null = null;

async function refreshAccessToken(token: JWT): Promise<JWT> {
  // If a refresh is already in progress, wait for it instead of starting a new one
  if (refreshInProgress && refreshPromise) {
    return refreshPromise;
  }

  refreshInProgress = true;
  refreshPromise = (async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const refreshUrl = apiUrl.endsWith('/api/v1')
        ? `${apiUrl}/auth/refresh`
        : `${apiUrl}/api/v1/auth/refresh`;

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.accessToken}`,
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ Token refresh failed (${response.status})`);
        // Return the existing token - don't force logout
        return {
          ...token,
          error: undefined, // Don't mark as error yet, let the API handle it
        };
      }

      const refreshedTokens = await response.json();
      console.log('✅ Token refreshed successfully');

      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + (refreshedTokens.expires_in || 14400) * 1000, // 4 hours default
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        error: undefined,
      };
    } catch (error) {
      console.warn('⚠️ Token refresh error:', error instanceof Error ? error.message : 'Unknown error');
      // Return the existing token - don't force logout
      return {
        ...token,
        error: undefined, // Don't mark as error to avoid sudden logout
      };
    } finally {
      refreshInProgress = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const authOptions: NextAuthOptions = {
  debug: false, // Disable debug to reduce console noise
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
        // API URL should already include /api/v1 if needed
        const loginUrl = apiUrl.endsWith('/api/v1')
          ? `${apiUrl}/auth/login`
          : `${apiUrl}/api/v1/auth/login`;
        const healthUrl = apiUrl.replace('/api/v1', '/health');
        
        try {
          // First, check if API is reachable via health endpoint
          console.warn('🏥 Checking API health:', healthUrl);
          const healthResponse = await fetch(healthUrl);
          console.warn('🏥 Health check result:', {
            status: healthResponse.status,
            ok: healthResponse.ok,
            statusText: healthResponse.statusText
          });
          
          if (healthResponse.ok) {
            const healthData = await healthResponse.text();
            console.warn('🏥 Health response:', healthData);
          }
          
          console.warn('🔍 Attempting login with:', {
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
          
          console.warn('📡 API Response:', {
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
          console.warn('✅ API login success:', {
            userId: data.user_id,
            role: data.role,
            allRoles: data.all_roles,
            tenantId: data.tenant_id,
            hasToken: !!data.access_token,
            fullResponse: data
          });
          
          // Check if user has allowed role (primary or secondary)
          const hasAllowedRole = data.role && ALLOWED_ROLES.includes(data.role);
          const hasAllowedSecondaryRole = data.all_roles && 
            Array.isArray(data.all_roles) && 
            data.all_roles.some((role: string) => ALLOWED_ROLES.includes(role));
          
          if (!hasAllowedRole && !hasAllowedSecondaryRole) {
            console.error('❌ Access denied - insufficient permissions');
            console.error('🔑 Primary role:', data.role);
            console.error('🔑 All roles:', data.all_roles);
            console.error('🔑 Required roles:', ALLOWED_ROLES);
            // Return null instead of throwing error
            return null;
          }
                    
          return {
            id: data.user_id?.toString() || '1',
            email: credentials.email,
            name: data.full_name || credentials.email.split('@')[0],
            role: data.role,
            all_roles: data.all_roles,
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
          const ssoUrl = apiUrl.endsWith('/api/v1')
            ? `${apiUrl}/auth/sso/microsoft`
            : `${apiUrl}/api/v1/auth/sso/microsoft`;
          const response = await fetch(ssoUrl, {
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
          
          // Check if user has allowed role (primary or secondary)
          const hasAllowedRole = data.role && ALLOWED_ROLES.includes(data.role);
          const hasAllowedSecondaryRole = data.all_roles && 
            Array.isArray(data.all_roles) && 
            data.all_roles.some((role: string) => ALLOWED_ROLES.includes(role));
          
          if (!hasAllowedRole && !hasAllowedSecondaryRole) {
            console.error('❌ Access denied: User does not have allowed role');
            console.error('🔑 Primary role:', data.role);
            console.error('🔑 All roles:', data.all_roles);
            console.error('🔑 Required roles:', ALLOWED_ROLES);
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
        token.all_roles = user.all_roles;
        token.tenantId = user.tenantId;
        token.isActive = user.isActive;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.firstLogin = user.firstLogin;
        token.mustChangePassword = user.mustChangePassword;
        token.accessTokenExpires = Date.now() + (4 * 60 * 60 * 1000); // 4 hours from now
        token.error = undefined; // Clear any previous errors
      }

      // If refresh failed too many times, mark for logout (but don't logout immediately)
      if (token.error === 'RefreshAccessTokenError') {
        // Keep the existing token data so user can continue working
        // They'll be prompted to re-login when they try to make an authenticated request
        return token;
      }

      // Return previous token if the access token has not expired yet (with 1 hour buffer)
      const bufferTime = 60 * 60 * 1000; // 1 hour buffer - refresh when token has 1 hour left
      if (Date.now() < ((token.accessTokenExpires as number) - bufferTime)) {
        return token;
      }

      // Access token will expire within 1 hour, try to refresh it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Don't immediately logout on errors - let the user continue their work
      // The API will handle invalid tokens appropriately
      if (token && session?.user) {
        session.user.id = token.sub || '';
        session.user.role = (token.role as string) || '';
        session.user.all_roles = (token.all_roles as string[]) || [];
        session.user.tenantId = (token.tenantId as string) || '';
        session.user.isActive = (token.isActive as boolean) || false;
        session.user.accessToken = (token.accessToken as string) || '';
        session.user.firstLogin = (token.firstLogin as boolean) || false;
        session.user.mustChangePassword = (token.mustChangePassword as boolean) || false;

        // Add error state to session if refresh failed (for UI to display warning)
        if (token.error) {
          session.error = token.error as string;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Get the correct base URL with portal path
      const portalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${baseUrl}/portal`;
      
      // Always redirect errors to login
      if (url.includes('/auth/error') || url.includes('error=') || url.includes('session_expired') || url.includes('SessionRequired')) {
        return `${portalBaseUrl}/login`;
      }
      
      if (url.startsWith('/')) {
        return `${portalBaseUrl}${url}`;
      }
      
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Default redirect to login
      return `${portalBaseUrl}/login`;
    },
  },
  pages: {
    signIn: '/portal/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours - maximum session duration
    updateAge: 30 * 60, // Only check/update session when accessed after 30 minutes of inactivity
  },
  logger: {
    error: () => {}, // Suppress error logs
    warn: () => {},  // Suppress warning logs
    debug: () => {}, // Suppress debug logs
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