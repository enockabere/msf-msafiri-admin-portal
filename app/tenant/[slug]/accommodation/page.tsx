"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { toast } from "@/components/ui/toast";
import AllocationsList from "@/components/accommodation/AllocationsList";
import { Users } from "lucide-react";







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
        // Refresh allocated participants for current event if modal is open
        if (allocationForm.event_id) {
          await fetchAllocatedParticipants(allocationForm.event_id);
        }
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Visitor Accommodations</h1>
              <p className="text-sm text-gray-600">View automatically booked accommodations</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                <div className="text-xl font-semibold text-purple-900">{allocations.length}</div>
                <div className="text-xs font-normal text-purple-600">Active Bookings</div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-200 border-t-red-600 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="w-8 h-8 text-red-600 animate-pulse" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600">Loading allocations...</p>
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
      </div>
    </DashboardLayout>
  );
}