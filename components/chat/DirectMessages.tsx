"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { MessageSquare, Plus, Search, Clock } from "lucide-react";
import DirectMessageModal from "./DirectMessageModal";
import NewMessageModal from "./NewMessageModal";

interface Conversation {
  email: string;
  name: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

interface DirectMessagesProps {
  tenantSlug: string;
}

export default function DirectMessages({ tenantSlug }: DirectMessagesProps) {
  const { apiClient } = useAuthenticatedApi();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [newMessageModalOpen, setNewMessageModalOpen] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await apiClient.request("/chat/conversations/", {
        headers: { 'X-Tenant-ID': tenantSlug }
      });
      setConversations(response as Conversation[]);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({ title: "Error", description: "Failed to load conversations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [apiClient, tenantSlug]);

  useEffect(() => {
    fetchConversations();
    
    // Listen for notification refresh events to update conversations
    const handleRefreshConversations = () => {
      fetchConversations();
    };
    
    window.addEventListener('refreshNotifications', handleRefreshConversations);
    window.addEventListener('chatMessageSent', handleRefreshConversations);
    
    return () => {
      window.removeEventListener('refreshNotifications', handleRefreshConversations);
      window.removeEventListener('chatMessageSent', handleRefreshConversations);
    };
  }, [fetchConversations]);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "";
    const date = new Date(timeString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const openConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMessageModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button onClick={() => setNewMessageModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {conversations.length === 0 ? "No Conversations" : "No matching conversations"}
            </h3>
            <p className="text-gray-600 mb-4">
              {conversations.length === 0 
                ? "Start a conversation by sending a direct message to any user"
                : "Try adjusting your search terms"
              }
            </p>
            {conversations.length === 0 && (
              <Button onClick={() => setNewMessageModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => (
              <Card 
                key={conversation.email} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openConversation(conversation)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {conversation.name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 truncate">
                            {conversation.name}
                          </h4>
                          {conversation.last_message_time && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(conversation.last_message_time)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.last_message || "No messages yet"}
                          </p>
                          {conversation.unread_count > 0 && (
                            <Badge variant="secondary" className="bg-red-100 text-red-800 ml-2">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {conversation.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedConversation && (
        <DirectMessageModal
          isOpen={messageModalOpen}
          onClose={() => {
            setMessageModalOpen(false);
            setSelectedConversation(null);
            fetchConversations(); // Refresh to update unread counts
          }}
          conversation={selectedConversation}
          tenantSlug={tenantSlug}
        />
      )}

      <NewMessageModal
        isOpen={newMessageModalOpen}
        onClose={() => setNewMessageModalOpen(false)}
        onSuccess={() => {
          setNewMessageModalOpen(false);
          fetchConversations();
        }}
        tenantSlug={tenantSlug}
      />
    </>
  );
}