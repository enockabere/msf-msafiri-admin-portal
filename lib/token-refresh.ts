import { getSession, signOut } from "next-auth/react";

interface TokenRefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

class TokenManager {
  private refreshPromise: Promise<string | null> | null = null;
  private isRefreshing = false;

  async refreshToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const session = await getSession();
      if (!session?.user?.accessToken) {
        throw new Error("No session found");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.user.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data: TokenRefreshResponse = await response.json();
      
      // Update the session with new token
      await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...session,
          user: {
            ...session.user,
            accessToken: data.access_token,
          },
        }),
      });

      return data.access_token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      await this.handleRefreshFailure();
      return null;
    }
  }

  private async handleRefreshFailure() {
    try {
      await signOut({
        redirect: false,
        callbackUrl: "/login",
      });
      
      if (typeof window !== "undefined") {
        window.location.href = "/login?sessionExpired=true&reason=tokenRefreshFailed";
      }
    } catch (error) {
      console.error("Error during logout:", error);
      if (typeof window !== "undefined") {
        window.location.href = "/login?sessionExpired=true&reason=error";
      }
    }
  }

  async getValidToken(): Promise<string | null> {
    const session = await getSession();
    if (!session?.user?.accessToken) {
      return null;
    }

    // Check if token is about to expire (within 5 minutes)
    const tokenPayload = this.parseJWT(session.user.accessToken);
    if (tokenPayload && tokenPayload.exp) {
      const expirationTime = tokenPayload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 5 * 60 * 1000) {
        const newToken = await this.refreshToken();
        return newToken || session.user.accessToken;
      }
    }

    return session.user.accessToken;
  }

  private parseJWT(token: string): {exp?: number} | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }
}

export const tokenManager = new TokenManager();