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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Bed className="w-5 h-5" />
              </div>
              Room Management
            </DialogTitle>
            <DialogDescription className="text-blue-100 mt-2">
              Manage rooms and configurations for {guestHouse.name}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-900">{rooms.filter(r => r.is_active).length}</div>
              <div className="text-sm text-blue-600 font-medium">Active Rooms</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 text-center">
              <div className="text-2xl font-bold text-green-900">{getTotalCapacity()}</div>
              <div className="text-sm text-green-600 font-medium">Total Capacity</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 text-center">
              <div className="text-2xl font-bold text-purple-900">
                {rooms.length > 0 ? (getTotalCapacity() / rooms.filter(r => r.is_active).length).toFixed(1) : 0}
              </div>
              <div className="text-sm text-purple-600 font-medium">Avg. per Room</div>
            </div>
          </div>

          {/* Add Room Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800">Room Management</h3>
            <Button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          </div>

          {/* Add/Edit Room Form */}
          {showAddForm && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Bed className="w-4 h-4 text-white" />
                  </div>
                  {editingRoom ? "Edit Room" : "Add New Room"}
                </h4>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </Button>
              </div>
              <div>
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

                  <div className="flex gap-3 pt-6">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
                    >
                      {loading ? "Saving..." : editingRoom ? "Update Room" : "Add Room"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Rooms List */}
          <div className="space-y-3">
            {rooms.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-12 rounded-xl border-2 border-dashed border-gray-300 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bed className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rooms Added</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Start by adding rooms to this guest house
                </p>
                <Button
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Room
                </Button>
              </div>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className={`bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${!room.is_active ? 'opacity-50' : ''}`}>
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
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteRoom(room.id)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white border-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}