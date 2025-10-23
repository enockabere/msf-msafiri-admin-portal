"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import AllocationModal from "@/components/accommodation/AllocationModal";
import VendorCard from "@/components/accommodation/VendorCard";
import AllocationsList from "@/components/accommodation/AllocationsList";
import VendorManagement from "@/components/accommodation/VendorManagement";
import EventAccommodationSetupModal from "@/components/accommodation/EventAccommodationSetupModal";
import EditEventSetupModal from "@/components/accommodation/EditEventSetupModal";
import EventAllocationsModal from "@/components/accommodation/EventAllocationsModal";
import EditVendorModal from "@/components/accommodation/EditVendorModal";
import { Hotel, Users } from "lucide-react";



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
  room_type?: string; // single, double - for vendor accommodations

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

interface Participant {
  id: number;
  name: string;
  full_name?: string;
  email: string;
  phone?: string;
  role: string;
  event_id: number;
  gender?: string;
  accommodationNeeds?: string;
}

interface AllocationForm {
  event_id: string;
  participant_ids: string[];
  check_in_date: string;
  check_out_date: string;
  accommodation_type: "vendor";
  vendor_accommodation_id: string;
  room_type?: "single" | "double";
}

export default function AccommodationPage() {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = params.slug as string;
  const activeTab = searchParams.get('tab') || 'vendors';


  const [vendors, setVendors] = useState<VendorAccommodation[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [bulkCheckingIn, setBulkCheckingIn] = useState(false);

  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [eventSetupModalOpen, setEventSetupModalOpen] = useState(false);
  const [selectedVendorForSetup, setSelectedVendorForSetup] = useState<VendorAccommodation | null>(null);
  const [editSetupModalOpen, setEditSetupModalOpen] = useState(false);
  const [selectedSetupForEdit, setSelectedSetupForEdit] = useState<VendorEventSetup | null>(null);
  const [eventAllocationsModalOpen, setEventAllocationsModalOpen] = useState(false);
  const [selectedSetupForAllocations, setSelectedSetupForAllocations] = useState<VendorEventSetup | null>(null);
  const [editVendorModalOpen, setEditVendorModalOpen] = useState(false);
  const [selectedVendorForEdit, setSelectedVendorForEdit] = useState<VendorAccommodation | null>(null);
  


  const [allocatedParticipants, setAllocatedParticipants] = useState<number[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [allocationForm, setAllocationForm] = useState<AllocationForm>({
    event_id: "",
    participant_ids: [],
    check_in_date: "",
    check_out_date: "",
    accommodation_type: "vendor",
    vendor_accommodation_id: "",
    room_type: undefined,
  });
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);



  const fetchAllocatedParticipants = async (eventId: string) => {
    if (!eventId) {
      setAllocatedParticipants([]);
      return;
    }
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/available-participants?event_id=${eventId}&accommodation_type=vendor`,
        {
          headers: { 
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );
      if (response.ok) {
        const availableParticipants = await response.json();
        // Get all participants for this event
        const allParticipantsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/participants`,
          {
            headers: { 
              Authorization: `Bearer ${apiClient.getToken()}`,
              'X-Tenant-ID': tenantSlug
            },
          }
        );
        
        if (allParticipantsResponse.ok) {
          const allParticipants = await allParticipantsResponse.json();
          const availableIds = availableParticipants.map((p: any) => p.id);
          const allocatedIds = allParticipants
            .filter((p: any) => !availableIds.includes(p.id))
            .map((p: any) => p.id);
          setAllocatedParticipants(allocatedIds);
        }
      }
    } catch (error) {
      console.error("Error fetching allocated participants:", error);
    }
  };

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;

    console.log('🏨 DEBUG: ===== FETCHDATA CALLED =====');
    console.log('🏨 DEBUG: User:', user.email, 'Tenant:', tenantSlug);

    try {
      const token = apiClient.getToken();
      console.log('🏨 DEBUG: Making API calls...');
      const [vendorResponse, allocationsResponse, eventsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-accommodations`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': tenantSlug
          },
        }),
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



      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json();
        console.log('🏨 DEBUG: Vendor data received:', vendorData.length, 'vendors');
        
        // Fetch event setups for each vendor
        const vendorsWithSetups = await Promise.all(
          vendorData.map(async (vendor: VendorAccommodation) => {
            try {
              console.log(`🏨 DEBUG: Fetching setups for vendor ${vendor.id} (${vendor.vendor_name})`);
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
                console.log(`🏨 DEBUG: Setups for vendor ${vendor.id}:`, setups.length, 'setups');
                return { ...vendor, event_setups: setups };
              } else {
                console.error(`🏨 DEBUG: Failed to fetch setups for vendor ${vendor.id}:`, setupResponse.status);
              }
            } catch (error) {
              console.error(`🏨 DEBUG: Error fetching setups for vendor ${vendor.id}:`, error);
            }
            return { ...vendor, event_setups: [] };
          })
        );
        
        console.log('🏨 DEBUG: Final vendors with setups:', vendorsWithSetups);
        setVendors(vendorsWithSetups);
      } else {
        console.error('🏨 DEBUG: Failed to fetch vendors:', vendorResponse.status);
      }

      if (allocationsResponse.ok) {
        const allocationsData = await allocationsResponse.json();
        // Filter out cancelled bookings from display
        const activeAllocations = allocationsData.filter((allocation: Allocation) => allocation.status !== 'cancelled');
        console.log('🏨 Fetched allocations:', allocationsData.length, 'total,', activeAllocations.length, 'active');
        setAllocations(activeAllocations);
      } else {
        console.error('❌ Failed to fetch allocations:', allocationsResponse.status, allocationsResponse.statusText);
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



  const fetchParticipants = async (eventId: string) => {
    if (!eventId) {
      setParticipants([]);
      return;
    }
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/participants`,
        {
          headers: { 
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );
      if (response.ok) {
        const participantData = await response.json();
        // Map to ensure consistent field names
        const participants = participantData.map((participant: any) => ({
          id: participant.id,
          name: participant.full_name,
          full_name: participant.full_name,
          email: participant.email,
          role: participant.role,
          event_id: participant.event_id,
          gender: participant.gender,
          accommodationNeeds: participant.accommodation_needs
        }));
        
        console.log('🎯 Event ID:', eventId);
        console.log('📊 Raw participant data from API:', participantData);
        console.log('🔍 Processed participants with registration data:', participants);
        
        // Debug each participant's gender
        participants.forEach(p => {
          console.log(`👤 ${p.name} (${p.email}): gender=${p.gender}, accommodationNeeds=${p.accommodationNeeds}`);
        });
        setParticipants(participants);
        // Also fetch allocated participants for this event
        await fetchAllocatedParticipants(eventId);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  const canEdit = Boolean(user?.role && ["super_admin", "mt_admin", "hr_admin"].includes(user.role));

  const handleBookVendor = (vendor: VendorAccommodation) => {
    setAllocationForm({
      ...allocationForm,
      accommodation_type: "vendor",
      vendor_accommodation_id: vendor.id.toString(),
      room_type: undefined,
    });
    setAllocationModalOpen(true);
  };

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



  const handleAllocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(allocationForm.check_in_date);
    const checkOutDate = new Date(allocationForm.check_out_date);
    
    if (checkInDate < today) {
      toast({ title: "Error", description: "Check-in date cannot be in the past", variant: "destructive" });
      return;
    }
    
    if (checkOutDate <= checkInDate) {
      toast({ title: "Error", description: "Check-out date must be after check-in date", variant: "destructive" });
      return;
    }
    

    
    if (selectedParticipants.length === 0) {
      toast({ title: "Error", description: "Please select at least one participant", variant: "destructive" });
      return;
    }
    
    // Validate vendor accommodation requirements
    if (!allocationForm.vendor_accommodation_id) {
      toast({ title: "Error", description: "Please select a vendor hotel", variant: "destructive" });
      return;
    }
    
    if (!allocationForm.room_type) {
      toast({ title: "Error", description: "Please select a room type", variant: "destructive" });
      return;
    }
    
    // Validate double room capacity and gender compatibility
    if (allocationForm.room_type === "double") {
      if (selectedParticipants.length > 2) {
        toast({ title: "Error", description: "Double rooms can accommodate maximum 2 participants", variant: "destructive" });
        return;
      }
      
      if (selectedParticipants.length === 2) {
        const selectedGenders = selectedParticipants.map(participantId => {
          const participant = participants.find(p => p.id === participantId);
          return participant?.gender;
        }).filter(Boolean);
        
        const uniqueGenders = [...new Set(selectedGenders)];
        if (uniqueGenders.length > 1 || uniqueGenders.includes('other')) {
          toast({ 
            title: "Error", 
            description: "Double room sharing requires same gender (male/female only). Selected participants have different genders or include non-binary gender.", 
            variant: "destructive" 
          });
          return;
        }
      }
    }
    
    // Validate participants have gender information
    const participantsWithoutGender = selectedParticipants.filter(participantId => {
      const participant = participants.find(p => p.id === participantId);
      return !participant?.gender;
    });
    
    if (participantsWithoutGender.length > 0) {
      const participantNames = participantsWithoutGender.map(id => {
        const participant = participants.find(p => p.id === id);
        return participant?.name || 'Unknown';
      }).join(', ');
      toast({ 
        title: "Error", 
        description: `Cannot book accommodation for participants without gender information: ${participantNames}. Please ask them to update their profiles.`, 
        variant: "destructive" 
      });
      return;
    }
    

    

    
    setSubmitting(true);
    try {
      // Handle vendor allocations - send all participants in one request
      const payload = {
        accommodation_type: "vendor",
        vendor_accommodation_id: parseInt(allocationForm.vendor_accommodation_id),
        room_type: allocationForm.room_type,
        participant_ids: selectedParticipants,
        check_in_date: allocationForm.check_in_date,
        check_out_date: allocationForm.check_out_date,
        number_of_guests: selectedParticipants.length,
        event_id: parseInt(allocationForm.event_id)
      };
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-allocations`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
            'X-Tenant-ID': tenantSlug
          },
          body: JSON.stringify(payload),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail);
      }

      // Refresh data and update allocated participants list
      await fetchData();
      if (allocationForm.event_id) {
        await fetchAllocatedParticipants(allocationForm.event_id);
      }
      
      setAllocationModalOpen(false);
      setSelectedRooms([]);
      setAllocationForm({
        event_id: "",
        participant_ids: [],
        check_in_date: "",
        check_out_date: "",
        accommodation_type: "vendor",
        vendor_accommodation_id: "",
        room_type: undefined,
      });
      setSelectedParticipants([]);
      toast({ title: "Success", description: "Visitor(s) allocated successfully" });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Network error occurred", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

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
        {/* Header Section */}
        <div className="bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Accommodation Management</h1>
              <p className="text-sm text-gray-600">Manage properties, rooms, and visitor allocations</p>
            </div>
            <div className="flex items-center gap-3">

              <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                <div className="text-xl font-semibold text-orange-900">{vendors.length}</div>
                <div className="text-xs font-normal text-orange-600">Vendor Hotels</div>
              </div>
              <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                <div className="text-xl font-semibold text-purple-900">{allocations.length}</div>
                <div className="text-xs font-normal text-purple-600">Active Bookings</div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          setTabLoading(true);
          const newSearchParams = new URLSearchParams(searchParams.toString());
          newSearchParams.set('tab', value);
          router.push(`?${newSearchParams.toString()}`, { scroll: false });
          setTimeout(() => setTabLoading(false), 300);
        }} className="space-y-6">
          <TabsList className="inline-flex h-auto items-center justify-center rounded-xl bg-transparent p-0 gap-2">

            <TabsTrigger
              value="vendors"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-6 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border-2 data-[state=inactive]:border-gray-200 hover:bg-gray-50"
            >
              <Hotel className="w-4 h-4" />
              <span className="hidden sm:inline">Vendor Hotels</span>
              <span className="sm:hidden">Hotels</span>
            </TabsTrigger>
            <TabsTrigger
              value="allocations"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-6 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border-2 data-[state=inactive]:border-gray-200 hover:bg-gray-50"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Visitor Allocations</span>
              <span className="sm:hidden">Visitors</span>
            </TabsTrigger>
          </TabsList>



          <TabsContent value="vendors" className="space-y-6">
            {tabLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Hotel className="w-8 h-8 text-orange-600 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Loading vendor hotels...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Vendor Hotels</h2>
                    <p className="text-sm text-gray-500">Manage external hotel partnerships</p>
                  </div>
                  <VendorManagement
                    canEdit={!!canEdit}
                    onVendorCreated={fetchDataCallback}
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
                    onBook={handleBookVendor}
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
              </>
            )}
          </TabsContent>

          <TabsContent value="allocations" className="space-y-6">
            {tabLoading ? (
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
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Visitor Allocations</h2>
                    <p className="text-sm text-gray-500">View automatically booked accommodations</p>
                  </div>

                </div>
                <AllocationsList 
              allocations={allocations as Allocation[]} 
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
              </>
            )}
          </TabsContent>
        </Tabs>

        <AllocationModal
          open={allocationModalOpen}
          onOpenChange={(open) => {
            setAllocationModalOpen(open);

          }}
          form={allocationForm}
          onFormChange={setAllocationForm}
          onSubmit={handleAllocationSubmit}
          submitting={submitting}
          vendors={vendors}
          events={events}
          participants={participants}
          onEventChange={async (eventId) => {
            setAllocationForm({ ...allocationForm, event_id: eventId, participant_ids: [] });
            setSelectedParticipants([]);
            await fetchParticipants(eventId);
            await fetchAllocatedParticipants(eventId);
          }}
          selectedParticipants={selectedParticipants}
          onParticipantToggle={(participantId) => {
            setSelectedParticipants(prev => 
              prev.includes(participantId)
                ? prev.filter(id => id !== participantId)
                : [...prev, participantId]
            );
          }}
          allocatedParticipants={allocatedParticipants}
        />

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
            onSetupComplete={fetchDataCallback}
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
          onEditComplete={fetchDataCallback}
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
          onDeleteAllocation={(id) => {
            const allocation = allocations.find(a => a.id === id);
            if (allocation) handleDeleteAllocation(allocation);
          }}
          onCheckIn={handleCheckIn}
          onBulkCheckIn={handleBulkCheckIn}
          deleting={deleting}
          checkingIn={checkingIn}
          bulkCheckingIn={bulkCheckingIn}
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
          onEditComplete={fetchDataCallback}
        />
      </div>
    </DashboardLayout>
  );
}