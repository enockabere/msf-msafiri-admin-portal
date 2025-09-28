"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/ui/toast";

interface WebSocketNotification {
  type: "chat_message" | "system_notification";
  data: {
    chat_room_id?: number;
    chat_room_name?: string;
    sender_name?: string;
    message?: string;
    title?: string;
    body?: string;
    timestamp: string;
  };
}

interface UseWebSocketNotificationsProps {
  tenantSlug: string;
  enabled?: boolean;
}

export function useWebSocketNotifications({
  tenantSlug,
  enabled = true,
}: UseWebSocketNotificationsProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const token = user?.accessToken;
    if (
      !enabled ||
      !user ||
      !token ||
      !tenantSlug ||
      wsRef.current?.readyState === WebSocket.OPEN
    )
      return;

    try {
      // Use secure WebSocket in production, fallback to ws for local development
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
      const wsUrl = `${baseUrl}/api/v1/chat/ws/notifications?token=${encodeURIComponent(token)}&tenant=${encodeURIComponent(tenantSlug)}`;
      
      console.log("Attempting WebSocket connection to:", wsUrl.replace(token, "[TOKEN_HIDDEN]"));
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          // Validate event data before parsing
          if (!event.data || typeof event.data !== 'string') {
            console.warn("Invalid WebSocket message format:", event.data);
            return;
          }
          
          const notification: WebSocketNotification = JSON.parse(event.data);

          if (notification.type === "chat_message") {
            // Update unread count
            setUnreadChatCount((prev) => prev + 1);

            // Show toast notification
            toast({
              title: `New message from ${notification.data.sender_name}`,
              description:
                notification.data.message?.substring(0, 100) +
                (notification.data.message &&
                notification.data.message.length > 100
                  ? "..."
                  : ""),
            });

            // Show browser notification if permission granted
            if (Notification.permission === "granted") {
              new Notification(
                `New message in ${notification.data.chat_room_name}`,
                {
                  body: `${notification.data.sender_name}: ${notification.data.message}`,
                  icon: "/icon/favicon.png",
                  tag: `chat-${notification.data.chat_room_id}`,
                }
              );
            }
          } else if (notification.type === "system_notification") {
            toast({
              title: notification.data.title || "System Notification",
              description: notification.data.body || "",
            });
          }
        } catch (error) {
          console.error("Error parsing WebSocket notification:", error);
          console.error("Raw message data:", event.data?.substring(0, 200));
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect if not a normal closure
        if (
          event.code !== 1000 &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            30000
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket notifications error:", error);
        console.error("WebSocket URL (token hidden):", wsUrl.replace(token, "[TOKEN_HIDDEN]"));
        console.error("WebSocket readyState:", ws.readyState);
        setIsConnected(false);
        
        // Try to reconnect after error
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            console.log(`Attempting WebSocket reconnect ${reconnectAttempts.current}/${maxReconnectAttempts}`);
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error(
        "Failed to create WebSocket notifications connection:",
        error
      );
      setIsConnected(false);
    }
  }, [enabled, user, tenantSlug]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Component unmounting");
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  }, []);

  const markChatAsRead = useCallback(() => {
    setUnreadChatCount(0);
  }, []);

  useEffect(() => {
    const token = user?.accessToken;
    if (enabled && user && token && tenantSlug) {
      connect();
      requestNotificationPermission();
    }

    return () => {
      disconnect();
    };
  }, [
    enabled,
    user,
    tenantSlug,
    connect,
    disconnect,
    requestNotificationPermission,
  ]);

  return {
    isConnected,
    unreadChatCount,
    markChatAsRead,
    requestNotificationPermission,
  };
}
