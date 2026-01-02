"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
  "Double"
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
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    room_number: "",
    room_name: "",
    capacity: 1,
    room_type: "",
    facilities: {} as Record<string, boolean>
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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
      toast.error("Failed to load rooms");
    }
  };

  const resetForm = () => {
    setFormData({
      room_number: "",
      room_name: "",
      capacity: 1,
      room_type: "Single",
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
        toast.success(`Room ${editingRoom ? "updated" : "added"} successfully`);
        fetchRooms();
        onSuccess();
        resetForm();
      } else {
        throw new Error(`Failed to ${editingRoom ? "update" : "add"} room`);
      }
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error(`Failed to ${editingRoom ? "update" : "add"} room`);
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
        toast.success("Room deleted successfully");
        fetchRooms();
        onSuccess();
      } else {
        throw new Error("Failed to delete room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
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
      <DialogContent 
        className="sm:max-w-[900px] max-h-[90vh] border shadow-lg scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 overflow-y-auto"
        style={{
          backgroundColor: mounted && theme === 'dark' ? '#000000' : '#ffffff',
          borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb',
          color: mounted && theme === 'dark' ? '#ffffff' : '#000000'
        }}
      >
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bed className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Room Management</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage rooms and configurations for {guestHouse?.name}
              </p>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card style={{
              backgroundColor: mounted && theme === 'dark' ? '#1e3a8a' : '#dbeafe',
              borderColor: mounted && theme === 'dark' ? '#3b82f6' : '#93c5fd'
            }}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold" style={{
                  color: mounted && theme === 'dark' ? '#ffffff' : '#1e3a8a'
                }}>{rooms.filter(r => r.is_active).length}</div>
                <div className="text-xs font-medium mt-1" style={{
                  color: mounted && theme === 'dark' ? '#93c5fd' : '#2563eb'
                }}>Active Rooms</div>
              </CardContent>
            </Card>
            <Card style={{
              backgroundColor: mounted && theme === 'dark' ? '#166534' : '#dcfce7',
              borderColor: mounted && theme === 'dark' ? '#22c55e' : '#86efac'
            }}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold" style={{
                  color: mounted && theme === 'dark' ? '#ffffff' : '#166534'
                }}>{getTotalCapacity()}</div>
                <div className="text-xs font-medium mt-1" style={{
                  color: mounted && theme === 'dark' ? '#86efac' : '#16a34a'
                }}>Total Capacity</div>
              </CardContent>
            </Card>
            <Card style={{
              backgroundColor: mounted && theme === 'dark' ? '#92400e' : '#fef3c7',
              borderColor: mounted && theme === 'dark' ? '#f59e0b' : '#fcd34d'
            }}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold" style={{
                  color: mounted && theme === 'dark' ? '#ffffff' : '#92400e'
                }}>
                  {rooms.length > 0 ? (getTotalCapacity() / rooms.filter(r => r.is_active).length).toFixed(1) : 0}
                </div>
                <div className="text-xs font-medium mt-1" style={{
                  color: mounted && theme === 'dark' ? '#fcd34d' : '#d97706'
                }}>Avg. per Room</div>
              </CardContent>
            </Card>
          </div>

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

          {showAddForm && (
            <Card className="p-6" style={{
              backgroundColor: mounted && theme === 'dark' ? '#1f2937' : '#fef2f2',
              borderColor: mounted && theme === 'dark' ? '#dc2626' : '#fecaca'
            }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <Bed className="w-4 h-4 text-white" />
                  </div>
                  {editingRoom ? "Edit Room" : "Add New Room"}
                </h4>
              </div>
                <form onSubmit={handleSubmitRoom} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="room_number">Room Number <span className="text-red-600">*</span></Label>
                    <Input
                      id="room_number"
                      value={formData.room_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                      placeholder="e.g., 101, A1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room_name">Room Name</Label>
                    <Input
                      id="room_name"
                      value={formData.room_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, room_name: e.target.value }))}
                      placeholder="e.g., Blue Room"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity <span className="text-red-600">*</span></Label>
                    <Select
                      value={formData.capacity.toString()}
                      onValueChange={(value) => {
                        const capacity = parseInt(value);
                        setFormData(prev => ({ 
                          ...prev, 
                          capacity,
                          room_type: capacity === 1 ? "Single" : "Double"
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select capacity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 person</SelectItem>
                        <SelectItem value="2">2 people</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  </div>

                <div className="space-y-2">
                  <Label htmlFor="room_type">Room Type</Label>
                  <Input
                    id="room_type"
                    value={formData.room_type}
                    readOnly
                    className="bg-muted"
                    placeholder="Auto-selected based on capacity"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Room Facilities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-lg border" style={{
                    backgroundColor: mounted && theme === 'dark' ? '#374151' : '#ffffff',
                    borderColor: mounted && theme === 'dark' ? '#4b5563' : '#e5e7eb'
                  }}>
                    {roomFacilities.map((facility) => (
                      <div key={facility.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={facility.key}
                          checked={formData.facilities[facility.key] || false}
                          onCheckedChange={(checked) => handleFacilityChange(facility.key, checked as boolean)}
                          className="border-gray-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                        />
                        <Label htmlFor={facility.key} className="text-sm font-medium cursor-pointer">
                          {facility.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t" style={{
                  borderColor: mounted && theme === 'dark' ? '#4b5563' : '#e5e7eb'
                }}>
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
            </Card>
          )}

          <div className="space-y-3">
            {rooms.length === 0 ? (
              <Card className="p-12 text-center" style={{
                backgroundColor: mounted && theme === 'dark' ? '#1f2937' : '#f9fafb',
                borderStyle: 'dashed',
                borderColor: mounted && theme === 'dark' ? '#6b7280' : '#d1d5db'
              }}>
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bed className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-base font-semibold mb-2">No Rooms Added</h3>
                <p className="text-xs text-muted-foreground mb-4">
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
              </Card>
            ) : (
              rooms.map((room) => (
                <Card key={room.id} className={`p-5 ${!room.is_active ? 'opacity-50' : ''}`} style={{
                  backgroundColor: mounted && theme === 'dark' ? '#000000' : '#ffffff',
                  borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb'
                }}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="bg-red-100 p-2.5 rounded-lg flex-shrink-0">
                              <Bed className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm" style={{
                                color: mounted && theme === 'dark' ? '#ffffff' : '#111827'
                              }}>
                                Room {room.room_number}
                                {room.room_name && <span className="font-normal" style={{
                                  color: mounted && theme === 'dark' ? '#9ca3af' : '#6b7280'
                                }}> - {room.room_name}</span>}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{
                                  color: mounted && theme === 'dark' ? '#ffffff' : '#4b5563',
                                  backgroundColor: mounted && theme === 'dark' ? '#374151' : '#f3f4f6'
                                }}>
                                  <Users className="w-3.5 h-3.5" />
                                  {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                                </span>
                                {room.room_type && (
                                  <Badge variant="outline" className="text-xs" style={{
                                    backgroundColor: mounted && theme === 'dark' ? '#1e3a8a' : '#dbeafe',
                                    color: mounted && theme === 'dark' ? '#93c5fd' : '#1d4ed8',
                                    borderColor: mounted && theme === 'dark' ? '#3b82f6' : '#93c5fd'
                                  }}>
                                    {room.room_type}
                                  </Badge>
                                )}
                                <Badge variant={room.is_active ? "default" : "secondary"} style={{
                                  backgroundColor: room.is_active ? (mounted && theme === 'dark' ? '#166534' : '#dcfce7') : undefined,
                                  color: room.is_active ? (mounted && theme === 'dark' ? '#86efac' : '#166534') : undefined,
                                  borderColor: room.is_active ? (mounted && theme === 'dark' ? '#22c55e' : '#86efac') : undefined
                                }}>
                                  {room.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {room.facilities && Object.keys(room.facilities).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 ml-14">
                              {Object.entries(room.facilities).map(([key, value]) => (
                                value && (
                                  <Badge key={key} variant="outline" className="text-[10px] sm:text-xs" style={{
                                    backgroundColor: mounted && theme === 'dark' ? '#374151' : '#f9fafb',
                                    color: mounted && theme === 'dark' ? '#d1d5db' : '#374151',
                                    borderColor: mounted && theme === 'dark' ? '#4b5563' : '#d1d5db'
                                  }}>
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
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}