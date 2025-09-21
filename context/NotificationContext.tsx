"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import apiClient, { NotificationStats } from "@/lib/api";

interface NotificationContextType {
  stats: NotificationStats | null;
  refreshStats: () => Promise<void>;
  decrementUnread: () => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { isAuthenticated, accessToken } = useAuth();
  const [stats, setStats] = useState<NotificationStats | null>(null);

  const refreshStats = async () => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    try {
      apiClient.setToken(accessToken);
      const statsData = await apiClient.getNotificationStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch notification stats:", error);
    }
  };

  const decrementUnread = () => {
    setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null);
  };

  const markAllRead = () => {
    setStats(prev => prev ? { ...prev, unread: 0 } : null);
  };

  useEffect(() => {
    refreshStats();
    
    const handleRefresh = () => {
      setTimeout(() => {
        refreshStats();
      }, 500);
    };
    
    const handleRefreshPending = () => {
      setTimeout(() => {
        refreshStats();
      }, 500);
    };
    
    window.addEventListener('refreshNotifications', handleRefresh);
    window.addEventListener('refreshPendingInvitations', handleRefreshPending);
    
    return () => {
      window.removeEventListener('refreshNotifications', handleRefresh);
      window.removeEventListener('refreshPendingInvitations', handleRefreshPending);
    };
  }, [isAuthenticated, accessToken]);

  return (
    <NotificationContext.Provider value={{ stats, refreshStats, decrementUnread, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
}