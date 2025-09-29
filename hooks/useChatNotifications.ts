"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { toast } from "@/components/ui/toast";

interface ChatNotification {
  id: string;
  type: "message" | "room_created" | "user_joined";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  chat_id?: number;
  sender?: string;
}

interface Conversation {
  unread_count?: number;
  email?: string;
  name?: string;
}

interface UseChatNotificationsProps {
  tenantSlug: string;
  enabled?: boolean;
}

export function useChatNotifications({
  tenantSlug,
  enabled = true,
}: UseChatNotificationsProps) {
  const { apiClient } = useAuthenticatedApi();
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  // Simulate real-time notifications with polling
  const pollForNotifications = useCallback(async () => {
    if (!tenantSlug || !apiClient) {
      console.warn("Missing tenantSlug or apiClient for notifications");
      return;
    }

    try {
      const conversations = await apiClient.request("/chat/conversations/", {
        headers: { "X-Tenant-ID": tenantSlug },
      });

      const totalUnread = (conversations as Conversation[]).reduce(
        (sum: number, conv: Conversation) => {
          const unreadCount = conv.unread_count || 0;

          return sum + unreadCount;
        },
        0
      );

      setUnreadCount((prevCount) => {
        if (totalUnread > prevCount && prevCount >= 0) {
          const newMessages = totalUnread - prevCount;

          setNewMessageCount(newMessages);
        }

        return totalUnread;
      });

      setIsConnected(true);
    } catch (error: unknown) {
      console.error("Error polling for chat notifications:", error);

      // Check if it's an authentication error
      const errorResponse = error as { response?: { status?: number } };
      if (errorResponse.response?.status === 401) {
        console.warn(
          "Authentication error in chat notifications - user may need to re-login"
        );
      } else if (errorResponse.response?.status === 403) {
        console.warn("Permission denied for chat notifications");
      }

      setIsConnected(false);
    }
  }, [apiClient, tenantSlug]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();

      return permission === "granted";
    }

    const isGranted =
      "Notification" in window && Notification.permission === "granted";

    return isGranted;
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setNewMessageCount(0);
    // Trigger refresh to get updated counts
    setTimeout(() => {
      pollForNotifications();
    }, 500);
  }, [pollForNotifications]);

  // Show desktop notification
  const showDesktopNotification = useCallback(
    (title: string, body: string, options?: NotificationOptions) => {
      if ("Notification" in window && Notification.permission === "granted") {
        return new Notification(title, {
          body,
          icon: "/icon/favicon.png",
          tag: "chat-notification",
          ...options,
        });
      }
      return null;
    },
    []
  );

  // Handle toast notifications when new messages are detected
  useEffect(() => {
    if (newMessageCount > 0) {
      toast({
        title: "New Messages",
        description: `You have ${newMessageCount} new message${
          newMessageCount > 1 ? "s" : ""
        }`,
      });

      // Show desktop notification
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("New Chat Message", {
            body: `You have ${newMessageCount} new message${
              newMessageCount > 1 ? "s" : ""
            }`,
            icon: "/icon/favicon.png",
            tag: "chat-notification",
          });
        } else if (Notification.permission === "default") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification("New Chat Message", {
                body: `You have ${newMessageCount} new message${
                  newMessageCount > 1 ? "s" : ""
                }`,
                icon: "/icon/favicon.png",
                tag: "chat-notification",
              });
            }
          });
        }
      }

      // Reset the counter
      setNewMessageCount(0);
    }
  }, [newMessageCount]);

  // Initialize notifications with regular polling
  useEffect(() => {
    setIsConnected(true);

    pollForNotifications();

    // Set up regular polling every 3 seconds for real-time notifications
    const pollInterval = setInterval(() => {
      pollForNotifications();
    }, 3000);

    // Listen for custom events to refresh notifications immediately
    const handleRefreshNotifications = () => {
      pollForNotifications();
    };

    const handleChatMessageSent = () => {
      setTimeout(() => {
        pollForNotifications();
      }, 1000);
    };

    window.addEventListener("refreshNotifications", handleRefreshNotifications);
    window.addEventListener("chatMessageSent", handleChatMessageSent);

    return () => {
      clearInterval(pollInterval);
      setIsConnected(false);
      window.removeEventListener(
        "refreshNotifications",
        handleRefreshNotifications
      );
      window.removeEventListener("chatMessageSent", handleChatMessageSent);
    };
  }, [enabled, pollForNotifications, tenantSlug]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    clearAll,
    showDesktopNotification,
    requestNotificationPermission,
  };
}
