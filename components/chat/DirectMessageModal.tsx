"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Send, Clock } from "lucide-react";

interface Conversation {
  email: string;
  name: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

interface DirectMessage {
  id: number;
  sender_email: string;
  sender_name: string;
  recipient_email: string;
  recipient_name: string;
  message: string;
  is_read: boolean;
  tenant_id: string;
  created_at: string;
}

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  tenantSlug: string;
}

export default function DirectMessageModal({ isOpen, onClose, conversation, tenantSlug }: DirectMessageModalProps) {
  const { user } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const response = await apiClient.request(`/chat/direct-messages/?with_user=${conversation.email}`, {
        headers: { 'X-Tenant-ID': tenantSlug }
      });
      setMessages((response as DirectMessage[]).reverse()); // Reverse to show oldest first
      
      // Mark unread messages as read
      const unreadMessages = (response as DirectMessage[]).filter((msg: DirectMessage) => 
        !msg.is_read && msg.recipient_email === user?.email
      );
      
      for (const msg of unreadMessages) {
        try {
          await apiClient.request(`/chat/direct-messages/${msg.id}/read`, {
            method: "PUT",
            headers: { 'X-Tenant-ID': tenantSlug }
          });
        } catch (error) {
          console.error("Error marking message as read:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
    }
  }, [conversation.email, apiClient, tenantSlug, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const payload = {
      recipient_email: conversation.email,
      message: newMessage.trim(),
      tenant_id: tenantSlug.trim(),
      tenant_slug: tenantSlug.trim(),
      'X-Tenant-ID': tenantSlug.trim()
    };
    


    setSending(true);
    try {
      await apiClient.request("/chat/direct-messages/", {
        method: "POST",
        headers: { 
          'X-Tenant-ID': tenantSlug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      

      
      // Trigger notification refresh events
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
      window.dispatchEvent(new CustomEvent('chatMessageSent'));
      
      setNewMessage("");
      await fetchMessages();
      scrollToBottom();
      

    } catch (error: unknown) {
      console.error("Error sending message:", error);
      
      let errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to send message";
      
      if (errorMessage.includes('tenant_id') && errorMessage.includes('null value')) {
        errorMessage = "Unable to send message due to a backend configuration issue. Please contact your system administrator.";
        console.error('Backend tenant_id extraction issue detected');
      }
      
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
        await fetchMessages();
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      };
      loadData();
    }
  }, [isOpen, conversation.email, fetchMessages]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {conversation.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold">{conversation.name}</div>
              <div className="text-sm text-gray-600 font-normal">{conversation.email}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

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
              messages.map((message) => {
                const isCurrentUser = message.sender_email === user?.email;
                return (
                  <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-center space-x-2 mb-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <span className="font-medium text-sm text-gray-900">
                          {isCurrentUser ? 'You' : message.sender_name}
                        </span>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                      
                      <div className={`rounded-lg p-3 shadow-sm border ${
                        isCurrentUser 
                          ? 'bg-red-600 text-white' 
                          : 'bg-white text-gray-800'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">
                          {message.message}
                        </p>
                      </div>
                    </div>
                    
                    {!isCurrentUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold order-1 mr-3 mt-6">
                        {message.sender_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {isCurrentUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-semibold order-1 ml-3 mt-6">
                        {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

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
        </div>
      </DialogContent>
    </Dialog>
  );
}