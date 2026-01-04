"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";

/**
 * SessionRefresher - Proactively refreshes tokens before they expire
 * and keeps the API client in sync with the latest token.
 *
 * This prevents "Could not validate credentials" errors by refreshing
 * tokens 30 minutes before expiry, even if the user is idle on one page.
 */
export function SessionRefresher() {
  const { data: session, status, update } = useSession();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    // Don't run on server
    if (typeof window === "undefined") return;

    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Update API client token whenever session changes
    if (status === "authenticated" && session?.user?.accessToken) {
      const currentToken = apiClient.getToken();
      
      if (currentToken !== session.user.accessToken) {
        apiClient.setToken(session.user.accessToken);
        console.log("🔑 API token updated");
      }

      // Schedule proactive token refresh
      // Tokens last 4 hours, refresh after 3 hours to have a 1-hour safety buffer
      const refreshIn = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
      const now = Date.now();

      console.log("🕰️ SessionRefresher: Checking refresh schedule", {
        lastRefresh: lastRefreshRef.current ? new Date(lastRefreshRef.current).toISOString() : 'never',
        timeSinceLastRefresh: lastRefreshRef.current ? Math.round((now - lastRefreshRef.current) / 1000 / 60) : 'N/A',
        refreshInMinutes: refreshIn / 1000 / 60
      });

      // Don't schedule if we just refreshed (within last 30 minutes)
      if (now - lastRefreshRef.current < 30 * 60 * 1000) {
        console.log("⏸️ SessionRefresher: Skipping refresh - too recent");
        return;
      }

      refreshTimerRef.current = setTimeout(async () => {
        try {
          console.log("🔄 SessionRefresher: Proactively refreshing token...");
          lastRefreshRef.current = Date.now();

          // Call the refresh endpoint directly
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/refresh`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.user.accessToken}`,
              },
            }
          );

          console.log("🔄 SessionRefresher: Refresh response status:", response.status);
          if (response.ok) {
            const newTokenData = await response.json();
            console.log("✅ SessionRefresher: Token refreshed successfully");

            // Update the session with new token (this won't cause page refresh)
            await update({
              ...session,
              user: {
                ...session.user,
                accessToken: newTokenData.access_token,
              },
            });

            // Update API client immediately
            apiClient.setToken(newTokenData.access_token);
          } else {
            const errorText = await response.text();
            console.warn("⚠️ SessionRefresher: Token refresh failed:", response.status, errorText);
          }
        } catch (error) {
          console.warn("⚠️ SessionRefresher: Token refresh error:", error);
        }
      }, refreshIn);

      console.log(`⏰ SessionRefresher: Token refresh scheduled in ${refreshIn / 1000 / 60} minutes`);
    } else if (status === "unauthenticated") {
      console.log("🚫 SessionRefresher: User unauthenticated, clearing token");
      apiClient.clearToken();
    } else {
      console.log("🕰️ SessionRefresher: Session status:", status);
    }

    // Cleanup
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [session?.user?.accessToken, status, update, session]);

  return null;
}
