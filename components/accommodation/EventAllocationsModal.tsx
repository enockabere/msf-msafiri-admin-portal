"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Calendar, Hotel } from "lucide-react";
import AllocationsList from "./AllocationsList";

interface VendorEventSetup {
  id: number;
  event_id?: number;
  event_name?: string;
  single_rooms: number;
  double_rooms: number;
  total_capacity: number;
  current_occupants: number;
  event?: {
    title: string;
    start_date: string;
    end_date: string;
  };
}

interface Event {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
}

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
  room?: {
    id: number;
    room_number: string;
    capacity: number;
    current_occupants: number;
    guesthouse: {
      name: string;
    };
  };
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

interface EventAllocationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setup: VendorEventSetup | null;
  apiClient: { getToken: () => string };
  tenantSlug: string;
  events: Event[];
  onDeleteAllocation: (id: number) => void;
  onCheckIn: (id: number) => void;
  onBulkCheckIn: (ids: number[]) => void;
  deleting: number | null;
  checkingIn: number | null;
  bulkCheckingIn: boolean;
}

export default function EventAllocationsModal({
  open,
  onOpenChange,
  setup,
  apiClient,
  tenantSlug,
  events,
  onDeleteAllocation,
  onCheckIn,
  onBulkCheckIn,
  deleting,
  checkingIn,
  bulkCheckingIn,
}: EventAllocationsModalProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEventAllocations = async () => {
    if (!setup || !setup.event_id) return;

    console.log(`🏨 DEBUG: Fetching allocations for event ${setup.event_id}`);
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/allocations?event_id=${setup.event_id}`,
        {
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`🏨 DEBUG: Received ${data.length} allocations:`, data);
        setAllocations(data);
      } else {
        console.error(`🏨 DEBUG: Failed to fetch allocations:`, response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching event allocations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && setup) {
      fetchEventAllocations();
    }
  }, [open, setup]);

  if (!setup) return null;

  const eventTitle = setup.event?.title || setup.event_name || 'Custom Event';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] sm:w-[95vw] lg:w-[90vw] xl:w-[85vw] h-[95vh] sm:h-[90vh] max-w-[98vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] overflow-hidden flex flex-col bg-white border-0 shadow-2xl p-0 rounded-2xl">
        <DialogHeader className="px-4 sm:px-6 lg:px-8 py-6 border-b-2 border-gray-100 bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 rounded-t-2xl relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-200/30 to-pink-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-orange-200/30 to-yellow-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                <Hotel className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  Event Allocations - {eventTitle}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {setup.single_rooms} Single + {setup.double_rooms} Double = {setup.total_capacity} capacity • {setup.current_occupants} occupied
                </p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-600">Loading allocations...</p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto p-4 sm:p-6">
              <AllocationsList
                allocations={allocations.filter(allocation => 
                  allocation.status !== 'cancelled' && 
                  allocation.status !== 'declined' &&
                  allocation.event_id === setup.event_id
                )}
                onDelete={onDeleteAllocation}
                deleting={deleting}
                onCheckIn={onCheckIn}
                checkingIn={checkingIn}
                events={events}
                onBulkCheckIn={onBulkCheckIn}
                bulkCheckingIn={bulkCheckingIn}
              />
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end pt-3 border-t bg-white px-3 sm:px-4 lg:px-6 pb-3 rounded-b-2xl">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            size="sm"
            className="px-4 py-2 bg-white border-gray-300 hover:bg-gray-50 text-xs"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}