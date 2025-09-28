"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Calendar, Users, Eye, MessageCircle } from "lucide-react";
import ChatRoomModal from "./ChatRoomModal";

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

interface EventChatRoomsProps {
  rooms: ChatRoom[];
  tenantSlug: string;
  readOnly?: boolean;
}

export default function EventChatRooms({ rooms, tenantSlug, readOnly = false }: EventChatRoomsProps) {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (room: ChatRoom) => {
    if (!room.event) return null;
    
    const now = new Date();
    const startDate = new Date(room.event.start_date);
    const endDate = new Date(room.event.end_date);
    
    if (endDate < now) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Ended</Badge>;
    }
    if (startDate > now) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Upcoming</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800">Ongoing</Badge>;
  };

  const openChatRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setChatModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card key={room.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm font-medium text-gray-900 mb-1">
                    {room.event?.title || room.name}
                  </CardTitle>
                  {getStatusBadge(room)}
                </div>
                <MessageSquare className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {room.event && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {formatDate(room.event.start_date)} - {formatDate(room.event.end_date)}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Created by {room.created_by}</span>
                </div>

                <div className="pt-2">
                  <Button 
                    onClick={() => openChatRoom(room)}
                    className="w-full"
                    variant={readOnly ? "outline" : "default"}
                    disabled={!room.is_active}
                  >
                    {readOnly ? (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        View Chat
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Join Chat
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedRoom && (
        <ChatRoomModal
          isOpen={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false);
            setSelectedRoom(null);
          }}
          room={selectedRoom}
          tenantSlug={tenantSlug}
          readOnly={readOnly}
        />
      )}
    </>
  );
}