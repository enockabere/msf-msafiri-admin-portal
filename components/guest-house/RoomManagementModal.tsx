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
import { Plus, Edit, Trash2, Bed, Users, Settings, Loader2, Save, X } from "lucide-react";

interface GuestHouseRoom {
  id: number;
  room_number: string;
  room_name?: string;
  capacity: number;
  room_type?: string;
  facilities?: Record<string, any>;
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
      <DialogContent className="sm:max-w-[900px] bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        {/* Header with close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4 text-gray-500" />
          <span className="sr-only">Close</span>
        </button>

        <div className="p-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bed className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">Room Management</DialogTitle>
              <p className="text-gray-600 text-sm mt-1">
                Manage rooms and configurations for {guestHouse.name}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto modal-scrollbar">
          <div className="p-6 space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200 text-center">
                <div className="text-2xl font-bold text-blue-900">{rooms.filter(r => r.is_active).length}</div>
                <div className="text-xs text-blue-600 font-medium mt-1">Active Rooms</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200 text-center">
                <div className="text-2xl font-bold text-green-900">{getTotalCapacity()}</div>
                <div className="text-xs text-green-600 font-medium mt-1">Total Capacity</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border-2 border-amber-200 text-center">
                <div className="text-2xl font-bold text-amber-900">
                  {rooms.length > 0 ? (getTotalCapacity() / rooms.filter(r => r.is_active).length).toFixed(1) : 0}
                </div>
                <div className="text-xs text-amber-600 font-medium mt-1">Avg. per Room</div>
              </div>
            </div>

            {/* Add Room Button */}
            {!showAddForm && (
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </Button>
              </div>
            )}

            {/* Add/Edit Room Form */}
            {showAddForm && (
              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border-2 border-red-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                      <Bed className="w-4 h-4 text-white" />
                    </div>
                    {editingRoom ? "Edit Room" : "Add New Room"}
                  </h4>
                </div>
                <form onSubmit={handleSubmitRoom} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="room_number" className="text-sm font-semibold text-gray-900">
                        Room Number
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="room_number"
                        value={formData.room_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                        placeholder="e.g., 101, A1"
                        required
                        className="h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="room_name" className="text-sm font-semibold text-gray-900">
                        Room Name
                      </Label>
                      <Input
                        id="room_name"
                        value={formData.room_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, room_name: e.target.value }))}
                        placeholder="e.g., Blue Room"
                        className="h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity" className="text-sm font-semibold text-gray-900">
                        Capacity
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                        required
                        className="h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room_type" className="text-sm font-semibold text-gray-900">
                      Room Type
                    </Label>
                    <Select
                      value={formData.room_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, room_type: value }))}
                    >
                      <SelectTrigger className="h-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500">
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

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900">
                      Room Facilities
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-white rounded-lg border border-gray-200">
                      {roomFacilities.map((facility) => (
                        <div key={facility.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={facility.key}
                            checked={formData.facilities[facility.key] || false}
                            onCheckedChange={(checked) => handleFacilityChange(facility.key, checked as boolean)}
                            className="border-gray-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                          />
                          <Label htmlFor={facility.key} className="text-sm font-medium text-gray-700 cursor-pointer">
                            {facility.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {editingRoom ? "Update Room" : "Add Room"}
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Rooms List */}
            <div className="space-y-3">
              {rooms.length === 0 ? (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-12 rounded-xl border-2 border-dashed border-gray-300 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bed className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">No Rooms Added</h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Start by adding rooms to this guest house
                  </p>
                  <Button
                    onClick={() => {
                      resetForm();
                      setShowAddForm(true);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Room
                  </Button>
                </div>
              ) : (
                rooms.map((room) => (
                  <div key={room.id} className={`bg-white p-5 rounded-xl border-2 border-gray-200 hover:border-red-300 shadow-sm hover:shadow-md transition-all ${!room.is_active ? 'opacity-50' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="bg-red-100 p-2.5 rounded-lg flex-shrink-0">
                              <Bed className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                Room {room.room_number}
                                {room.room_name && <span className="text-gray-500 font-normal"> - {room.room_name}</span>}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  <Users className="w-3.5 h-3.5" />
                                  {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                                </span>
                                {room.room_type && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {room.room_type}
                                  </Badge>
                                )}
                                <Badge variant={room.is_active ? "default" : "secondary"} className={room.is_active ? "bg-green-100 text-green-800 border border-green-300" : ""}>
                                  {room.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {room.facilities && Object.keys(room.facilities).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 ml-14">
                              {Object.entries(room.facilities).map(([key, value]) => (
                                value && (
                                  <Badge key={key} variant="outline" className="text-[10px] sm:text-xs bg-gray-50">
                                    {roomFacilities.find(f => f.key === key)?.label || key.replace('_', ' ')}
                                  </Badge>
                                )
                              ))}
                            </div>
                          )}


                        </div>

                        <div className="flex gap-2 ml-14 sm:ml-0">
                          <Button
                            onClick={() => handleEditRoom(room)}
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none hover:bg-blue-50 hover:border-blue-300 border-2"
                          >
                            <Edit className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            onClick={() => handleDeleteRoom(room.id)}
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white border-0"
                          >
                            <Trash2 className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}