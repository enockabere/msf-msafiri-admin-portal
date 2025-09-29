"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface SessionState {
  isValid: boolean;
  isExpiring: boolean;
  timeUntilExpiry: number | null;
  lastActivity: number;
}

export function useSessionManager() {
  const { data: session, status, update } = useSession();
  const [sessionState, setSessionState] = useState<SessionState>({
    isValid: true,
    isExpiring: false,
    timeUntilExpiry: null,
    lastActivity: Date.now(),
  });
  
  const lastActivityRef = useRef(Date.now());
  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Update activity timestamp
  const updateActivity = () => {
    const now = Date.now();
    lastActivityRef.current = now;
    setSessionState(prev => ({ ...prev, lastActivity: now }));
  };

  // Check if session needs refresh
  const checkSessionExpiry = useCallback(() => {
    if (!session?.user?.accessToken) return;

    try {
      // Parse JWT to get expiration
      const tokenPayload = parseJWT(session.user.accessToken);
      if (tokenPayload?.exp) {
        const expirationTime = tokenPayload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;
        
        setSessionState(prev => ({
          ...prev,
          timeUntilExpiry,
          isExpiring: timeUntilExpiry < 5 * 60 * 1000, // 5 minutes
          isValid: timeUntilExpiry > 0,
        }));

        // Auto-refresh session if expiring soon
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          update({}); // Trigger NextAuth session update
        }
      }
    } catch (error) {
      console.error("Error checking session expiry:", error);
    }
  }, [session, update]);

  // Parse JWT token
  const parseJWT = (token: string): { exp?: number } | null => {
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
  };

  // Setup activity tracking and session monitoring
  useEffect(() => {
    if (status !== 'authenticated') return;

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check session expiry every minute
    sessionCheckRef.current = setInterval(checkSessionExpiry, 60 * 1000);
    
    // Initial check
    checkSessionExpiry();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
      }
    };
  }, [session, status, checkSessionExpiry]);

  return {
    session,
    status,
    sessionState,
    updateActivity,
    refreshSession: update,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
}