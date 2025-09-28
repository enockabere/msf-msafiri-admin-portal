"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { toast } from "@/components/ui/toast";
import WhatsAppChatInterface from "@/components/chat/WhatsAppChatInterface";
import CreateChatRoomModal from "@/components/chat/CreateChatRoomModal";

interface ChatRoom {
  id: number;
  name: string;
  chat_type: string;
  event_id?: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  event?: {
    title: string;
    start_date: string;
    end_date: string;
  };
}

export default function ChatManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const params = useParams();
  const tenantSlug = params.slug as string;

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);


  const fetchChatRooms = useCallback(async () => {
    try {
      const response = await apiClient.request("/chat/rooms/", {
        headers: { 'X-Tenant-ID': tenantSlug }
      });
      setChatRooms(response as ChatRoom[]);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      toast({ title: "Error", description: "Failed to load chat rooms", variant: "destructive" });
    }
  }, [apiClient, tenantSlug]);

  const autoCreateEventRooms = useCallback(async () => {
    try {
      const response = await apiClient.request("/chat/rooms/auto-create", {
        method: "POST",
        headers: { 'X-Tenant-ID': tenantSlug }
      });
      toast({ title: "Success", description: (response as { message: string }).message });
      await fetchChatRooms();
    } catch (error) {
      console.error("Error auto-creating rooms:", error);
      toast({ title: "Error", description: "Failed to create event chat rooms", variant: "destructive" });
    }
  }, [apiClient, tenantSlug, fetchChatRooms]);

  const cleanupEndedChats = useCallback(async () => {
    try {
      const response = await apiClient.request("/chat/cleanup-ended-events", {
        method: "DELETE",
        headers: { 'X-Tenant-ID': tenantSlug }
      });
      toast({ title: "Success", description: (response as { message: string }).message });
      await fetchChatRooms();
    } catch (error) {
      console.error("Error cleaning up chats:", error);
      toast({ title: "Error", description: "Failed to cleanup ended chats", variant: "destructive" });
    }
  }, [apiClient, tenantSlug, fetchChatRooms]);

  useEffect(() => {
    if (authLoading || !user) return;
    
    const loadData = async () => {
      setLoading(true);
      await fetchChatRooms();
      setLoading(false);
    };

    loadData();
  }, [authLoading, user, fetchChatRooms]);

  const isAdmin = Boolean(user?.role && ["MT_ADMIN", "HR_ADMIN", "EVENT_ADMIN", "SUPER_ADMIN"].includes(user.role));




  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] bg-gray-100">
        <WhatsAppChatInterface 
          tenantSlug={tenantSlug}
          chatRooms={chatRooms}
          onRoomUpdate={fetchChatRooms}
          isAdmin={isAdmin}
          onAutoCreateRooms={autoCreateEventRooms}
          onCleanupChats={cleanupEndedChats}
          onCreateRoom={() => setCreateModalOpen(true)}
        />
        
        {createModalOpen && (
          <CreateChatRoomModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSuccess={() => {
              setCreateModalOpen(false);
              fetchChatRooms();
            }}
            tenantSlug={tenantSlug}
          />
        )}
      </div>
    </DashboardLayout>
  );
}