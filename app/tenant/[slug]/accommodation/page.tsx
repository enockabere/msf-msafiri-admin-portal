"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import AllocationsList from "@/components/accommodation/AllocationsList";
import GuestHouseBookingModal from "@/components/accommodation/GuestHouseBookingModal";
import { Users, Plus, RefreshCw } from "lucide-react";







interface Allocation {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  accommodation_type: string;
  status: string;
  room_type?: string;
  vendor_accommodation?: {
    id: number;
    vendor_name: string;
    capacity: number;
    current_occupants: number;
  };
  event?: {
    title: string;
  };
  participant?: {
    name: string;
    role: string;
  };
}

interface Event {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
}

export default function AccommodationPage() {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const params = useParams();
  const tenantSlug = params.slug as string;

  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [bulkCheckingIn, setBulkCheckingIn] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);





  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      const token = apiClient.getToken();
      const [allocationsResponse, eventsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/allocations`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': tenantSlug
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': tenantSlug
          },
        }),
      ]);

      if (allocationsResponse.ok) {
        const allocationsData = await allocationsResponse.json();
        const activeAllocations = allocationsData.filter((allocation: Allocation) => allocation.status !== 'cancelled');
        setAllocations(activeAllocations);
      }

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, apiClient, tenantSlug]);



  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, fetchData]);

  const fetchDataCallback = useCallback(() => {
    fetchData();
  }, [fetchData]);









  const handleDeleteAllocation = async (allocation: Allocation) => {
    const id = allocation.id;
    setDeleting(id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/allocations/${id}`,
        {
          method: "DELETE",
          headers: { 
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (response.ok) {
        await fetchData();
        toast({ title: "Success", description: "Allocation deleted successfully" });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleCheckIn = async (id: number) => {
    setCheckingIn(id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/allocations/${id}/check-in`,
        {
          method: "PATCH",
          headers: { 
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (response.ok) {
        fetchData();
        toast({ title: "Success", description: "Guest checked in successfully" });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setCheckingIn(null);
    }
  };

  const handleBulkCheckIn = async (ids: number[]) => {
    setBulkCheckingIn(true);
    try {
      const promises = ids.map(id => 
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/allocations/${id}/check-in`,
          {
            method: "PATCH",
            headers: { 
              Authorization: `Bearer ${apiClient.getToken()}`,
              'X-Tenant-ID': tenantSlug
            },
          }
        )
      );
      
      const responses = await Promise.all(promises);
      const successCount = responses.filter(r => r.ok).length;
      
      if (successCount === ids.length) {
        toast({ title: "Success", description: `${successCount} guests checked in successfully` });
      } else {
        toast({ title: "Partial Success", description: `${successCount} of ${ids.length} guests checked in` });
      }
      
      fetchData();
    } catch {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setBulkCheckingIn(false);
    }
  };

  const handleRefreshAccommodations = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/refresh-all`,
        {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast({ 
          title: "Success", 
          description: `Accommodations refreshed successfully. ${result.rebooked_count || 0} visitors rebooked.` 
        });
        fetchData();
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Modern Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-orange-600 rounded-2xl shadow-xl">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Title Section */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Visitor Accommodations</h1>
                    <p className="text-sm text-red-100 mt-0.5">Manage and track all visitor bookings and check-ins</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{allocations.length}</div>
                      <div className="text-xs text-red-100">Active Bookings</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  onClick={() => setShowBookingModal(true)}
                  className="bg-white text-red-600 hover:bg-red-50 shadow-lg font-semibold h-12 px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Book Guest House
                </Button>
                <Button
                  onClick={handleRefreshAccommodations}
                  disabled={refreshing}
                  className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/20 shadow-lg h-12 px-6"
                >
                  {refreshing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-red-100 border-t-red-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="w-10 h-10 text-red-600 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">Loading accommodations...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the data</p>
              </div>
            </div>
          </div>
        ) : (
          <AllocationsList
            allocations={allocations}
            onDelete={(id: number) => {
              const allocation = allocations.find(a => a.id === id);
              if (allocation) handleDeleteAllocation(allocation);
            }}
            deleting={deleting}
            onCheckIn={handleCheckIn}
            checkingIn={checkingIn}
            events={events}
            onBulkCheckIn={handleBulkCheckIn}
            bulkCheckingIn={bulkCheckingIn}
          />
        )}

        {/* Guest House Booking Modal */}
        {showBookingModal && (
          <GuestHouseBookingModal
            open={showBookingModal}
            onOpenChange={setShowBookingModal}
            onSuccess={fetchDataCallback}
            apiClient={apiClient}
            tenantSlug={tenantSlug}
            events={events}
          />
        )}
      </div>
    </DashboardLayout>
  );
}