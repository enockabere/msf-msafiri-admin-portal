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
      // Use secure WebSocket protocol (wss://) in production
      const isProduction = process.env.NODE_ENV === 'production';
      const protocol = isProduction ? 'wss:' : 'ws:';
      let baseUrl = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//localhost:8000`;
      
      // Validate and sanitize WebSocket URL to prevent SSRF
      try {
        const url = new URL(baseUrl.replace(/^ws/, 'http'));
        const allowedHosts = ['localhost', '127.0.0.1', process.env.NEXT_PUBLIC_API_HOST].filter(Boolean);
        if (!allowedHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
          throw new Error('Invalid WebSocket host');
        }
        baseUrl = `${protocol}//${url.host}`;
      } catch {
        baseUrl = `${protocol}//localhost:8000`;
      }
      
      // Ensure secure protocol in production
      const secureBaseUrl = isProduction && baseUrl.startsWith('ws:') 
        ? baseUrl.replace('ws:', 'wss:') 
        : baseUrl;
      
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
          
          // Safe parsing function to validate structure
          const parseNotification = (jsonString: string): WebSocketNotification | null => {
            let rawData: any;
            try {
              rawData = JSON.parse(jsonString);
            } catch {
              return null;
            }
            
            // Prevent prototype pollution
            if (rawData && (rawData.__proto__ || rawData.constructor || rawData.prototype)) {
              return null;
            }
            
            if (!rawData || typeof rawData !== 'object' || 
                !rawData.type || !rawData.data ||
                typeof rawData.data !== 'object') {
              return null;
            }
            
            if (rawData.type !== "chat_message" && rawData.type !== "system_notification") {
              return null;
            }
            
            const data = rawData.data;
            if (rawData.type === "chat_message") {
              if (data.chat_room_id !== undefined && typeof data.chat_room_id !== 'number') return null;
              if (data.sender_name !== undefined && typeof data.sender_name !== 'string') return null;
              if (data.message !== undefined && typeof data.message !== 'string') return null;
              if (data.chat_room_name !== undefined && typeof data.chat_room_name !== 'string') return null;
            } else {
              if (data.title !== undefined && typeof data.title !== 'string') return null;
              if (data.body !== undefined && typeof data.body !== 'string') return null;
            }
            
            if (!data.timestamp || typeof data.timestamp !== 'string') return null;
            
            return {
              type: rawData.type,
              data: {
                chat_room_id: data.chat_room_id,
                chat_room_name: data.chat_room_name,
                sender_name: data.sender_name,
                message: data.message,
                title: data.title,
                body: data.body,
                timestamp: data.timestamp
              }
            };
          };
          
          const notification = parseNotification(event.data);
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

            // Show toast notification with additional sanitization
            const safeTitle = safeSenderName ? `New message from ${safeSenderName}` : "New message";
            const safeDescription = safeMessage ? safeMessage.substring(0, 100) + (safeMessage.length > 100 ? "..." : "") : "";
            
            toast({
              title: safeTitle,
              description: safeDescription,
            });

            // Show browser notification if permission granted
            if (Notification.permission === "granted" && safeChatRoomName && safeSenderName) {
              const notificationTitle = `New message in ${safeChatRoomName}`;
              const notificationBody = `${safeSenderName}: ${safeMessage || 'New message'}`;
              const chatId = typeof notification.data.chat_room_id === 'number' ? notification.data.chat_room_id : 0;
              
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
          console.error("Error parsing WebSocket notification:", error);
          console.error("Failed to process WebSocket message");
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
