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
        setAllocations(data);
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Event Allocations: {eventTitle}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
            <div className="flex items-center gap-1">
              <Hotel className="w-4 h-4" />
              <span>{setup.single_rooms}S + {setup.double_rooms}D = {setup.total_capacity} capacity</span>
            </div>
            <div className="text-purple-600 font-medium">
              {setup.current_occupants}/{setup.total_capacity} occupied
            </div>
          </div>
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
            <div className="h-full overflow-auto">
              <AllocationsList
                allocations={allocations}
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

        <div className="flex-shrink-0 flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}