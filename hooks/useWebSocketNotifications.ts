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
      // Always use secure WebSocket protocol (wss://) except for localhost development
      const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const protocol = isLocalhost ? 'ws:' : 'wss:';
      let baseUrl = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//localhost:8000`;
      
      // Validate and sanitize WebSocket URL to prevent SSRF
      try {
        const url = new URL(baseUrl.replace(/^ws/, 'http'));
        // Strictly allow only hardcoded, trusted hosts
        const allowedHosts = ['localhost', '127.0.0.1'];
        if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_API_HOST) {
          allowedHosts.push(process.env.NEXT_PUBLIC_API_HOST);
        }
        if (!allowedHosts.includes(url.hostname)) {
          throw new Error('Invalid WebSocket host');
        }
        baseUrl = `${protocol}//${url.host}`;
      } catch {
        baseUrl = `${protocol}//localhost:8000`;
      }
      
      const secureBaseUrl = baseUrl;
      
      const wsUrl = `${secureBaseUrl}/api/v1/chat/ws/notifications?token=${encodeURIComponent(token)}&tenant=${encodeURIComponent(tenantSlug)}`;
      
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
            console.warn("Invalid WebSocket message format");
            return;
          }

          // Additional validation for JSON string
          if (event.data.length > 10000) {
            console.warn("WebSocket message too large, ignoring");
            return;
          }

          // Strict JSON parsing and validation to prevent deserialization attacks
          const safeParseNotification = (jsonString: string): WebSocketNotification | null => {
            let rawData: unknown;
            try {
              rawData = JSON.parse(jsonString);
            } catch {
              return null;
            }

            // Ensure no prototype pollution
            if (
              rawData === null ||
              typeof rawData !== 'object' ||
              Object.prototype.hasOwnProperty.call(rawData, '__proto__') ||
              Object.prototype.hasOwnProperty.call(rawData, 'constructor') ||
              Object.prototype.hasOwnProperty.call(rawData, 'prototype')
            ) {
              return null;
            }

            // Validate type
            if (
              !('type' in rawData) ||
              (rawData.type !== "chat_message" && rawData.type !== "system_notification")
            ) {
              return null;
            }

            // Validate data object
            if (
              !('data' in rawData) ||
              typeof rawData.data !== 'object' ||
              rawData.data === null ||
              Object.prototype.hasOwnProperty.call(rawData.data, '__proto__') ||
              Object.prototype.hasOwnProperty.call(rawData.data, 'constructor') ||
              Object.prototype.hasOwnProperty.call(rawData.data, 'prototype')
            ) {
              return null;
            }

            const data = rawData.data as Record<string, unknown>;

            // Validate fields for chat_message
            if (rawData.type === "chat_message") {
              if (
                (data.chat_room_id !== undefined && typeof data.chat_room_id !== 'number') ||
                (data.sender_name !== undefined && typeof data.sender_name !== 'string') ||
                (data.message !== undefined && typeof data.message !== 'string') ||
                (data.chat_room_name !== undefined && typeof data.chat_room_name !== 'string')
              ) {
                return null;
              }
            }

            // Validate fields for system_notification
            if (rawData.type === "system_notification") {
              if (
                (data.title !== undefined && typeof data.title !== 'string') ||
                (data.body !== undefined && typeof data.body !== 'string')
              ) {
                return null;
              }
            }

            // Validate timestamp
            if (!data.timestamp || typeof data.timestamp !== 'string') {
              return null;
            }

            return {
              type: rawData.type as "chat_message" | "system_notification",
              data: {
                chat_room_id: data.chat_room_id as number | undefined,
                chat_room_name: data.chat_room_name as string | undefined,
                sender_name: data.sender_name as string | undefined,
                message: data.message as string | undefined,
                title: data.title as string | undefined,
                body: data.body as string | undefined,
                timestamp: data.timestamp as string
              }
            };
          };

          const notification = safeParseNotification(event.data);
          if (!notification) {
            console.warn("Invalid notification format");
            return;
          }

          // Sanitize user-controlled data to prevent XSS
          const sanitizeText = (text: string | undefined): string => {
            if (!text) return "";
            return text.replace(/[<>"'&]/g, (char) => {
              const entities: { [key: string]: string } = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '&': '&amp;'
              };
              return entities[char] || char;
            });
          };

          if (notification.type === "chat_message") {
            // Update unread count
            setUnreadChatCount((prev) => prev + 1);

            const safeSenderName = sanitizeText(notification.data.sender_name);
            const safeMessage = sanitizeText(notification.data.message);
            const safeChatRoomName = sanitizeText(notification.data.chat_room_name);

            // Ensure all interpolated values are sanitized and never interpreted as HTML
            const safeTitle = safeSenderName ? `New message from ${safeSenderName}` : "New message";
            const safeDescription = safeMessage ? safeMessage.substring(0, 100) + (safeMessage.length > 100 ? "..." : "") : "";

            toast({
              title: safeTitle,
              description: safeDescription,
              // Ensure toast component does not dangerouslySetInnerHTML or render as HTML
            });

            // Show browser notification if permission granted
            if (Notification.permission === "granted" && safeChatRoomName && safeSenderName) {
              const notificationTitle = `New message in ${safeChatRoomName}`;
              const notificationBody = `${safeSenderName}: ${safeMessage || 'New message'}`;
              const chatId = typeof notification.data.chat_room_id === 'number' ? notification.data.chat_room_id : 0;

              // Use Notification API safely, ensuring all values are sanitized
              new Notification(notificationTitle, {
                body: notificationBody,
                icon: "/icon/favicon.png",
                tag: `chat-${chatId}`,
              });
            }
          } else if (notification.type === "system_notification") {
            toast({
              title: sanitizeText(notification.data.title) || "System Notification",
              description: sanitizeText(notification.data.body),
            });
          }
        } catch (error) {
          // Sanitize error message to prevent log injection
          const safeError = typeof error === "string"
            ? error.replace(/[\r\n%0A%0D]/g, "")
            : "WebSocket parsing error";
          console.error("Error parsing WebSocket notification:", safeError);
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

      ws.onerror = () => {
        console.error("WebSocket notifications error occurred");
        setIsConnected(false);
        
        // Try to reconnect after error
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
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
