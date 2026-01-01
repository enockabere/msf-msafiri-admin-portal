"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Home, MapPin, Users, Settings, Bed, Hotel, Trash2, Power, PowerOff } from "lucide-react";
import Swal from "sweetalert2";
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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchGuestHouses = async () => {
    if (authLoading || !user) {
      return;
    }

    try {
      const token = apiClient.getToken();
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/guest-houses/?tenant_context=${tenantSlug}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGuestHouses(data);
      } else {
        throw new Error(`Failed to fetch guest houses: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching guest houses:", error);
      toast.error("Failed to load guest houses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuestHouses();
  }, [authLoading, user]);

  const canEdit = true; // Allow all users to manage guest houses

  const handleEditGuestHouse = (guestHouse: GuestHouse) => {
    setEditingGuestHouse(guestHouse);
    setSetupModalOpen(true);
  };

  const handleManageRooms = (guestHouse: GuestHouse) => {
    setSelectedGuestHouse(guestHouse);
    setRoomModalOpen(true);
  };

  const handleDeleteGuestHouse = async (guestHouse: GuestHouse) => {
    const result = await Swal.fire({
      title: 'Delete Guest House?',
      text: `Are you sure you want to delete "${guestHouse.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingId(guestHouse.id);
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/guest-houses/${guestHouse.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        await Swal.fire({
          title: 'Deleted!',
          text: 'Guest house has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#059669'
        });
        fetchGuestHouses();
      } else {
        throw new Error("Failed to delete guest house");
      }
    } catch (error) {
      console.error("Error deleting guest house:", error);
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to delete guest house. Please try again.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleGuestHouse = async (guestHouse: GuestHouse) => {
    const action = guestHouse.is_active ? 'deactivate' : 'activate';
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Guest House?`,
      text: `Are you sure you want to ${action} "${guestHouse.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: guestHouse.is_active ? '#dc2626' : '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action} it!`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setTogglingId(guestHouse.id);
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/guest-houses/${guestHouse.id}`,
        {
          method: 'PUT',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_active: !guestHouse.is_active })
        }
      );

      if (response.ok) {
        await Swal.fire({
          title: `${action.charAt(0).toUpperCase() + action.slice(1)}d!`,
          text: `Guest house has been ${action}d successfully.`,
          icon: 'success',
          confirmButtonColor: '#059669'
        });
        fetchGuestHouses();
      } else {
        throw new Error(`Failed to ${action} guest house`);
      }
    } catch (error) {
      console.error(`Error ${action}ing guest house:`, error);
      await Swal.fire({
        title: 'Error!',
        text: `Failed to ${action} guest house. Please try again.`,
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setTogglingId(null);
    }
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
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Guest House Setup</h1>
                <p className="text-sm text-gray-600">Manage guest houses and their room configurations for visitor accommodations</p>
              </div>
            </div>
            {canEdit && (
              <Button
                onClick={() => {
                  setEditingGuestHouse(null);
                  setSetupModalOpen(true);
                }}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Guest House
              </Button>
            )}
          </div>
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
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Guest House
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {guestHouses.map((guestHouse) => (
              <Card key={guestHouse.id} className="shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50 group overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-red-200 shadow-sm flex-shrink-0">
                          <Home className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
                        </div>
                        <CardTitle className="text-base sm:text-lg group-hover:text-red-600 transition-colors break-words">
                          {guestHouse.name}
                        </CardTitle>
                      </div>
                      <Badge
                        variant={guestHouse.is_active ? "default" : "secondary"}
                        className={`flex-shrink-0 ${guestHouse.is_active ? "bg-green-100 text-green-800 border border-green-300" : ""}`}
                      >
                        {guestHouse.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-start gap-1 text-xs">
                      <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{guestHouse.location}</span>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p className="line-clamp-2 break-words">{guestHouse.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl text-center border-2 border-blue-200">
                      <div className="text-2xl font-bold text-blue-900">
                        {getActiveRoomsCount(guestHouse.rooms)}
                      </div>
                      <div className="text-[10px] sm:text-xs text-blue-600 font-medium mt-0.5">Rooms</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl text-center border-2 border-green-200">
                      <div className="text-2xl font-bold text-green-900">
                        {getTotalCapacity(guestHouse.rooms)}
                      </div>
                      <div className="text-[10px] sm:text-xs text-green-600 font-medium mt-0.5">Capacity</div>
                    </div>
                  </div>

                  {guestHouse.contact_person && (
                    <div className="text-xs sm:text-sm bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <span className="font-semibold text-gray-700">Contact:</span>{" "}
                      <span className="text-gray-900">{guestHouse.contact_person}</span>
                      {guestHouse.phone && (
                        <span className="text-gray-500 block sm:inline sm:ml-1">• {guestHouse.phone}</span>
                      )}
                    </div>
                  )}

                  {guestHouse.facilities && Object.keys(guestHouse.facilities).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(guestHouse.facilities).slice(0, 5).map(([key, value]) => (
                        value && (
                          <Badge key={key} variant="outline" className="text-[10px] sm:text-xs bg-white">
                            {key.replace('_', ' ')}
                          </Badge>
                        )
                      ))}
                      {Object.entries(guestHouse.facilities).filter(([_, v]) => v).length > 5 && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs bg-white">
                          +{Object.entries(guestHouse.facilities).filter(([_, v]) => v).length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {canEdit && (
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleManageRooms(guestHouse)}
                          size="sm"
                          variant="outline"
                          className="border-2 hover:bg-blue-50 hover:border-blue-300 h-9"
                        >
                          <Bed className="w-3.5 h-3.5 mr-1" />
                          <span className="text-xs sm:text-sm">Rooms</span>
                        </Button>
                        <Button
                          onClick={() => handleEditGuestHouse(guestHouse)}
                          size="sm"
                          variant="outline"
                          className="border-2 hover:bg-blue-50 hover:border-blue-300 h-9"
                        >
                          <Settings className="w-3.5 h-3.5 mr-1" />
                          <span className="text-xs sm:text-sm">Edit</span>
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleToggleGuestHouse(guestHouse)}
                          size="sm"
                          className={`h-9 text-white border-0 text-xs sm:text-sm ${
                            guestHouse.is_active 
                              ? 'bg-orange-600 hover:bg-orange-700' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                          disabled={togglingId === guestHouse.id}
                        >
                          {togglingId === guestHouse.id ? (
                            <>
                              <div className="w-3.5 h-3.5 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              {guestHouse.is_active ? 'Deactivating...' : 'Activating...'}
                            </>
                          ) : (
                            <>
                              {guestHouse.is_active ? (
                                <>
                                  <PowerOff className="w-3.5 h-3.5 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="w-3.5 h-3.5 mr-1" />
                                  Activate
                                </>
                              )}
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDeleteGuestHouse(guestHouse)}
                          size="sm"
                          className="h-9 bg-red-600 hover:bg-red-700 text-white border-0 text-xs sm:text-sm"
                          disabled={deletingId === guestHouse.id}
                        >
                          {deletingId === guestHouse.id ? (
                            <>
                              <div className="w-3.5 h-3.5 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
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