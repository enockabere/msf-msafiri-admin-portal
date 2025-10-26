"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Plus, Home, MapPin, Users, Settings, Bed } from "lucide-react";
import GuestHouseSetupModal from "@/components/guest-house/GuestHouseSetupModal";
import RoomManagementModal from "@/components/guest-house/RoomManagementModal";

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
  location: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  facilities?: Record<string, any>;
  house_rules?: string;
  check_in_time?: string;
  check_out_time?: string;
  is_active: boolean;
  tenant_id: string;
  created_by: string;
  created_at: string;
  rooms: GuestHouseRoom[];
}

export default function GuestHouseSetupPage() {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const params = useParams();
  const tenantSlug = params.slug as string;

  const [guestHouses, setGuestHouses] = useState<GuestHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingGuestHouse, setEditingGuestHouse] = useState<GuestHouse | null>(null);
  const [selectedGuestHouse, setSelectedGuestHouse] = useState<GuestHouse | null>(null);

  const fetchGuestHouses = async () => {
    if (authLoading || !user) return;

    try {
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/guest-houses/?tenant_context=${tenantSlug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGuestHouses(data);
      } else {
        throw new Error("Failed to fetch guest houses");
      }
    } catch (error) {
      console.error("Error fetching guest houses:", error);
      toast({ title: "Error", description: "Failed to load guest houses", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuestHouses();
  }, [authLoading, user]);

  const canEdit = Boolean(user?.role && ["super_admin", "mt_admin", "hr_admin"].includes(user.role));

  const handleEditGuestHouse = (guestHouse: GuestHouse) => {
    setEditingGuestHouse(guestHouse);
    setSetupModalOpen(true);
  };

  const handleManageRooms = (guestHouse: GuestHouse) => {
    setSelectedGuestHouse(guestHouse);
    setRoomModalOpen(true);
  };

  const getTotalCapacity = (rooms: GuestHouseRoom[]) => {
    return rooms.filter(r => r.is_active).reduce((total, room) => total + room.capacity, 0);
  };

  const getActiveRoomsCount = (rooms: GuestHouseRoom[]) => {
    return rooms.filter(r => r.is_active).length;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading guest houses...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Guest House Setup</h1>
            <p className="text-sm text-gray-600">
              Manage guest houses and their room configurations for visitor accommodations
            </p>
          </div>
          {canEdit && (
            <Button
              onClick={() => {
                setEditingGuestHouse(null);
                setSetupModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Guest House
            </Button>
          )}
        </div>

        {guestHouses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Guest Houses</h3>
              <p className="text-sm text-gray-600 text-center max-w-md mb-4">
                Get started by adding your first guest house. You can configure rooms and manage bookings once set up.
              </p>
              {canEdit && (
                <Button
                  onClick={() => {
                    setEditingGuestHouse(null);
                    setSetupModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Guest House
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {guestHouses.map((guestHouse) => (
              <Card key={guestHouse.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Home className="w-5 h-5 text-blue-600" />
                        {guestHouse.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {guestHouse.location}
                      </CardDescription>
                    </div>
                    <Badge variant={guestHouse.is_active ? "default" : "secondary"}>
                      {guestHouse.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p className="line-clamp-2">{guestHouse.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-semibold text-blue-900">
                        {getActiveRoomsCount(guestHouse.rooms)}
                      </div>
                      <div className="text-xs text-blue-600">Rooms</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-semibold text-green-900">
                        {getTotalCapacity(guestHouse.rooms)}
                      </div>
                      <div className="text-xs text-green-600">Total Capacity</div>
                    </div>
                  </div>

                  {guestHouse.contact_person && (
                    <div className="text-sm">
                      <span className="font-medium">Contact:</span> {guestHouse.contact_person}
                      {guestHouse.phone && <span className="text-gray-500"> • {guestHouse.phone}</span>}
                    </div>
                  )}

                  {guestHouse.facilities && Object.keys(guestHouse.facilities).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(guestHouse.facilities).map(([key, value]) => (
                        value && (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key.replace('_', ' ')}
                          </Badge>
                        )
                      ))}
                    </div>
                  )}

                  {canEdit && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleManageRooms(guestHouse)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Bed className="w-4 h-4 mr-1" />
                        Rooms
                      </Button>
                      <Button
                        onClick={() => handleEditGuestHouse(guestHouse)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Guest House Setup Modal */}
        <GuestHouseSetupModal
          open={setupModalOpen}
          onOpenChange={setSetupModalOpen}
          onSuccess={fetchGuestHouses}
          editingGuestHouse={editingGuestHouse}
          apiClient={apiClient as { getToken: () => string }}
          tenantSlug={tenantSlug}
        />

        {/* Room Management Modal */}
        <RoomManagementModal
          open={roomModalOpen}
          onOpenChange={setRoomModalOpen}
          guestHouse={selectedGuestHouse}
          onSuccess={fetchGuestHouses}
          apiClient={apiClient as { getToken: () => string }}
          tenantSlug={tenantSlug}
        />
      </div>
    </DashboardLayout>
  );
}