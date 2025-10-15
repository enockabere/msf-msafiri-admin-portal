"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import AllocationModal from "@/components/accommodation/AllocationModal";
import GuestHouseCard from "@/components/accommodation/GuestHouseCard";
import VendorCard from "@/components/accommodation/VendorCard";
import AllocationsList from "@/components/accommodation/AllocationsList";
import GuesthouseManagement from "@/components/accommodation/GuesthouseManagement";
import VendorManagement from "@/components/accommodation/VendorManagement";
import RoomsView from "@/components/accommodation/RoomsView";
import { Hotel, Building2, Users } from "lucide-react";

interface GuestHouse {
  id: number;
  name: string;
  location?: string;
  description?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  total_rooms: number;
  occupied_rooms?: number;
  total_capacity?: number;
  current_occupants?: number;
  available_rooms?: number;
  is_active?: boolean;
}

interface VendorAccommodation {
  id: number;
  vendor_name: string;
  location: string;
  accommodation_type: string;
  capacity: number;
  current_occupants: number;
}

interface Room {
  id: number;
  guesthouse_id: number;
  room_number: string;
  capacity: number;
  room_type: string;
  current_occupants: number;
  is_active?: boolean;
  is_occupied?: boolean;
  occupantInfo?: {
    occupant_genders: string[];
    can_accept_gender: {
      male: boolean;
      female: boolean;
      other: boolean;
    };
  } | null;
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
  accommodation_type: "guesthouse" | "vendor";
  room_id: string;
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
  const activeTab = searchParams.get('tab') || 'guesthouses';

  const [guesthouses, setGuesthouses] = useState<GuestHouse[]>([]);
  const [vendors, setVendors] = useState<VendorAccommodation[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedGuesthouse, setSelectedGuesthouse] = useState<GuestHouse | null>(null);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [bulkCheckingIn, setBulkCheckingIn] = useState(false);

  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  

  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [availableRoomsForGuesthouse, setAvailableRoomsForGuesthouse] = useState<Room[]>([]);
  const [selectedGuesthouses, setSelectedGuesthouses] = useState<number[]>([]);
  const [preSelectedGuesthouse, setPreSelectedGuesthouse] = useState<GuestHouse | null>(null);
  const [allocatedParticipants, setAllocatedParticipants] = useState<number[]>([]);

  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [allocationForm, setAllocationForm] = useState<AllocationForm>({
    event_id: "",
    participant_ids: [],
    check_in_date: "",
    check_out_date: "",
    accommodation_type: "guesthouse",
    room_id: "",
    vendor_accommodation_id: "",
    room_type: undefined,
  });
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);

  const fetchRoomsForGuesthouses = async (guesthouseIds: number[]) => {
    if (guesthouseIds.length === 0) {
      setAvailableRoomsForGuesthouse([]);
      return;
    }
    
    try {
      const roomPromises = guesthouseIds.map(id => 
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/guesthouses/${id}/rooms`,
          {
            headers: { 
              Authorization: `Bearer ${apiClient.getToken()}`,
              'X-Tenant-ID': tenantSlug
            },
          }
        ).then(res => res.ok ? res.json() : [])
      );
      
      const roomArrays = await Promise.all(roomPromises);
      const allRooms = roomArrays.flat();
      
      // Get room occupant details for gender validation
      const roomsWithOccupants = await Promise.all(
        allRooms.map(async (room) => {
          if (room.current_occupants > 0) {
            try {
              const occupantResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/rooms/${room.id}/occupants`,
                {
                  headers: { 
                    Authorization: `Bearer ${apiClient.getToken()}`,
                    'X-Tenant-ID': tenantSlug
                  },
                }
              );
              if (occupantResponse.ok) {
                const occupantData = await occupantResponse.json();
                return { ...room, occupantInfo: occupantData };
              }
            } catch (error) {
              console.error(`Error fetching occupants for room ${room.id}:`, error);
            }
          }
          return { ...room, occupantInfo: null };
        })
      );
      
      const availableRooms = roomsWithOccupants.filter((room) => room.current_occupants < room.capacity);
      setAvailableRoomsForGuesthouse(availableRooms);
    } catch (error) {
      console.error("Error fetching rooms for guesthouses:", error);
    }
  };

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

    try {
      const token = apiClient.getToken();
      const [ghResponse, vendorResponse, allocationsResponse, eventsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/guesthouses`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': tenantSlug
          },
        }),
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

      let ghData: GuestHouse[] = [];
      
      if (ghResponse.ok) {
        ghData = await ghResponse.json();
        setGuesthouses(ghData);
      }

      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json();
        setVendors(vendorData);
      }

      if (allocationsResponse.ok) {
        const allocationsData = await allocationsResponse.json();

        setAllocations(allocationsData);
      }

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      }

      // Fetch all rooms for each guesthouse to calculate real stats
      if (ghData.length > 0) {
        const allRoomsPromises = ghData.map((gh) => 
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/guesthouses/${gh.id}/rooms`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'X-Tenant-ID': tenantSlug
            },
          }).then(res => res.ok ? res.json() : [])
        );
        
        const allRoomsArrays = await Promise.all(allRoomsPromises);
        const allRoomsFlat = allRoomsArrays.flat();
        
        // Update guesthouses with real stats
        const updatedGuesthouses = ghData.map(gh => {
          const guesthouseRooms = allRoomsFlat.filter((room) => room.guesthouse_id === gh.id);
          const totalRooms = guesthouseRooms.length;
          const totalCapacity = guesthouseRooms.reduce((sum, room) => sum + room.capacity, 0);
          const currentOccupants = guesthouseRooms.reduce((sum, room) => sum + room.current_occupants, 0);
          const availableRooms = guesthouseRooms.filter((room) => room.current_occupants < room.capacity).length;
          
          return {
            ...gh,
            total_rooms: totalRooms,
            total_capacity: totalCapacity,
            current_occupants: currentOccupants,
            available_rooms: availableRooms
          };
        });
        
        setGuesthouses(updatedGuesthouses);
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

  const handleBookGuesthouse = async (guesthouse: GuestHouse) => {
    setPreSelectedGuesthouse(guesthouse);
    setSelectedGuesthouses([guesthouse.id]);
    setAllocationForm({
      ...allocationForm,
      accommodation_type: "guesthouse",
      room_id: "",
      vendor_accommodation_id: "",
      room_type: undefined,
    });
    setSelectedRooms([]);
    await fetchRoomsForGuesthouses([guesthouse.id]);
    setAllocationModalOpen(true);
  };

  const handleViewRooms = async (guesthouse: GuestHouse) => {
    setSelectedGuesthouse(guesthouse);
    await fetchRooms(guesthouse.id);
  };

  const fetchRooms = async (guesthouseId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/guesthouses/${guesthouseId}/rooms`,
        {
          headers: { 
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );
      if (response.ok) {
        const roomData = await response.json();
        setRooms(roomData);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

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
      room_id: "",
      room_type: undefined,
    });
    setAllocationModalOpen(true);
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

  const toggleRoomSelection = (roomId: number) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const toggleGuesthouseSelection = (guesthouseId: number) => {
    const newSelection = selectedGuesthouses.includes(guesthouseId)
      ? selectedGuesthouses.filter(id => id !== guesthouseId)
      : [...selectedGuesthouses, guesthouseId];
    
    setSelectedGuesthouses(newSelection);
    
    // Clear selected rooms when guesthouse selection changes
    setSelectedRooms([]);
    
    // Fetch rooms for selected guesthouses
    fetchRoomsForGuesthouses(newSelection);
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
    
    if (allocationForm.accommodation_type === "guesthouse") {
      if (selectedGuesthouses.length === 0) {
        toast({ title: "Error", description: "Please select at least one guesthouse", variant: "destructive" });
        return;
      }
      
      if (selectedRooms.length === 0) {
        toast({ title: "Error", description: "Please select at least one room", variant: "destructive" });
        return;
      }
      
      const totalCapacity = selectedRooms.reduce((sum, roomId) => {
        const room = availableRoomsForGuesthouse.find(r => r.id === roomId);
        return sum + (room ? room.capacity - room.current_occupants : 0);
      }, 0);
      
      if (selectedParticipants.length > totalCapacity) {
        toast({ title: "Error", description: `Selected rooms can only accommodate ${totalCapacity} people`, variant: "destructive" });
        return;
      }
    }
    
    if (selectedParticipants.length === 0) {
      toast({ title: "Error", description: "Please select at least one participant", variant: "destructive" });
      return;
    }
    
    // Validate vendor accommodation requirements
    if (allocationForm.accommodation_type === "vendor") {
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
    
    // Validate gender compatibility for guesthouse allocations
    if (allocationForm.accommodation_type === "guesthouse") {
      const selectedParticipantGenders = selectedParticipants.map(participantId => {
        const participant = participants.find(p => p.id === participantId);
        return participant?.gender;
      }).filter(Boolean);
      
      const uniqueGenders = [...new Set(selectedParticipantGenders)];
      
      // Check if trying to mix genders
      if (uniqueGenders.length > 1) {
        toast({ 
          title: "Error", 
          description: "Cannot allocate participants of different genders to the same rooms. Please select participants of the same gender.", 
          variant: "destructive" 
        });
        return;
      }
      
      // Check if "other" gender users are selected with multi-capacity rooms
      if (uniqueGenders.includes('other')) {
        const multiCapacityRooms = selectedRooms.filter(roomId => {
          const room = availableRoomsForGuesthouse.find(r => r.id === roomId);
          return room && room.capacity > 1;
        });
        
        if (multiCapacityRooms.length > 0 && selectedParticipants.length > 1) {
          toast({ 
            title: "Error", 
            description: "Participants with 'Other' gender cannot share rooms. Please select single occupancy rooms or use vendor hotels.", 
            variant: "destructive" 
          });
          return;
        }
      }
    }
    

    
    setSubmitting(true);
    try {
      if (allocationForm.accommodation_type === "guesthouse") {
        // Distribute participants across selected rooms
        const remainingParticipants = [...selectedParticipants];
        const allocations = [];
        
        for (const roomId of selectedRooms) {
          if (remainingParticipants.length === 0) break;
          
          const room = availableRoomsForGuesthouse.find(r => r.id === roomId);
          if (!room) continue;
          
          const availableSpaces = room.capacity - room.current_occupants;
          const participantsForThisRoom = remainingParticipants.splice(0, availableSpaces);
          
          if (participantsForThisRoom.length > 0) {
            for (const participantId of participantsForThisRoom) {
              const participant = participants.find(p => p.id === participantId);
              if (participant) {
                allocations.push({
                  accommodation_type: "guesthouse",
                  room_id: roomId,
                  vendor_accommodation_id: null,
                  guest_name: participant.full_name || participant.name || `Participant ${participantId}`,
                  guest_email: participant.email,
                  guest_phone: participant.phone || "",
                  check_in_date: allocationForm.check_in_date,
                  check_out_date: allocationForm.check_out_date,
                  number_of_guests: 1,
                  participant_id: participantId,
                  event_id: parseInt(allocationForm.event_id)
                });
              }
            }
          }
        }
        
        for (const allocation of allocations) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/room-allocations`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiClient.getToken()}`,
                "Content-Type": "application/json",
                'X-Tenant-ID': tenantSlug
              },
              body: JSON.stringify(allocation),
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
            throw new Error(errorData.detail || JSON.stringify(errorData));
          }
        }
      } else {
        // Handle vendor allocations - send all participants in one request
        const payload = {
          accommodation_type: "vendor",
          room_id: null,
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
        accommodation_type: "guesthouse",
        room_id: "",
        vendor_accommodation_id: "",
        room_type: undefined,
      });
      setSelectedParticipants([]);
      setSelectedGuesthouses([]);
      setSelectedRooms([]);
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Accommodation Management</h1>
            <p className="text-sm text-gray-600">Manage properties, rooms, and visitor allocations</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <div className="text-sm font-medium text-blue-900">{guesthouses.length}</div>
              <div className="text-xs text-blue-600">Guesthouses</div>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg">
              <div className="text-sm font-medium text-green-900">{vendors.length}</div>
              <div className="text-xs text-green-600">Vendor Hotels</div>
            </div>
            <div className="bg-purple-50 px-4 py-2 rounded-lg">
              <div className="text-sm font-medium text-purple-900">{allocations.length}</div>
              <div className="text-xs text-purple-600">Active Bookings</div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          const newSearchParams = new URLSearchParams(searchParams.toString());
          newSearchParams.set('tab', value);
          router.push(`?${newSearchParams.toString()}`, { scroll: false });
        }} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="guesthouses" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Guesthouses</span>
              <span className="sm:hidden">Houses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="vendors" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Hotel className="w-4 h-4" />
              <span className="hidden sm:inline">Vendor Hotels</span>
              <span className="sm:hidden">Hotels</span>
            </TabsTrigger>
            <TabsTrigger 
              value="allocations" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Visitor Allocations</span>
              <span className="sm:hidden">Visitors</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guesthouses" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-medium text-gray-900">Guesthouses</h2>
                <p className="text-sm text-gray-500">Manage your accommodation properties</p>
              </div>
              <GuesthouseManagement 
                canEdit={!!canEdit} 
                onGuesthouseCreated={fetchDataCallback} 
                apiClient={apiClient as { getToken: () => string }} 
                tenantSlug={tenantSlug} 
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600 mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-medium text-gray-900">Loading accommodation data...</p>
                    <div className="flex justify-center space-x-1">
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {guesthouses.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <Hotel className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">No guesthouses yet</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first accommodation property</p>
                  </div>
                ) : (
                  guesthouses.map((guesthouse) => (
                    <GuestHouseCard 
                      key={guesthouse.id} 
                      guesthouse={guesthouse as unknown as Parameters<typeof GuestHouseCard>[0]['guesthouse']} 
                      onBook={handleBookGuesthouse}
                      onViewRooms={handleViewRooms}
                    />
                  ))
                )}
              </div>
            )}

            {selectedGuesthouse && (
              <RoomsView 
                selectedGuesthouse={selectedGuesthouse}
                rooms={rooms as unknown as Parameters<typeof RoomsView>[0]['rooms']}
                canEdit={canEdit}
                onRoomCreated={() => {
                  fetchRooms(selectedGuesthouse.id);
                  fetchData();
                }}
                apiClient={apiClient as { getToken: () => string }}
                tenantSlug={tenantSlug}
              />
            )}
          </TabsContent>

          <TabsContent value="vendors" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-medium text-gray-900">Vendor Hotels</h2>
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
                    canEdit={canEdit}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="allocations" className="space-y-6">
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
          </TabsContent>
        </Tabs>

        <AllocationModal
          open={allocationModalOpen}
          onOpenChange={(open) => {
            setAllocationModalOpen(open);
            if (!open) {
              setPreSelectedGuesthouse(null);
            }
          }}
          form={allocationForm}
          onFormChange={setAllocationForm}
          onSubmit={handleAllocationSubmit}
          submitting={submitting}
          availableRooms={availableRoomsForGuesthouse}
          selectedRooms={selectedRooms}
          onRoomToggle={toggleRoomSelection}
          vendors={vendors}
          guesthouses={guesthouses}
          preSelectedGuesthouse={preSelectedGuesthouse}
          events={events}
          participants={participants}
          onEventChange={async (eventId) => {
            setAllocationForm({ ...allocationForm, event_id: eventId, participant_ids: [] });
            setSelectedParticipants([]);
            if (!preSelectedGuesthouse) {
              setSelectedGuesthouses([]);
            }
            setSelectedRooms([]);
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
          selectedGuesthouses={selectedGuesthouses}
          onGuesthouseToggle={toggleGuesthouseSelection}
          fetchRoomsForGuesthouses={fetchRoomsForGuesthouses}
          allocatedParticipants={allocatedParticipants}
        />
      </div>
    </DashboardLayout>
  );
}