"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedApi } from "@/lib/auth";

interface Conversation {
  unread_count?: number;
}

interface UseChatUnreadCountProps {
  tenantSlug: string;
  enabled?: boolean;
}

export function useChatUnreadCount({ tenantSlug, enabled = true }: UseChatUnreadCountProps) {
  const { apiClient } = useAuthenticatedApi();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      
      // Get unread count from conversations
      const conversations = await apiClient.request("/chat/conversations/", {
        headers: { 'X-Tenant-ID': tenantSlug }
      });

      const totalUnread = (conversations as Conversation[]).reduce((sum: number, conv: Conversation) => sum + (conv.unread_count || 0), 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error("Error fetching chat unread count:", error);
    } finally {
      setLoading(false);
    }
  }, [apiClient, tenantSlug, enabled]);

  useEffect(() => {
    if (!enabled) return;

    fetchUnreadCount();
    
    // Initial fetch only - reduce polling to minimize console noise
    const interval = setInterval(fetchUnreadCount, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount, enabled]);

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount
  };
}