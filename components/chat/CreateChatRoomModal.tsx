"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Plus, Loader2 } from "lucide-react";

interface Event {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
}

interface CreateChatRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantSlug: string;
}

export default function CreateChatRoomModal({ isOpen, onClose, onSuccess, tenantSlug }: CreateChatRoomModalProps) {
  const { apiClient } = useAuthenticatedApi();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    chat_type: "event_chatroom",
    event_id: ""
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.request("/events/", {
        headers: { 'X-Tenant-ID': tenantSlug }
      });
      setEvents(response as Event[]);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [apiClient, tenantSlug]);

  const createChatRoom = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Please enter a room name", variant: "destructive" });
      return;
    }

    if (formData.chat_type === "event_chatroom" && !formData.event_id) {
      toast({ title: "Error", description: "Please select an event", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const payload = {
        name: formData.name.trim(),
        chat_type: formData.chat_type,
        ...(formData.event_id && { event_id: parseInt(formData.event_id) })
      };

      await apiClient.request("/chat/rooms/", {
        method: "POST",
        headers: { 
          'X-Tenant-ID': tenantSlug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      toast({ title: "Success", description: "Chat room created successfully" });
      onSuccess();
    } catch (error: unknown) {
      console.error("Error creating chat room:", error);
      const errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to create chat room";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      setFormData({
        name: "",
        chat_type: "event_chatroom",
        event_id: ""
      });
    }
  }, [isOpen, fetchEvents]);

  const handleEventChange = (eventId: string) => {
    setFormData(prev => ({ ...prev, event_id: eventId }));
    
    // Auto-fill room name based on selected event
    if (eventId) {
      const selectedEvent = events.find(e => e.id.toString() === eventId);
      if (selectedEvent) {
        setFormData(prev => ({ 
          ...prev, 
          name: `${selectedEvent.title} - Event Chat`
        }));
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Chat Room</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="chat_type">Chat Room Type</Label>
            <Select 
              value={formData.chat_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, chat_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event_chatroom">Event Chat Room</SelectItem>
                <SelectItem value="direct_message">General Chat Room</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.chat_type === "event_chatroom" && (
            <div>
              <Label htmlFor="event">Select Event</Label>
              {loading ? (
                <div className="flex items-center justify-center h-10 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <Select value={formData.event_id} onValueChange={handleEventChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="name">Room Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter chat room name..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={createChatRoom} 
              disabled={creating || !formData.name.trim()}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {creating ? "Creating..." : "Create Room"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}