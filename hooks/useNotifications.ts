// hooks/useNotifications.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import apiClient, { Notification, NotificationStats } from "@/lib/api";

export function useNotifications() {
  const { isAuthenticated, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return;

    try {
      setError(null);

      // Set token in API client
      apiClient.setToken(accessToken);

      const [notificationsData, statsData] = await Promise.all([
        apiClient.getNotifications(),
        apiClient.getNotificationStats(),
      ]);

      setNotifications(notificationsData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch notifications"
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated, accessToken, fetchNotifications]);

  const markAsRead = async (notificationId: number) => {
    if (!accessToken) return;

    try {
      apiClient.setToken(accessToken);
      await apiClient.markNotificationRead(notificationId);

      // Update local state
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

      // Update stats
      setStats((prev) => (prev ? { ...prev, unread: prev.unread - 1 } : null));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!accessToken) return;

    try {
      apiClient.setToken(accessToken);
      await apiClient.markAllNotificationsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );

      // Update stats
      setStats((prev) => (prev ? { ...prev, unread: 0 } : null));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
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
