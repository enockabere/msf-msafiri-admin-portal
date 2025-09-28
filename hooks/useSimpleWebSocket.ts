"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";

interface UseSimpleWebSocketProps {
  roomId: number | null;
  onMessage: (message: unknown) => void;
}

export function useSimpleWebSocket({
  roomId,
  onMessage,
}: UseSimpleWebSocketProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomId || !user?.accessToken) return;

    const wsUrl = `ws://localhost:8000/api/v1/chat/ws/${roomId}?token=${user.accessToken}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomId, user?.accessToken, onMessage]);

  const sendMessage = (message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", message }));
    }
  };

  return { isConnected, sendMessage };
}
