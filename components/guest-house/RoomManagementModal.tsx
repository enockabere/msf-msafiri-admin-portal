"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Plus, Edit, Trash2, Bed, Users, Settings } from "lucide-react";

interface GuestHouseRoom {
  id: number;
  room_number: string;
  room_name?: string;
  capacity: number;
  room_type?: string;
  facilities?: Record<string, any>;
  description?: string;
  is_active: boolean;
}

interface GuestHouse {
  id: number;
  name: string;
  rooms: GuestHouseRoom[];
}

interface RoomManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestHouse: GuestHouse | null;
  onSuccess: () => void;
  apiClient: { getToken: () => string };
  tenantSlug: string;
}

const roomTypes = [
  "Single",
  "Double", 
  "Twin",
  "Shared",
  "Suite",
  "Studio"
];

const roomFacilities = [
  { key: "private_bathroom", label: "Private Bathroom" },
  { key: "shared_bathroom", label: "Shared Bathroom" },
  { key: "air_conditioning", label: "Air Conditioning" },
  { key: "fan", label: "Fan" },
  { key: "tv", label: "TV" },
  { key: "desk", label: "Desk/Work Area" },
  { key: "wardrobe", label: "Wardrobe" },
  { key: "balcony", label: "Balcony" },
  { key: "mini_fridge", label: "Mini Fridge" },
  { key: "safe", label: "Safe" }
];

export default function RoomManagementModal({
  open,
  onOpenChange,
  guestHouse,
  onSuccess,
  apiClient,
  tenantSlug
}: RoomManagementModalProps) {
  const [rooms, setRooms] = useState<GuestHouseRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<GuestHouseRoom | null>(null);
  const [formData, setFormData] = useState({
    room_number: "",
    room_name: "",
    capacity: 1,
    room_type: "",
    description: "",
    facilities: {} as Record<string, boolean>
  });

  useEffect(() => {
    if (guestHouse && open) {
      fetchRooms();
    }
  }, [guestHouse, open]);

  const fetchRooms = async () => {
    if (!guestHouse) return;

    try {
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/guest-houses/${guestHouse.id}/rooms`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast({ title: "Error", description: "Failed to load rooms", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      room_number: "",
      room_name: "",
      capacity: 1,
      room_type: "",
      description: "",
      facilities: {}
    });
    setEditingRoom(null);
    setShowAddForm(false);
  };

  const handleEditRoom = (room: GuestHouseRoom) => {
    setFormData({
      room_number: room.room_number,
      room_name: room.room_name || "",
      capacity: room.capacity,
      room_type: room.room_type || "",
      description: room.description || "",
      facilities: room.facilities || {}
    });
    setEditingRoom(room);
    setShowAddForm(true);
  };

  const handleSubmitRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestHouse) return;

    setLoading(true);
    try {
      const token = apiClient.getToken();
      
      const url = editingRoom
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/guest-houses/rooms/${editingRoom.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/guest-houses/${guestHouse.id}/rooms`;

      const method = editingRoom ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Room ${editingRoom ? "updated" : "added"} successfully`,
        });
        fetchRooms();
        onSuccess();
        resetForm();
      } else {
        throw new Error(`Failed to ${editingRoom ? "update" : "add"} room`);
      }
    } catch (error) {
      console.error("Error saving room:", error);
      toast({
        title: "Error",
        description: `Failed to ${editingRoom ? "update" : "add"} room`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/guest-houses/rooms/${roomId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_active: false }),
        }
      );

      if (response.ok) {
        toast({ title: "Success", description: "Room deleted successfully" });
        fetchRooms();
        onSuccess();
      } else {
        throw new Error("Failed to delete room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      toast({ title: "Error", description: "Failed to delete room", variant: "destructive" });
    }
  };

  const handleFacilityChange = (facilityKey: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      facilities: {
        ...prev.facilities,
        [facilityKey]: checked
      }
    }));
  };

  const getTotalCapacity = () => {
    return rooms.filter(r => r.is_active).reduce((total, room) => total + room.capacity, 0);
  };

  if (!guestHouse) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bed className="w-5 h-5" />
            Room Management - {guestHouse.name}
          </DialogTitle>
          <DialogDescription>
            Manage rooms and their configurations for this guest house
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-900">{rooms.filter(r => r.is_active).length}</div>
              <div className="text-sm text-blue-600">Active Rooms</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-900">{getTotalCapacity()}</div>
              <div className="text-sm text-green-600">Total Capacity</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-900">
                {rooms.length > 0 ? (getTotalCapacity() / rooms.filter(r => r.is_active).length).toFixed(1) : 0}
              </div>
              <div className="text-sm text-purple-600">Avg. per Room</div>
            </div>
          </div>

          {/* Add Room Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Rooms</h3>
            <Button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          </div>

          {/* Add/Edit Room Form */}
          {showAddForm && (
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base">
                  {editingRoom ? "Edit Room" : "Add New Room"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitRoom} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="room_number">Room Number *</Label>
                      <Input
                        id="room_number"
                        value={formData.room_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                        placeholder="e.g., 101, A1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="room_name">Room Name</Label>
                      <Input
                        id="room_name"
                        value={formData.room_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, room_name: e.target.value }))}
                        placeholder="e.g., Blue Room"
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Capacity *</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="room_type">Room Type</Label>
                      <Select
                        value={formData.room_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, room_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief room description"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Room Facilities</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {roomFacilities.map((facility) => (
                        <div key={facility.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={facility.key}
                            checked={formData.facilities[facility.key] || false}
                            onCheckedChange={(checked) => handleFacilityChange(facility.key, checked as boolean)}
                          />
                          <Label htmlFor={facility.key} className="text-sm">
                            {facility.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : editingRoom ? "Update Room" : "Add Room"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Rooms List */}
          <div className="space-y-3">
            {rooms.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Bed className="w-12 h-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Rooms Added</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Start by adding rooms to this guest house
                  </p>
                </CardContent>
              </Card>
            ) : (
              rooms.map((room) => (
                <Card key={room.id} className={`${!room.is_active ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Bed className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">
                              Room {room.room_number}
                              {room.room_name && <span className="text-gray-500"> - {room.room_name}</span>}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {room.capacity} people
                              </span>
                              {room.room_type && (
                                <Badge variant="outline" className="text-xs">
                                  {room.room_type}
                                </Badge>
                              )}
                              <Badge variant={room.is_active ? "default" : "secondary"}>
                                {room.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {room.facilities && Object.keys(room.facilities).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(room.facilities).map(([key, value]) => (
                              value && (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {roomFacilities.find(f => f.key === key)?.label || key.replace('_', ' ')}
                                </Badge>
                              )
                            ))}
                          </div>
                        )}

                        {room.description && (
                          <p className="text-sm text-gray-600 mt-2">{room.description}</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditRoom(room)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteRoom(room.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}