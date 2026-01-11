import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import { JWT } from "next-auth/jwt";

// Roles that can access the portal (using actual API role strings)
const ALLOWED_ROLES = ['SUPER_ADMIN', 'MT_ADMIN', 'HR_ADMIN', 'EVENT_ADMIN', 'VETTING_COMMITTEE', 'VETTING_APPROVER', 'vetting_approver', 'super_admin', 'mt_admin', 'hr_admin', 'event_admin', 'vetting_committee'];

// Token refresh function with improved error handling
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const refreshUrl = apiUrl.endsWith('/api/v1')
      ? `${apiUrl}/auth/refresh`
      : `${apiUrl}/api/v1/auth/refresh`;

    console.log('🔄 Attempting token refresh...');
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.warn(`⚠️ Token refresh failed (${response.status})`);
      // Mark for re-authentication on any refresh failure
      return {
        ...token,
        error: 'RefreshAccessTokenError',
      };
    }

    const refreshedTokens = await response.json();
    console.log('✅ Token refreshed successfully');

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + (refreshedTokens.expires_in || 86400) * 1000, // 24 hours default
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.warn('⚠️ Token refresh error:', error instanceof Error ? error.message : 'Unknown error');
    // Mark for re-authentication on any error
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
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
          
          // Use a shorter timeout for server-side requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const healthResponse = await fetch(healthUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'MSafiri-Portal/1.0'
            }
          });
          clearTimeout(timeoutId);
          
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
          
          const loginController = new AbortController();
          const loginTimeoutId = setTimeout(() => loginController.abort(), 10000); // 10 second timeout for login
                    
          const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'MSafiri-Portal/1.0'
            },
            body: new URLSearchParams({
              username: credentials.email,
              password: credentials.password,
            }),
            signal: loginController.signal
          });
          clearTimeout(loginTimeoutId);
          
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
            
            // Return more specific error messages based on status
            if (response.status === 500) {
              return null; // This will show "Database connection error. Please try again."
            } else if (response.status === 401 || response.status === 422) {
              return null; // This will show "Invalid email or password"
            }
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
          // Check if it's a timeout/network error
          if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch failed'))) {
            console.error('💥 Network/Timeout error - API server may be unreachable:', {
              error: error.message,
              apiUrl,
              loginUrl,
              email: credentials.email,
              suggestion: 'Check if API server is running and accessible'
            });
          } else {
            console.error('💥 Credentials auth error:', {
              error: error instanceof Error ? error.message : error,
              stack: error instanceof Error ? error.stack : undefined,
              apiUrl,
              loginUrl,
              email: credentials.email
            });
          }
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
        token.accessTokenExpires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now (matches API)
        token.error = undefined; // Clear any previous errors
      }

      // If refresh failed, mark for logout
      if (token.error === 'RefreshAccessTokenError') {
        return token; // Keep token but with error flag
      }

      // Don't auto-refresh tokens - let the API client handle it
      // This prevents conflicts between NextAuth and API client refresh logic
      return token;
    },
    async session({ session, token }) {
      // If token refresh failed, clear the session to force re-login
      if (token.error === 'RefreshAccessTokenError') {
        console.log('🚪 Token refresh failed, clearing session');
        return null as any; // This will force NextAuth to clear the session
      }
      
      if (token && session?.user) {
        session.user.id = token.sub || '';
        session.user.role = (token.role as string) || '';
        session.user.all_roles = (token.all_roles as string[]) || [];
        session.user.tenantId = (token.tenantId as string) || '';
        session.user.isActive = (token.isActive as boolean) || false;
        session.user.accessToken = (token.accessToken as string) || '';
        session.user.firstLogin = (token.firstLogin as boolean) || false;
        session.user.mustChangePassword = (token.mustChangePassword as boolean) || false;
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