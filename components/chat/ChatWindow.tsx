"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
// import { useSimpleWebSocket } from "@/hooks/useSimpleWebSocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { 
  ArrowLeft, 
  Send, 
  Smile, 
  Paperclip, 
  Phone, 
  Video, 
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Reply,
  X
} from "lucide-react";

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
  type: "group";
}

interface Conversation {
  email: string;
  name: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  type: "direct";
}

interface Message {
  id: number;
  sender_email: string;
  sender_name: string;
  message: string;
  status: "sent" | "delivered" | "read";
  is_admin_message?: boolean;
  created_at: string;
  reply_to?: {
    id: number;
    sender_name: string;
    message: string;
  };
}

interface ChatWindowProps {
  chat: ChatRoom | Conversation;
  tenantSlug: string;
  onBack: () => void;
  onUpdate: () => void;
  onChatOpened?: () => void;
}

export default function ChatWindow({ chat, tenantSlug, onBack, onUpdate, onChatOpened }: ChatWindowProps) {
  const { user } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [canSendMessages, setCanSendMessages] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    
    // Validate tenant slug
    if (!tenantSlug || tenantSlug.trim().length === 0) {
      console.error('Invalid tenant slug for fetching messages:', tenantSlug);
      toast({ title: "Error", description: "Invalid tenant configuration. Please refresh the page.", variant: "destructive" });
      return;
    }
    
    try {
      let response;
      if (chat.type === "group") {
        const messagesEndpoint = `/chat/rooms/${chat.id}/messages`;
        const statusEndpoint = `/chat/rooms/${chat.id}/status`;
        

        
        response = await apiClient.request(messagesEndpoint, {
          headers: { 'X-Tenant-ID': tenantSlug.trim() }
        });
        
        const statusResponse = await apiClient.request(statusEndpoint, {
          headers: { 'X-Tenant-ID': tenantSlug.trim() }
        });
        setCanSendMessages((statusResponse as { can_send_messages: boolean }).can_send_messages);
      } else {
        const endpoint = `/chat/direct-messages/?with_user=${chat.email}`;

        
        response = await apiClient.request(endpoint, {
          headers: { 'X-Tenant-ID': tenantSlug.trim() }
        });
        
        const unreadMessages = (response as { is_read: boolean; recipient_email: string; id: number }[]).filter((msg: { is_read: boolean; recipient_email: string }) => 
          !msg.is_read && msg.recipient_email === user?.email
        );
        
        for (const msg of unreadMessages) {
          try {
            await apiClient.request(`/chat/direct-messages/${msg.id}/read`, {
              method: "PUT",
              headers: { 'X-Tenant-ID': tenantSlug.trim() }
            });
          } catch (error) {
            console.error("Error marking message as read:", error);
          }
        }
      }
      

      setMessages((response as Message[]).reverse());
    } catch (error: unknown) {
      console.error('Error fetching messages:', error);
      
      const errorResponse = error as { response?: { status?: number } };
      if (errorResponse.response?.status === 401) {
        return;
      } else if (errorResponse.response?.status === 403) {
        toast({ title: "Access Denied", description: "You don't have permission to access this chat", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [chat, tenantSlug, apiClient, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;



    setSending(true);
    try {
      if (chat.type === "group") {
        // Validate tenant slug before sending group message
        if (!tenantSlug || tenantSlug.trim().length === 0) {
          console.error('Invalid tenant slug for group message:', tenantSlug);
          throw new Error('Invalid tenant configuration. Please refresh the page.');
        }
        
        const endpoint = "/chat/messages/";
        const payload = {
          chat_room_id: chat.id,
          message: newMessage.trim(),
          reply_to_message_id: replyingTo?.id || null,
          tenant_id: tenantSlug.trim()
        };
        

        
        await apiClient.request(endpoint, {
          method: "POST",
          headers: { 
            'X-Tenant-ID': tenantSlug.trim(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Validate tenant slug before sending direct message
        if (!tenantSlug || tenantSlug.trim().length === 0) {
          console.error('Invalid tenant slug for direct message:', tenantSlug);
          throw new Error('Invalid tenant configuration. Please refresh the page.');
        }
        
        const endpoint = "/chat/direct-messages/";
        const payload = {
          recipient_email: chat.email,
          message: newMessage.trim(),
          tenant_id: tenantSlug.trim(),
          tenant_slug: tenantSlug.trim(),
          'X-Tenant-ID': tenantSlug.trim()
        };
        
        const requestBody = JSON.stringify(payload);
        
        await apiClient.request(endpoint, {
          method: "POST",
          headers: { 
            'X-Tenant-ID': tenantSlug.trim(),
            'Content-Type': 'application/json'
          },
          body: requestBody
        });
      }
      

      
      // Add message to local state immediately for instant feedback
      const tempMessage: Message = {
        id: Date.now(), // Temporary ID
        sender_email: user?.email || "",
        sender_name: user?.name || user?.email || "",
        message: newMessage.trim(),
        status: "sent",
        is_admin_message: false,
        created_at: new Date().toISOString(),
        reply_to: replyingTo ? {
          id: replyingTo.id,
          sender_name: replyingTo.sender_name,
          message: replyingTo.message
        } : undefined
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage("");
      setReplyingTo(null);
      scrollToBottom();
      
      // Update UI and refresh after delay
      onUpdate();
      
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
      window.dispatchEvent(new CustomEvent('chatMessageSent'));
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      }, 500);
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      }, 1500);
      
      setTimeout(() => {
        fetchMessages();
      }, 2000);
    } catch (error: unknown) {
      console.error("Error sending message:", error);
      
      const errorResponse = error as { response?: { status?: number; data?: { detail?: string } } };
      if (errorResponse.response?.status === 401) {
        return;
      }
      
      let errorMessage = errorResponse.response?.data?.detail || "Failed to send message";
      
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

  const getStatusIcon = (message: Message) => {
    if (message.sender_email !== user?.email) return null;
    
    switch (message.status) {
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timeString: string) => {
    const date = new Date(timeString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  useEffect(() => {
    fetchMessages();
    onChatOpened?.();
    
    const interval = setInterval(() => {
      fetchMessages();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [chat, onChatOpened, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getEventStatus = () => {
    if (chat.type !== "group" || !chat.event) return null;
    
    const now = new Date();
    const startDate = new Date(chat.event.start_date);
    const endDate = new Date(chat.event.end_date);
    
    if (endDate < now) return "ended";
    if (startDate > now) return "upcoming";
    return "ongoing";
  };

  const eventStatus = getEventStatus();

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarFallback className={`${
              chat.type === "group" 
                ? "bg-blue-500 text-white" 
                : "bg-green-500 text-white"
            }`}>
              {chat.type === "group" 
                ? (chat.event?.title || chat.name).charAt(0).toUpperCase()
                : chat.name.charAt(0).toUpperCase()
              }
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="font-semibold text-gray-900">
              {chat.type === "group" 
                ? (chat.event?.title || chat.name)
                : chat.name
              }
            </h2>
            <div className="flex items-center gap-2">
              {chat.type === "group" && eventStatus && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    eventStatus === "ongoing" ? "bg-green-100 text-green-800" :
                    eventStatus === "upcoming" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}
                >
                  {eventStatus}
                </Badge>
              )}
              {chat.type === "direct" && (
                <span className="text-xs text-gray-500">{chat.email}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {chat.type === "direct" && (
            <>
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : Object.keys(groupedMessages).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="mb-6">
              {/* Date separator */}
              <div className="flex justify-center mb-4">
                <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                  {formatDate(dateMessages[0].created_at)}
                </span>
              </div>
              
              {/* Messages for this date */}
              <div className="space-y-2">
                {dateMessages.map((message) => {
                  const isCurrentUser = message.sender_email === user?.email;
                  return (
                    <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}>
                      <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-2' : 'order-1'} relative`}>
                        <div className={`rounded-lg p-3 shadow-sm ${
                          isCurrentUser 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white text-gray-800'
                        }`}>
                          {/* Sender name inside message for group chats */}
                          {!isCurrentUser && chat.type === "group" && (
                            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-200">
                              <span className="text-xs font-medium text-gray-600">
                                {message.sender_name}
                              </span>
                              {message.is_admin_message && (
                                <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Reply context */}
                          {message.reply_to && (
                            <div className={`mb-2 p-2 rounded border-l-2 ${
                              isCurrentUser 
                                ? 'bg-green-600 border-green-300 text-green-100' 
                                : 'bg-gray-100 border-gray-300 text-gray-600'
                            }`}>
                              <div className="text-xs font-medium mb-1">
                                {message.reply_to.sender_name}
                              </div>
                              <div className="text-xs truncate">
                                {message.reply_to.message}
                              </div>
                            </div>
                          )}
                          

                          
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                          
                          <div className={`flex items-center justify-between mt-1 ${
                            isCurrentUser ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">
                              {formatTime(message.created_at)}
                            </span>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(message)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Reply button */}
                        {chat.type === "group" && canSendMessages && (
                          <button
                            onClick={() => setReplyingTo(message)}
                            className="absolute -right-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                          >
                            <Reply className="h-3 w-3 text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message restrictions notice */}
      {!canSendMessages && (
        <div className="p-3 bg-yellow-50 border-t border-yellow-200 text-center">
          <span className="text-sm text-yellow-800">
            This event has ended. No new messages can be sent.
          </span>
        </div>
      )}

      {/* Message Input */}
      {canSendMessages && (
        <div className="border-t border-gray-200 bg-white">
          {/* Reply preview */}
          {replyingTo && (
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs text-gray-600 mb-1">
                    Replying to {replyingTo.sender_name}
                  </div>
                  <div className="text-sm text-gray-800 truncate">
                    {replyingTo.message}
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          <div className="p-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Smile className="h-5 w-5 text-gray-500" />
              </Button>
              <Button variant="ghost" size="sm">
                <Paperclip className="h-5 w-5 text-gray-500" />
              </Button>
              
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={replyingTo ? "Reply to message..." : "Type a message..."}
                disabled={sending}
                className="flex-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              
              <Button 
                onClick={sendMessage} 
                disabled={!newMessage.trim() || sending}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}