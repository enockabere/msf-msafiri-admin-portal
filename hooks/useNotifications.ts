import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { signOut } from "next-auth/react";
import apiClient, { Notification, NotificationStats } from "@/lib/api";

export function useNotifications() {
  const { isAuthenticated, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSessionExpiry = async () => {
    setNotifications([]);
    setStats(null);
    setError("Session expired");

    await signOut({
      redirect: false,
      callbackUrl: "/login",
    });

    window.location.href = "/login?sessionExpired=true";
  };

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return;

    try {
      setError(null);

      apiClient.setToken(accessToken);

      const [notificationsData, statsData] = await Promise.all([
        apiClient.getNotifications(),
        apiClient.getNotificationStats(),
      ]);

      setNotifications(notificationsData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch notifications";

      if (
        errorMessage.includes("Session expired") ||
        errorMessage.includes("please log in again")
      ) {
        await handleSessionExpiry();
        return;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    fetchNotifications();
    
    const handleRefresh = () => {
      // Immediate refresh
      fetchNotifications();
      // Also refresh after delay to catch any delayed notifications
      setTimeout(() => {
        fetchNotifications();
      }, 2000);
    };
    
    const handleRefreshPending = () => {
      // Immediate refresh
      fetchNotifications();
      // Also refresh after delay
      setTimeout(() => {
        fetchNotifications();
      }, 2000);
    };
    
    window.addEventListener('refreshNotifications', handleRefresh);
    window.addEventListener('refreshPendingInvitations', handleRefreshPending);
    
    return () => {
      window.removeEventListener('refreshNotifications', handleRefresh);
      window.removeEventListener('refreshPendingInvitations', handleRefreshPending);
    };
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: number) => {
    if (!accessToken) return;

    try {
      apiClient.setToken(accessToken);
      await apiClient.markNotificationRead(notificationId);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : notification
        )
      );

      setStats((prev) =>
        prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to mark notification as read";

      if (
        errorMessage.includes("Session expired") ||
        errorMessage.includes("please log in again")
      ) {
        await handleSessionExpiry();
      }
    }
  };

  const markAllAsRead = async () => {
    if (!accessToken) return;

    try {
      apiClient.setToken(accessToken);
      await apiClient.markAllNotificationsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );

      setStats((prev) => (prev ? { ...prev, unread: 0 } : null));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to mark all notifications as read";

      if (
        errorMessage.includes("Session expired") ||
        errorMessage.includes("please log in again")
      ) {
        await handleSessionExpiry();
      }
    }
  };

  return {
    notifications,
    stats,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}