"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Save, X } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface Room {
  id: number;
  guesthouse_id: number;
  room_number: string;
  capacity: number;
  room_type: string;
  description?: string;
  amenities?: string;
  is_active: boolean;
  is_occupied: boolean;
  current_occupants: number;
}

interface GuestHouse {
  id: number;
  name: string;
}

interface RoomForm {
  room_number: string;
  capacity: number;
  room_type: string;
  description: string;
  amenities: string;
}

interface RoomsViewProps {
  selectedGuesthouse: GuestHouse | null;
  rooms: Room[];
  canEdit: boolean;
  onRoomCreated: () => void;
  apiClient: { getToken: () => string };
  tenantSlug: string;
}

export default function RoomsView({ 
  selectedGuesthouse, 
  rooms, 
  canEdit, 
  onRoomCreated, 
  apiClient, 
  tenantSlug 
}: RoomsViewProps) {
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roomForm, setRoomForm] = useState<RoomForm>({
    room_number: "",
    capacity: 2,
    room_type: "apartment",
    description: "",
    amenities: "",
  });

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuesthouse) return;
    
    if (rooms.length >= 4) {
      toast({ title: "Error", description: "Maximum 4 rooms allowed per guesthouse", variant: "destructive" });
      return;
    }
    
    if (!roomForm.room_number) {
      toast({ title: "Error", description: "Please select a room number", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    try {
      const roomData = {
        room_number: roomForm.room_number,
        capacity: roomForm.capacity,
        room_type: roomForm.room_type,
        description: roomForm.description || null,
        amenities: roomForm.amenities || null,
        guesthouse_id: selectedGuesthouse.id,
        is_active: true,
        is_occupied: false,
        current_occupants: 0
      };
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/rooms`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
            'X-Tenant-ID': tenantSlug
          },
          body: JSON.stringify(roomData),
        }
      );

      if (response.ok) {
        onRoomCreated();
        setRoomDialogOpen(false);
        setRoomForm({ room_number: "", capacity: 2, room_type: "apartment", description: "", amenities: "" });
        toast({ title: "Success", description: "Room created successfully" });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail || "Failed to create room", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedGuesthouse) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Rooms - {selectedGuesthouse.name}</CardTitle>
        {canEdit && (
          <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border border-gray-200 shadow-lg max-w-sm max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-gray-900">Add New Room</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRoomSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room_number" className="text-sm font-medium text-gray-700">Room Number</Label>
                  <Select value={roomForm.room_number} onValueChange={(value) => setRoomForm({ ...roomForm, room_number: value })}>
                    <SelectTrigger className="bg-white border border-gray-300">
                      <SelectValue placeholder="Select room number" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300">
                      {[1, 2, 3, 4].filter(num => !rooms.some(room => room.room_number === num.toString())).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          Room {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-sm font-medium text-gray-700">Capacity (Max 2 people)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="2"
                    value={roomForm.capacity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setRoomForm({ ...roomForm, capacity: Math.min(value, 2) });
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                  <Input
                    id="description"
                    value={roomForm.description}
                    onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amenities" className="text-sm font-medium text-gray-700">Amenities</Label>
                  <Textarea
                    id="amenities"
                    value={roomForm.amenities}
                    onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setRoomDialogOpen(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {submitting ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rooms.map((room) => (
            <div key={room.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm">Room {room.room_number}</h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  room.current_occupants >= room.capacity 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {room.current_occupants}/{room.capacity}
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Type: {room.room_type}</div>
                <div>Capacity: {room.capacity} beds</div>
                {room.description && <div>Description: {room.description}</div>}
                <div className={`font-medium ${
                  room.is_occupied ? 'text-red-600' : 'text-green-600'
                }`}>
                  {room.is_occupied ? 'Occupied' : 'Available'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}