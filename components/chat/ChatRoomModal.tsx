"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Send, Clock, AlertCircle } from "lucide-react";

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

interface ChatMessage {
  id: number;
  chat_room_id: number;
  sender_email: string;
  sender_name: string;
  message: string;
  is_admin_message: boolean;
  created_at: string;
}

interface RoomStatus {
  room_id: number;
  can_send_messages: boolean;
  event_status: string;
  room_name: string;
}

interface ChatRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: ChatRoom;
  tenantSlug: string;
  readOnly?: boolean;
}

export default function ChatRoomModal({ isOpen, onClose, room, tenantSlug, readOnly = false }: ChatRoomModalProps) {
  const { } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const response = await apiClient.request(`/chat/rooms/${room.id}/messages`, {
        headers: { 'X-Tenant-ID': tenantSlug }
      });
      setMessages((response as ChatMessage[]).reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
    }
  }, [apiClient, room.id, tenantSlug]);

  const fetchRoomStatus = useCallback(async () => {
    try {
      const response = await apiClient.request(`/chat/rooms/${room.id}/status`, {
        headers: { 'X-Tenant-ID': tenantSlug }
      });
      setRoomStatus(response as RoomStatus);
    } catch (error) {
      console.error("Error fetching room status:", error);
    }
  }, [apiClient, room.id, tenantSlug]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await apiClient.request("/chat/messages/", {
        method: "POST",
        headers: { 
          'X-Tenant-ID': tenantSlug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_room_id: room.id,
          message: newMessage.trim()
        })
      });
      
      setNewMessage("");
      await fetchMessages();
      scrollToBottom();
    } catch (error: unknown) {
      console.error("Error sending message:", error);
      const errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to send message";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchMessages(), fetchRoomStatus()]);
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      };
      loadData();
    }
  }, [isOpen, room.id, fetchMessages, fetchRoomStatus]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const canSendMessages = !readOnly && roomStatus?.can_send_messages !== false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {room.event?.title || room.name}
              {roomStatus && (
                <Badge 
                  variant="secondary" 
                  className={
                    roomStatus.event_status === "ongoing" ? "bg-green-100 text-green-800" :
                    roomStatus.event_status === "upcoming" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }
                >
                  {roomStatus.event_status}
                </Badge>
              )}
            </DialogTitle>
          </div>
          {room.event && (
            <p className="text-sm text-gray-600">
              {new Date(room.event.start_date).toLocaleDateString()} - {new Date(room.event.end_date).toLocaleDateString()}
            </p>
          )}
        </DialogHeader>

        {!canSendMessages && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              {readOnly ? "This chat is in read-only mode" : "This event has ended. No new messages can be sent."}
            </span>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                    {message.sender_name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {message.sender_name}
                      </span>
                      {message.is_admin_message && (
                        <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                          Admin
                        </Badge>
                      )}
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {message.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {canSendMessages && (
            <div className="mt-4 flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={sending}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!newMessage.trim() || sending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}