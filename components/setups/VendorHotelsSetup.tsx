"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { toast } from "@/components/ui/toast";
import VendorCard from "@/components/accommodation/VendorCard";
import VendorManagement from "@/components/accommodation/VendorManagement";
import EventAccommodationSetupModal from "@/components/accommodation/EventAccommodationSetupModal";
import EditEventSetupModal from "@/components/accommodation/EditEventSetupModal";
import EventAllocationsModal from "@/components/accommodation/EventAllocationsModal";
import EditVendorModal from "@/components/accommodation/EditVendorModal";
import { Hotel } from "lucide-react";

interface VendorAccommodation {
  id: number;
  vendor_name: string;
  location: string;
  accommodation_type: string;
  capacity: number;
  current_occupants: number;
  event_setups?: VendorEventSetup[];
}

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

interface VendorHotelsSetupProps {
  tenantSlug: string;
}

export default function VendorHotelsSetup({ tenantSlug }: VendorHotelsSetupProps) {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();

  const [vendors, setVendors] = useState<VendorAccommodation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [eventSetupModalOpen, setEventSetupModalOpen] = useState(false);
  const [selectedVendorForSetup, setSelectedVendorForSetup] = useState<VendorAccommodation | null>(null);
  const [editSetupModalOpen, setEditSetupModalOpen] = useState(false);
  const [selectedSetupForEdit, setSelectedSetupForEdit] = useState<VendorEventSetup | null>(null);
  const [eventAllocationsModalOpen, setEventAllocationsModalOpen] = useState(false);
  const [selectedSetupForAllocations, setSelectedSetupForAllocations] = useState<VendorEventSetup | null>(null);
  const [editVendorModalOpen, setEditVendorModalOpen] = useState(false);
  const [selectedVendorForEdit, setSelectedVendorForEdit] = useState<VendorAccommodation | null>(null);

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      const token = apiClient.getToken();
      const [vendorResponse, eventsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-accommodations`, {
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

      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json();
        
        // Fetch event setups for each vendor
        const vendorsWithSetups = await Promise.all(
          vendorData.map(async (vendor: VendorAccommodation) => {
            try {
              const setupResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-event-setups/${vendor.id}`,
                {
                  headers: { 
                    Authorization: `Bearer ${token}`,
                    'X-Tenant-ID': tenantSlug
                  },
                }
              );
              if (setupResponse.ok) {
                const setups = await setupResponse.json();
                return { ...vendor, event_setups: setups };
              }
            } catch (error) {
              console.error(`Error fetching setups for vendor ${vendor.id}:`, error);
            }
            return { ...vendor, event_setups: [] };
          })
        );
        
        setVendors(vendorsWithSetups);
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

  const canEdit = Boolean(user?.role && ["super_admin", "mt_admin", "hr_admin"].includes(user.role));

  const handleSetupEventAccommodation = (vendor: VendorAccommodation) => {
    setSelectedVendorForSetup(vendor);
    setEventSetupModalOpen(true);
  };

  const handleEditSetup = (setup: VendorEventSetup) => {
    setSelectedSetupForEdit(setup);
    setEditSetupModalOpen(true);
  };

  const handleViewAllocations = (setup: VendorEventSetup) => {
    setSelectedSetupForAllocations(setup);
    setEventAllocationsModalOpen(true);
  };

  const handleEditVendor = (vendor: VendorAccommodation) => {
    setSelectedVendorForEdit(vendor);
    setEditVendorModalOpen(true);
  };

  const handleDeleteSetup = async (setup: VendorEventSetup) => {
    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Delete Event Setup?",
      text: `This will permanently delete the setup for "${setup.event?.title || setup.event_name}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-event-setup/${setup.id}`,
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
        toast({ title: "Success", description: "Event setup deleted successfully" });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
      }
    } catch (error) {
      console.error("Delete setup error:", error);
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    }
  };

  const handleDeleteVendor = async (vendor: VendorAccommodation) => {
    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Delete Vendor Hotel?",
      text: `This will permanently delete "${vendor.vendor_name}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-accommodations/${vendor.id}`,
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
        toast({ title: "Success", description: "Vendor hotel deleted successfully" });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
      }
    } catch (error) {
      console.error("Delete vendor error:", error);
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Hotel className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Loading vendor hotels...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Vendor Hotels</h2>
          <p className="text-sm text-gray-500">Manage external hotel partnerships and event setups</p>
        </div>
        <VendorManagement
          canEdit={!!canEdit}
          onVendorCreated={fetchData}
          apiClient={apiClient as { getToken: () => string }}
          tenantSlug={tenantSlug}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Hotel className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">No vendor hotels yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first vendor hotel partnership</p>
          </div>
        ) : (
          vendors.map((vendor) => (
            <VendorCard 
              key={vendor.id} 
              vendor={vendor} 
              onDelete={canEdit ? handleDeleteVendor : undefined}
              onEdit={canEdit ? handleEditVendor : undefined}
              onSetupEvent={canEdit ? handleSetupEventAccommodation : undefined}
              onEditSetup={canEdit ? handleEditSetup : undefined}
              onDeleteSetup={canEdit ? handleDeleteSetup : undefined}
              onViewAllocations={handleViewAllocations}
              canEdit={canEdit}
            />
          ))
        )}
      </div>

      {selectedVendorForSetup && (
        <EventAccommodationSetupModal
          open={eventSetupModalOpen}
          onOpenChange={(open) => {
            setEventSetupModalOpen(open);
            if (!open) {
              setSelectedVendorForSetup(null);
            }
          }}
          vendor={selectedVendorForSetup}
          events={events}
          apiClient={apiClient as { getToken: () => string }}
          tenantSlug={tenantSlug}
          onSetupComplete={fetchData}
        />
      )}

      <EditEventSetupModal
        open={editSetupModalOpen}
        onOpenChange={(open) => {
          setEditSetupModalOpen(open);
          if (!open) {
            setSelectedSetupForEdit(null);
          }
        }}
        setup={selectedSetupForEdit}
        events={events}
        apiClient={apiClient as { getToken: () => string }}
        tenantSlug={tenantSlug}
        onEditComplete={fetchData}
      />

      <EventAllocationsModal
        open={eventAllocationsModalOpen}
        onOpenChange={(open) => {
          setEventAllocationsModalOpen(open);
          if (!open) {
            setSelectedSetupForAllocations(null);
          }
        }}
        setup={selectedSetupForAllocations}
        apiClient={apiClient as { getToken: () => string }}
        tenantSlug={tenantSlug}
        events={events}
        onDeleteAllocation={() => {}}
        onCheckIn={() => {}}
        onBulkCheckIn={() => {}}
        deleting={null}
        checkingIn={null}
        bulkCheckingIn={false}
      />

      <EditVendorModal
        open={editVendorModalOpen}
        onOpenChange={(open) => {
          setEditVendorModalOpen(open);
          if (!open) {
            setSelectedVendorForEdit(null);
          }
        }}
        vendor={selectedVendorForEdit}
        apiClient={apiClient as { getToken: () => string }}
        tenantSlug={tenantSlug}
        onEditComplete={fetchData}
      />
    </>
  );
}