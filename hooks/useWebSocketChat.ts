"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";

interface WebSocketMessage {
  type: "message" | "user_joined" | "user_left";
  id?: number;
  sender_email?: string;
  sender_name?: string;
  message?: string;
  is_admin_message?: boolean;
  timestamp?: string;
  user?: {
    email: string;
    name: string;
    is_admin: boolean;
  };
}

interface UseWebSocketChatProps {
  roomId: number | null;
  enabled?: boolean;
  onNewMessage?: (message: WebSocketMessage) => void;
}

export function useWebSocketChat({
  roomId,
  enabled = true,
  onNewMessage,
}: UseWebSocketChatProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (
      !enabled ||
      !user ||
      !roomId ||
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      return;
    }

    // Get token from user object or auth storage
    const token = user.accessToken || localStorage.getItem("token");

    if (!token) {
      console.error(
        "DEBUG WebSocket: No token available for WebSocket connection"
      );
      return;
    }

    try {
      const wsUrl = `${
        process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"
      }/api/v1/chat/ws/${roomId}?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        ws.send(JSON.stringify({ type: "ping" }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (message.type === "message") {
            onNewMessage?.(message);
          } else if (message.type === "user_joined") {
            if (message.user) {
              setOnlineUsers((prev) => [
                ...prev.filter((u) => u !== message.user!.email),
                message.user!.email,
              ]);
            }
          } else if (message.type === "user_left") {
            if (message.user) {
              setOnlineUsers((prev) =>
                prev.filter((u) => u !== message.user!.email)
              );
            }
          } else {
          }
        } catch (error) {
          console.error("DEBUG WebSocket: Error parsing message:", error);
          console.error("DEBUG WebSocket: Raw message data:", event.data);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setOnlineUsers([]);
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
        } else {
        }
      };

      ws.onerror = (error) => {
        console.error(`DEBUG WebSocket: Error for room ${roomId}:`, error);
        console.error("DEBUG WebSocket: Error details:", {
          readyState: ws.readyState,
          url: ws.url,
          protocol: ws.protocol,
          error: error,
        });
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setIsConnected(false);
    }
  }, [enabled, user, roomId, onNewMessage]);

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
    setOnlineUsers([]);
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageData = {
        type: "message",
        message: message,
      };
      wsRef.current.send(JSON.stringify(messageData));
    } else {
      console.error(
        "DEBUG WebSocket: Cannot send message - connection not open"
      );
      console.error(
        "DEBUG WebSocket: Current state:",
        wsRef.current?.readyState
      );
    }
  }, []);

  useEffect(() => {
    if (enabled && user && roomId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, user, roomId, connect, disconnect]);

  return {
    isConnected,
    onlineUsers,
    sendMessage,
  };
}
