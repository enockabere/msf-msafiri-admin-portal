"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { useTheme } from "next-themes";
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
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const tenantSlug = params.slug as string;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const canEdit = true;

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
      <div className="w-full h-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-100 border-t-red-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Home className="w-6 h-6 text-red-600 animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-base font-medium text-gray-900 dark:text-white">Loading guest houses...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch the data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent dark:from-red-400/20 dark:via-red-400/10 dark:to-transparent"></div>
        <CardHeader className="relative p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 group-hover:scale-110 transition-all duration-300">
                <Home className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className={`text-sm sm:text-base font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Guest House Setup</h1>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} hidden sm:block`}>Manage guest houses and their room configurations</p>
              </div>
            </div>
            {canEdit && (
              <Button
                onClick={() => {
                  setEditingGuestHouse(null);
                  setSetupModalOpen(true);
                }}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-xs px-3 py-2 w-full sm:w-auto"
              >
                <Plus className="w-3 h-3 mr-2" />
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Add Guest House</span>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {guestHouses.length === 0 ? (
        <Card style={{
          backgroundColor: mounted && theme === 'dark' ? '#000000' : '#ffffff',
          borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb'
        }}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="w-12 h-12 mb-4" style={{
              color: mounted && theme === 'dark' ? '#6b7280' : '#d1d5db'
            }} />
            <h3 className="text-lg font-medium mb-2" style={{
              color: mounted && theme === 'dark' ? '#ffffff' : '#111827'
            }}>No Guest Houses</h3>
            <p className="text-sm text-center max-w-md mb-4" style={{
              color: mounted && theme === 'dark' ? '#9ca3af' : '#4b5563'
            }}>
              Get started by adding your first guest house. You can configure rooms and manage bookings once set up.
            </p>
            {canEdit && (
              <Button
                onClick={() => {
                  setEditingGuestHouse(null);
                  setSetupModalOpen(true);
                }}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg text-xs px-3 py-2"
              >
                <Plus className="w-3 h-3 mr-2" />
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Add Guest House</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {guestHouses.map((guestHouse) => (
            <Card key={guestHouse.id} className="group relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent dark:from-red-400/20 dark:via-red-400/10 dark:to-transparent"></div>
              <CardContent className="relative p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:shadow-red-500/25 group-hover:scale-110 transition-all duration-300">
                    <Home className="h-5 w-5 text-white" />
                  </div>
                  <Badge
                    variant={guestHouse.is_active ? "default" : "secondary"}
                    className={`${guestHouse.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : ""}`}
                  >
                    {guestHouse.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Guest House</h3>
                    <div className="h-0.5 w-6 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
                  </div>
                  <div className="text-lg font-black text-gray-900 dark:text-white tracking-tight group-hover:text-red-600 transition-colors">
                    {guestHouse.name}
                  </div>
                  <div className="flex items-start gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{guestHouse.location}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-600/10 p-3 rounded-xl text-center border border-blue-200 dark:border-blue-500/20">
                    <div className="text-xl font-black text-blue-900 dark:text-blue-400">
                      {getActiveRoomsCount(guestHouse.rooms)}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">Rooms</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-500/10 dark:to-green-600/10 p-3 rounded-xl text-center border border-green-200 dark:border-green-500/20">
                    <div className="text-xl font-black text-green-900 dark:text-green-400">
                      {getTotalCapacity(guestHouse.rooms)}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-semibold mt-0.5">Capacity</div>
                  </div>
                </div>

                {guestHouse.contact_person && (
                  <div className="text-xs p-3 rounded-lg border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 mb-4">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Contact:</span>{" "}
                    <span className="text-gray-900 dark:text-white">{guestHouse.contact_person}</span>
                    {guestHouse.phone && (
                      <span className="block text-gray-600 dark:text-gray-400 mt-1">📞 {guestHouse.phone}</span>
                    )}
                  </div>
                )}

                {guestHouse.facilities && Object.keys(guestHouse.facilities).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {Object.entries(guestHouse.facilities).slice(0, 4).map(([key, value]) => (
                      value && (
                        <Badge key={key} variant="outline" className="text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                          {key.replace('_', ' ')}
                        </Badge>
                      )
                    ))}
                    {Object.entries(guestHouse.facilities).filter(([_, v]) => v).length > 4 && (
                      <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                        +{Object.entries(guestHouse.facilities).filter(([_, v]) => v).length - 4} more
                      </Badge>
                    )}
                  </div>
                )}

                {canEdit && (
                  <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleManageRooms(guestHouse)}
                        size="sm"
                        variant="outline"
                        className="h-9 border-blue-200 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/20"
                      >
                        <Bed className="w-3.5 h-3.5 mr-1" />
                        <span className="text-xs">Rooms</span>
                      </Button>
                      <Button
                        onClick={() => handleEditGuestHouse(guestHouse)}
                        size="sm"
                        variant="outline"
                        className="h-9 border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        <Settings className="w-3.5 h-3.5 mr-1" />
                        <span className="text-xs">Edit</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleToggleGuestHouse(guestHouse)}
                        size="sm"
                        className={`h-9 text-white border-0 text-xs font-semibold ${
                          guestHouse.is_active 
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-orange-500/25' 
                            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-green-500/25'
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
                        className="h-9 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 text-xs font-semibold shadow-lg hover:shadow-red-500/25"
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

      <GuestHouseSetupModal
        open={setupModalOpen}
        onOpenChange={setSetupModalOpen}
        onSuccess={fetchGuestHouses}
        editingGuestHouse={editingGuestHouse}
        apiClient={apiClient as { getToken: () => string }}
        tenantSlug={tenantSlug}
      />

      <RoomManagementModal
        open={roomModalOpen}
        onOpenChange={setRoomModalOpen}
        guestHouse={selectedGuestHouse}
        onSuccess={fetchGuestHouses}
        apiClient={apiClient as { getToken: () => string }}
        tenantSlug={tenantSlug}
      />
    </div>
  );
}