"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { useChatNotifications } from "@/hooks/useChatNotifications";
// import { useWebSocketNotifications } from "@/hooks/useWebSocketNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  MessageSquare,
  Search,
  Plus,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Bug,
} from "lucide-react";
import ChatNotifications from "./ChatNotifications";
import ChatWindow from "./ChatWindow";
import NotificationDebug from "./NotificationDebug";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



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
  unread_count?: number;
  last_message?: string;
  last_message_time?: string;
  type: "group";
}

interface User {
  email: string;
  name: string;
}

interface ApiConversation {
  email: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

interface Conversation {
  email: string;
  name: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  type: "direct";
}

interface WhatsAppChatInterfaceProps {
  tenantSlug: string;
  chatRooms: ChatRoom[];
  onRoomUpdate: () => void;
  isAdmin: boolean;
  onAutoCreateRooms: () => void;
  onCleanupChats: () => void;
  onCreateRoom: () => void;
}

export default function WhatsAppChatInterface({
  tenantSlug,
  chatRooms,
  onRoomUpdate,
  isAdmin,
  onAutoCreateRooms,
  onCleanupChats,
  onCreateRoom,
}: WhatsAppChatInterfaceProps) {
  const { apiClient } = useAuthenticatedApi();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChat, setSelectedChat] = useState<
    ChatRoom | Conversation | null
  >(null);
  const [activeTab, setActiveTab] = useState<"groups" | "contacts">("groups");
  const [showDebug, setShowDebug] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const usersResponse = await apiClient.request("/chat/users/", {
        headers: { "X-Tenant-ID": tenantSlug },
      });

      const conversationsResponse = await apiClient.request(
        "/chat/conversations/",
        {
          headers: { "X-Tenant-ID": tenantSlug },
        }
      );

      const allContacts = (usersResponse as User[]).map((user: User) => {
        const existingConv = (conversationsResponse as ApiConversation[]).find(
          (conv: ApiConversation) => conv.email === user.email
        );
        return {
          email: user.email,
          name: user.name,
          last_message: existingConv?.last_message || null,
          last_message_time: existingConv?.last_message_time || null,
          unread_count: existingConv?.unread_count || 0,
          type: "direct" as const,
        };
      });

      setConversations(allContacts);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  }, [apiClient, tenantSlug]);

  // Real-time notifications
  const { unreadCount } = useChatNotifications({
    tenantSlug,
    enabled: true,
  });

  // Calculate separate unread counts for groups and direct messages
  const groupUnreadCount = chatRooms.reduce((sum, room) => sum + (room.unread_count || 0), 0);
  const directUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

  // WebSocket notifications (temporarily disabled)
  const markChatAsRead = () => {};

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      fetchConversations();
    }

    // Listen for notification refresh events to update conversations
    const handleRefreshConversations = () => {
      if (mounted) {
        fetchConversations();
      }
    };

    window.addEventListener("refreshNotifications", handleRefreshConversations);
    window.addEventListener("chatMessageSent", handleRefreshConversations);

    return () => {
      mounted = false;
      window.removeEventListener(
        "refreshNotifications",
        handleRefreshConversations
      );
      window.removeEventListener("chatMessageSent", handleRefreshConversations);
    };
  }, [fetchConversations]);

  // Refresh conversations when unread count changes
  useEffect(() => {
    fetchConversations();
  }, [unreadCount, fetchConversations]);

  const getEventStatus = (room: ChatRoom) => {
    if (!room.event) return "active";
    const now = new Date();
    const startDate = new Date(room.event.start_date);
    const endDate = new Date(room.event.end_date);

    if (endDate < now) return "ended";
    if (startDate > now) return "upcoming";
    return "ongoing";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ongoing":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "upcoming":
        return <Clock className="h-3 w-3 text-blue-500" />;
      case "ended":
        return <XCircle className="h-3 w-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return "";
    const date = new Date(timeString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const allChats = [
    ...chatRooms.map((room) => ({ ...room, type: "group" as const })),
    ...conversations,
  ];

  const filteredChats = allChats.filter((chat) => {
    const searchLower = searchTerm.toLowerCase();
    if (chat.type === "group") {
      return (
        (chat.event?.title || chat.name).toLowerCase().includes(searchLower) ||
        chat.created_by.toLowerCase().includes(searchLower)
      );
    } else {
      return (
        chat.name.toLowerCase().includes(searchLower) ||
        chat.email.toLowerCase().includes(searchLower)
      );
    }
  });

  const groupChats = filteredChats.filter(
    (chat) => chat.type === "group"
  ) as ChatRoom[];
  const directChats = filteredChats.filter(
    (chat) => chat.type === "direct"
  ) as Conversation[];

  // Sort groups by status and time
  const sortedGroups = groupChats.sort((a, b) => {
    const statusA = getEventStatus(a);
    const statusB = getEventStatus(b);

    const statusOrder = { ongoing: 1, upcoming: 2, ended: 3 };
    const orderA = statusOrder[statusA as keyof typeof statusOrder] || 4;
    const orderB = statusOrder[statusB as keyof typeof statusOrder] || 4;

    if (orderA !== orderB) return orderA - orderB;

    const timeA = new Date(a.last_message_time || a.created_at).getTime();
    const timeB = new Date(b.last_message_time || b.created_at).getTime();
    return timeB - timeA;
  });

  // Sort direct chats by last message time
  const sortedDirectChats = directChats.sort((a, b) => {
    const timeA = new Date(a.last_message_time || 0).getTime();
    const timeB = new Date(b.last_message_time || 0).getTime();
    return timeB - timeA;
  });

  const displayChats =
    activeTab === "groups" ? sortedGroups : sortedDirectChats;

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
              <div
                className="w-2 h-2 bg-green-500 rounded-full"
                title="Connected"
              />
            </div>
            <div className="flex items-center gap-2">
              <ChatNotifications tenantSlug={tenantSlug} />
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onCreateRoom}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Room
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onAutoCreateRooms}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Auto-Create Event Rooms
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onCleanupChats}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cleanup Ended Chats
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDebug(!showDebug)}>
                      <Bug className="h-4 w-4 mr-2" />
                      {showDebug ? 'Hide' : 'Show'} Debug Panel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === "groups"
                ? "text-green-600 border-b-2 border-green-600 bg-green-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              Groups
              <Badge variant="secondary" className="bg-gray-100">
                {groupChats.length}
              </Badge>
              {groupUnreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs animate-pulse">
                  {groupUnreadCount > 99 ? "99+" : groupUnreadCount}
                </Badge>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === "contacts"
                ? "text-green-600 border-b-2 border-green-600 bg-green-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Contacts
              <Badge variant="secondary" className="bg-gray-100">
                {directChats.length}
              </Badge>
              {directUnreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs animate-pulse">
                  {directUnreadCount > 99 ? "99+" : directUnreadCount}
                </Badge>
              )}
            </div>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {displayChats.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">
                {activeTab === "groups"
                  ? "No group chats found"
                  : "No conversations found"}
              </p>
            </div>
          ) : (
            displayChats.map((chat) => (
              <div
                key={
                  chat.type === "group"
                    ? `group-${(chat as ChatRoom).id}`
                    : `direct-${(chat as Conversation).email}`
                }
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedChat === chat
                    ? "bg-green-50 border-l-4 border-l-green-500"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback
                      className={`${
                        chat.type === "group"
                          ? "bg-blue-500 text-white"
                          : "bg-green-500 text-white"
                      }`}
                    >
                      {chat.type === "group"
                        ? (
                            (chat as ChatRoom).event?.title ||
                            (chat as ChatRoom).name
                          )
                            .charAt(0)
                            .toUpperCase()
                        : (chat as Conversation).name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {chat.type === "group"
                          ? (chat as ChatRoom).event?.title ||
                            (chat as ChatRoom).name
                          : (chat as Conversation).name}
                      </h3>
                      <div className="flex items-center gap-1">
                        {chat.type === "group" &&
                          getStatusIcon(getEventStatus(chat as ChatRoom))}
                        <span className="text-xs text-gray-500">
                          {formatTime(
                            chat.last_message_time ||
                              (chat.type === "group"
                                ? (chat as ChatRoom).created_at
                                : undefined)
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {chat.last_message ||
                          (chat.type === "group"
                            ? "Event chat room"
                            : "No messages yet")}
                      </p>
                      {((chat.unread_count && chat.unread_count > 0) ||
                        (chat.type === "direct" && chat.unread_count > 0)) && (
                        <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center animate-pulse">
                          {(chat.unread_count || 0) > 99 ? "99+" : (chat.unread_count || 0)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {showDebug ? (
          <div className="p-4 bg-gray-50 h-full overflow-auto">
            <NotificationDebug tenantSlug={tenantSlug} />
          </div>
        ) : selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            tenantSlug={tenantSlug}
            onBack={() => {
              setSelectedChat(null);
              markChatAsRead(); // Mark chat as read when closing
            }}
            onChatOpened={() => {
              markChatAsRead(); // Mark chat as read when opening
            }}
            onUpdate={onRoomUpdate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Welcome to MSF Chat
              </h3>
              <p className="text-gray-600">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
