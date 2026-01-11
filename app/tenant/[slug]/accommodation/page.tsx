"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const [checkingOut, setCheckingOut] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      const [allocationsData, eventsData] = await Promise.all([
        apiClient.request<Allocation[]>('/accommodation/allocations', {
          headers: { 'X-Tenant-ID': tenantSlug }
        }),
        apiClient.request<Event[]>('/events', {
          headers: { 'X-Tenant-ID': tenantSlug }
        })
      ]);

      const activeAllocations = allocationsData.filter((allocation: Allocation) => allocation.status !== 'cancelled');
      setAllocations(activeAllocations);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle authentication errors gracefully
      if (error instanceof Error && error.message.includes('credentials')) {
        toast({ 
          title: "Authentication Error", 
          description: "Please refresh the page or log in again", 
          variant: "destructive" 
        });
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, apiClient, tenantSlug]);

  useEffect(() => {
    if (!authLoading && user && user.accessToken) {
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
      await apiClient.request(`/accommodation/allocations/${id}`, {
        method: "DELETE",
        headers: { 'X-Tenant-ID': tenantSlug }
      });

      await fetchData();
      toast({ title: "Success", description: "Allocation deleted successfully" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network error occurred";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleCheckIn = async (id: number) => {
    setCheckingIn(id);
    try {
      await apiClient.request(`/accommodation/allocations/${id}/check-in`, {
        method: "PATCH",
        headers: { 'X-Tenant-ID': tenantSlug }
      });

      fetchData();
      toast({ title: "Success", description: "Guest checked in successfully" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network error occurred";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setCheckingIn(null);
    }
  };

  const handleBulkCheckIn = async (ids: number[]) => {
    setBulkCheckingIn(true);
    try {
      const promises = ids.map(id => 
        apiClient.request(`/accommodation/allocations/${id}/check-in`, {
          method: "PATCH",
          headers: { 'X-Tenant-ID': tenantSlug }
        })
      );
      
      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
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

  const handleCheckOut = async (id: number) => {
    setCheckingOut(id);
    try {
      await apiClient.request(`/accommodation/allocations/${id}/status`, {
        method: "PATCH",
        headers: { 
          'X-Tenant-ID': tenantSlug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'released' })
      });

      fetchData();
      toast({ title: "Success", description: "Guest checked out successfully" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network error occurred";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setCheckingOut(null);
    }
  };

  const handleCancelCheckIn = async (id: number) => {
    setCancelling(id);
    try {
      await apiClient.request(`/accommodation/allocations/${id}/status`, {
        method: "PATCH",
        headers: { 
          'X-Tenant-ID': tenantSlug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'booked' })
      });

      fetchData();
      toast({ title: "Success", description: "Check-in cancelled successfully" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network error occurred";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setCancelling(null);
    }
  };

  const handleRefreshAccommodations = async () => {
    setRefreshing(true);
    try {
      const result = await apiClient.request<{ rebooked_count?: number }>('/accommodation/refresh-all', {
        method: "POST",
        headers: { 'X-Tenant-ID': tenantSlug }
      });

      toast({ 
        title: "Success", 
        description: `Accommodations refreshed successfully. ${result.rebooked_count || 0} visitors rebooked.` 
      });
      fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network error occurred";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header Section - Match badges page design */}
      <Card className="relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent dark:from-red-400/20 dark:via-red-400/10 dark:to-transparent"></div>
        <div className="relative p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 group-hover:scale-110 transition-all duration-300">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-medium text-gray-900 dark:text-white">Visitor Accommodations</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Manage and track all visitor bookings and check-ins</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowBookingModal(true)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-3 py-2 text-xs"
              >
                <Plus className="w-3 h-3 mr-2" />
                Book Guest House
              </Button>
              <Button
                onClick={handleRefreshAccommodations}
                disabled={refreshing}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 px-3 py-2 text-xs"
              >
                {refreshing ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-100 border-t-red-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="w-6 h-6 text-red-600 animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-gray-900">Loading accommodations...</p>
              <p className="text-sm text-gray-500">Please wait while we fetch the data</p>
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
          onCheckOut={handleCheckOut}
          checkingOut={checkingOut}
          onCancelCheckIn={handleCancelCheckIn}
          cancelling={cancelling}
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
  );
}