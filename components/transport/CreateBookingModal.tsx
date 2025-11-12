"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import { Plus, X, Package, MapPin, Calendar, Loader2 } from "lucide-react";

interface TransportVendor {
  id: number;
  name: string;
  vendor_type: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

interface Event {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  location?: string;
}

interface Participant {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  event_id: number;
}

interface CreateBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: TransportVendor[];
  onSuccess: () => void;
  editingBooking?: {
    id: number;
    booking_type: string;
    event_id?: number;
    pickup_locations: string[];
    destination: string;
    scheduled_time: string;
    vendor_type: string;
    vendor_name?: string;
    driver_name?: string;
    driver_phone?: string;
    driver_email?: string;
    vehicle_details?: string;
    special_instructions?: string;
    flight_number?: string;
    arrival_time?: string;
    has_welcome_package?: boolean;
    participant_ids?: number[];
  };
  apiClient: { getToken: () => string };
  tenantSlug: string;
}

export default function CreateBookingModal({
  open,
  onOpenChange,

  onSuccess,
  editingBooking,
  apiClient,
  tenantSlug
}: CreateBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [packageChecks, setPackageChecks] = useState<Record<number, boolean>>({});
  const [poolingSuggestion, setPoolingSuggestion] = useState<{
    existing_bookings: Array<{id: number; scheduled_time: string; arrival_time?: string; participants?: Array<{name: string}>}>;
    bookingData: {
      participant_ids: number[];
      pickup_locations: string[];
      event_id: number | null;
      arrival_time: string | null;
      scheduled_time: string;
    };
  } | null>(null);
  const [participantAccommodations, setParticipantAccommodations] = useState<Array<{id: number; name: string; address: string}>>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const [formData, setFormData] = useState({
    booking_type: "airport_pickup",
    event_id: "",
    pickup_locations: ["Airport"],
    destination: "",
    scheduled_time: "",
    vendor_type: "absolute_taxi",
    vendor_name: "",
    driver_name: "",
    driver_phone: "",
    driver_email: "",
    vehicle_details: "",
    special_instructions: "",
    flight_number: "",
    arrival_time: "",
    has_welcome_package: true
  });

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events`,
        {
          headers: { 
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch {
      console.error("Error fetching events");
    }
  }, [apiClient, tenantSlug]);

  const fetchParticipants = useCallback(async (eventId: string) => {
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
        const data = await response.json();
        setParticipants(data);
      }
    } catch {
      console.error("Error fetching participants");
    }
  }, [apiClient, tenantSlug]);

  const fetchParticipantAccommodation = useCallback(async (participantId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/participant/${participantId}/accommodation`,
        {
          headers: { 
            Authorization: `Bearer ${apiClient.getToken()}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setParticipantAccommodations(data);
        // Auto-select first accommodation if available
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, destination: data[0].address }));
        }
      }
    } catch {
      console.error("Error fetching participant accommodation");
      setParticipantAccommodations([]);
    }
  }, [apiClient, tenantSlug]);

  const fetchMultipleParticipantAccommodations = useCallback(async (participantIds: number[]) => {
    try {
      const accommodationPromises = participantIds.map(id => 
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/participant/${id}/accommodation`,
          {
            headers: { 
              Authorization: `Bearer ${apiClient.getToken()}`,
              'X-Tenant-ID': tenantSlug
            },
          }
        ).then(res => res.ok ? res.json() : [])
      );
      
      const accommodationArrays = await Promise.all(accommodationPromises);
      const allAccommodations = accommodationArrays.flat();
      
      // Remove duplicates based on address
      const uniqueAccommodations = allAccommodations.filter((acc, index, self) => 
        index === self.findIndex(a => a.address === acc.address)
      );
      
      setParticipantAccommodations(uniqueAccommodations);
      
      // Set pickup locations to accommodation addresses
      const pickupLocations = uniqueAccommodations.map(acc => acc.address);
      setFormData(prev => ({ ...prev, pickup_locations: pickupLocations.length > 0 ? pickupLocations : [''] }));
    } catch {
      console.error("Error fetching participant accommodations");
      setParticipantAccommodations([]);
    }
  }, [apiClient, tenantSlug]);

  const checkWelcomePackages = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/bookings/check-packages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
            'X-Tenant-ID': tenantSlug
          },
          body: JSON.stringify(selectedParticipants),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const checks: Record<number, boolean> = {};
        data.forEach((check: {participant_id: number; has_package: boolean}) => {
          checks[check.participant_id] = check.has_package;
        });
        setPackageChecks(checks);
      }
    } catch {
      console.error("Error checking welcome packages");
    }
  }, [selectedParticipants, apiClient, tenantSlug]);

  useEffect(() => {
    if (open) {
      fetchEvents();
      if (editingBooking) {
        // Populate form with existing booking data
        setFormData({
          booking_type: editingBooking.booking_type,
          event_id: editingBooking.event_id?.toString() || "",
          pickup_locations: editingBooking.pickup_locations,
          destination: editingBooking.destination,
          scheduled_time: new Date(editingBooking.scheduled_time).toISOString().slice(0, 16),
          vendor_type: editingBooking.vendor_type,
          vendor_name: editingBooking.vendor_name || "",
          driver_name: editingBooking.driver_name || "",
          driver_phone: editingBooking.driver_phone || "",
          driver_email: editingBooking.driver_email || "",
          vehicle_details: editingBooking.vehicle_details || "",
          special_instructions: editingBooking.special_instructions || "",
          flight_number: editingBooking.flight_number || "",
          arrival_time: editingBooking.arrival_time ? new Date(editingBooking.arrival_time).toISOString().slice(0, 16) : "",
          has_welcome_package: editingBooking.has_welcome_package ?? true
        });
        setSelectedParticipants(editingBooking.participant_ids || []);
      }
    }
  }, [open, editingBooking, fetchEvents]);

  useEffect(() => {
    if (formData.event_id) {
      fetchParticipants(formData.event_id);
    }
  }, [formData.event_id, fetchParticipants]);

  useEffect(() => {
    if (selectedParticipants.length > 0) {
      checkWelcomePackages();
      if (formData.booking_type === 'airport_pickup' && selectedParticipants.length === 1) {
        fetchParticipantAccommodation(selectedParticipants[0]);
      } else if (formData.booking_type === 'event_transfer') {
        fetchMultipleParticipantAccommodations(selectedParticipants);
      }
    } else {
      setParticipantAccommodations([]);
      setFormData(prev => ({ ...prev, destination: "" }));
    }
  }, [selectedParticipants, formData.booking_type, checkWelcomePackages, fetchParticipantAccommodation, fetchMultipleParticipantAccommodations]);

  useEffect(() => {
    if (formData.booking_type === 'event_transfer' && selectedEvent) {
      setFormData(prev => ({ ...prev, destination: selectedEvent.location || selectedEvent.title }));
    }
  }, [selectedEvent, formData.booking_type]);

  const checkPoolingOpportunities = async (bookingData: {
    pickup_locations: string[];
    scheduled_time: string;
    booking_type: string;
  }) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/bookings/suggest-pooling`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
            'X-Tenant-ID': tenantSlug
          },
          body: JSON.stringify({
            pickup_location: bookingData.pickup_locations[0],
            scheduled_time: bookingData.scheduled_time,
            time_window_minutes: 60,
            booking_type: bookingData.booking_type
          }),
        }
      );
      
      if (response.ok) {
        const poolingData = await response.json();
        if (poolingData.can_pool && poolingData.existing_bookings.length > 0) {
          return poolingData;
        }
      }
    } catch {
      console.error("Error checking pooling opportunities");
    }
    return null;
  };

  const createBookingWithPooling = async (bookingData: {
    pickup_locations: string[];
    scheduled_time: string;
    booking_type: string;
    participant_ids: number[];
  }, poolingData: {
    existing_bookings: Array<{id: number}>;
  }) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/bookings/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
            'X-Tenant-ID': tenantSlug
          },
          body: JSON.stringify({
            ...bookingData,
            pool_with_booking_ids: poolingData.existing_bookings.map((b) => b.id)
          }),
        }
      );
      
      if (response.ok) {
        toast({ title: "Success", description: "Transport booking created and pooled successfully" });
        setPoolingSuggestion(null);
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        const errorData = await response.json();
        toast({ title: "Error", description: errorData.detail || "Failed to create booking", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    }
  };

  const addPickupLocation = () => {
    setFormData({
      ...formData,
      pickup_locations: [...formData.pickup_locations, ""]
    });
  };

  const removePickupLocation = (index: number) => {
    const newLocations = formData.pickup_locations.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      pickup_locations: newLocations
    });
  };

  const updatePickupLocation = (index: number, value: string) => {
    const newLocations = [...formData.pickup_locations];
    newLocations[index] = value;
    setFormData({
      ...formData,
      pickup_locations: newLocations
    });
  };

  const handleParticipantToggle = (participantId: number) => {
    if (formData.booking_type === 'airport_pickup') {
      // For airport pickups, only allow one participant
      setSelectedParticipants(prev =>
        prev.includes(participantId) ? [] : [participantId]
      );
    } else {
      // For event transfers and other types, allow multiple participants
      setSelectedParticipants(prev =>
        prev.includes(participantId)
          ? prev.filter(id => id !== participantId)
          : [...prev, participantId]
      );
    }
  };

  const hasWelcomePackages = Object.values(packageChecks).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedParticipants.length === 0) {
      toast({ title: "Error", description: "Please select at least one participant", variant: "destructive" });
      return;
    }

    if (formData.pickup_locations.some(loc => !loc.trim())) {
      toast({ title: "Error", description: "Please fill in all pickup locations", variant: "destructive" });
      return;
    }

    if (formData.booking_type !== 'airport_pickup' && !formData.scheduled_time) {
      toast({ title: "Error", description: "Please select a scheduled time", variant: "destructive" });
      return;
    }

    if (formData.booking_type === 'event_transfer' && !formData.event_id) {
      toast({ title: "Error", description: "Please select an event for event transfer", variant: "destructive" });
      return;
    }

    if (formData.booking_type === 'airport_pickup' && !formData.arrival_time) {
      toast({ title: "Error", description: "Please select an arrival time for airport pickup", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        ...formData,
        participant_ids: selectedParticipants,
        pickup_locations: formData.pickup_locations.filter(loc => loc.trim()),
        event_id: formData.event_id ? parseInt(formData.event_id) : null,
        arrival_time: formData.arrival_time || null,
        scheduled_time: formData.booking_type === 'airport_pickup' ? (formData.arrival_time || formData.scheduled_time) : formData.scheduled_time,
      };

      // Check for pooling opportunities before creating booking (for airport pickups and event transfers)
      if (!editingBooking && (formData.booking_type === 'airport_pickup' || formData.booking_type === 'event_transfer')) {
        const poolingData = await checkPoolingOpportunities(bookingData);
        if (poolingData) {
          setPoolingSuggestion({ ...poolingData, bookingData });
          setLoading(false);
          return;
        }
      }

      const url = editingBooking 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/bookings/${editingBooking.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/bookings/`;
      
      const response = await fetch(url, {
        method: editingBooking ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
          "Content-Type": "application/json",
          'X-Tenant-ID': tenantSlug
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        toast({ title: "Success", description: `Transport booking ${editingBooking ? 'updated' : 'created'} successfully` });
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        const errorData = await response.json();
        toast({ title: "Error", description: errorData.detail || "Failed to create booking", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      booking_type: "airport_pickup",
      event_id: "",
      pickup_locations: ["Airport"],
      destination: "",
      scheduled_time: "",
      vendor_type: "absolute_taxi",
      vendor_name: "",
      driver_name: "",
      driver_phone: "",
      driver_email: "",
      vehicle_details: "",
      special_instructions: "",
      flight_number: "",
      arrival_time: "",
      has_welcome_package: true
    });
    setSelectedParticipants([]);
    setPackageChecks({});
    setParticipantAccommodations([]);
  };

  return (
    <>
    <Dialog open={open && !poolingSuggestion} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {editingBooking ? 'Edit Transport Booking' : 'Create Transport Booking'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Booking Type</Label>
            <Select value={formData.booking_type} onValueChange={(value) => setFormData({...formData, booking_type: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
                <SelectItem value="event_transfer">Event Transfer</SelectItem>
                <SelectItem value="office_visit">Office Visit</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Event Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              {formData.booking_type === 'event_transfer' ? 'Event (Required)' : 'Event (Optional)'}
            </Label>
            <Select value={formData.event_id || "none"} onValueChange={(value) => {
              const eventId = value === "none" ? "" : value;
              setFormData({...formData, event_id: eventId});
              const event = events.find(e => e.id.toString() === eventId);
              setSelectedEvent(event || null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                {formData.booking_type !== 'event_transfer' && <SelectItem value="none">No event</SelectItem>}
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Participants */}
          {participants.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Participants</Label>
              {formData.booking_type === 'airport_pickup' && (
                <div className="p-2 bg-blue-50 rounded text-xs text-blue-700 mb-2">
                  For airport pickups, select only one participant per booking
                </div>
              )}
              {formData.booking_type === 'event_transfer' && (
                <div className="p-2 bg-green-50 rounded text-xs text-green-700 mb-2">
                  For event transfers, participants will be picked up from their accommodations and taken to the event
                </div>
              )}
              <div className="max-h-40 overflow-y-auto border rounded p-3 space-y-2">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedParticipants.includes(participant.id)}
                      onCheckedChange={() => handleParticipantToggle(participant.id)}
                      disabled={formData.booking_type === 'airport_pickup' && selectedParticipants.length > 0 && !selectedParticipants.includes(participant.id)}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{participant.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{participant.email}</span>
                      {packageChecks[participant.id] && (
                        <Package className="w-4 h-4 text-orange-500 inline ml-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {hasWelcomePackages && (
                <div className="p-3 bg-orange-50 rounded text-sm">
                  <div className="flex items-center gap-2 text-orange-700">
                    <Package className="w-4 h-4" />
                    <span className="font-medium">Welcome Package Detected</span>
                  </div>
                  <p className="text-orange-600 mt-1">
                    MSF Office will be automatically added as the first pickup location for package collection.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pickup Locations */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Pickup Location</Label>
            {formData.booking_type === 'airport_pickup' ? (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <Input
                  value="Airport"
                  disabled
                  className="flex-1 bg-gray-50"
                />
              </div>
            ) : formData.booking_type === 'event_transfer' && participantAccommodations.length > 0 ? (
              <>
                <div className="text-xs text-gray-500 mb-2">Participant accommodations (auto-populated)</div>
                {formData.pickup_locations.map((location, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <Input
                      value={location}
                      disabled
                      className="flex-1 bg-gray-50"
                    />
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Multiple locations allowed</span>
                  <Button type="button" variant="outline" size="sm" onClick={addPickupLocation}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Location
                  </Button>
                </div>
                {formData.pickup_locations.map((location, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <Input
                      value={location}
                      onChange={(e) => updatePickupLocation(index, e.target.value)}
                      placeholder={`Pickup location ${index + 1}`}
                      className="flex-1"
                    />
                    {formData.pickup_locations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePickupLocation(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Destination</Label>
            {formData.booking_type === 'airport_pickup' && participantAccommodations.length > 0 ? (
              <Select value={formData.destination} onValueChange={(value) => setFormData({...formData, destination: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select accommodation" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  {participantAccommodations.map((accommodation, index) => (
                    <SelectItem key={`${accommodation.id || index}-${accommodation.address}`} value={accommodation.address}>
                      {accommodation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : formData.booking_type === 'event_transfer' && selectedEvent ? (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <Input
                  value={selectedEvent.location || selectedEvent.title}
                  disabled
                  className="flex-1 bg-gray-50"
                />
              </div>
            ) : (
              <Input
                value={formData.destination}
                onChange={(e) => setFormData({...formData, destination: e.target.value})}
                placeholder="Final destination"
                required
              />
            )}
          </div>

          {/* Scheduled Time - Hidden for airport pickup */}
          {formData.booking_type !== 'airport_pickup' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Scheduled Time</Label>
              <Input
                type="datetime-local"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                required
              />
            </div>
          )}

          {/* Flight Details (for airport pickup) */}
          {formData.booking_type === 'airport_pickup' && (
            <>
              <div className="p-3 bg-blue-50 rounded text-sm text-blue-700">
                For airport pickups, the arrival time will be used to schedule the pickup.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Flight Number</Label>
                  <Input
                    value={formData.flight_number}
                    onChange={(e) => setFormData({...formData, flight_number: e.target.value})}
                    placeholder="e.g., KQ100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Arrival Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.arrival_time}
                    onChange={(e) => setFormData({...formData, arrival_time: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              {/* Welcome Package Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.has_welcome_package}
                  onCheckedChange={(checked) => setFormData({...formData, has_welcome_package: !!checked})}
                />
                <Label className="text-sm font-medium text-gray-700">Includes Welcome Package</Label>
              </div>
            </>
          )}

          {/* Vendor Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Vendor Type</Label>
              <Select value={formData.vendor_type} onValueChange={(value) => setFormData({...formData, vendor_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="absolute_taxi">Absolute Taxi (API)</SelectItem>
                  <SelectItem value="manual_vendor">Manual Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Driver Name</Label>
                <Input
                  value={formData.driver_name}
                  onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                  placeholder="Driver name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Driver Phone</Label>
                <Input
                  value={formData.driver_phone}
                  onChange={(e) => setFormData({...formData, driver_phone: e.target.value})}
                  placeholder="Driver phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Vehicle Details</Label>
              <Input
                value={formData.vehicle_details}
                onChange={(e) => setFormData({...formData, vehicle_details: e.target.value})}
                placeholder="Vehicle make, model, color, plate number"
              />
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Special Instructions</Label>
            <Textarea
              value={formData.special_instructions}
              onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
              placeholder="Any special instructions for the driver"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4 mr-2" />
              )}
              {loading ? (editingBooking ? "Updating..." : "Creating...") : (editingBooking ? "Update Booking" : "Create Booking")}
            </Button>
          </div>
        </form>
      </DialogContent>
      
    </Dialog>
    
    {/* Pooling Suggestion Modal */}
    <Dialog open={!!poolingSuggestion} onOpenChange={(open) => !open && setPoolingSuggestion(null)}>
      <DialogContent className="bg-white border border-gray-200 shadow-lg max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Similar Booking Found</DialogTitle>
        </DialogHeader>
        
        {poolingSuggestion && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              We found {poolingSuggestion.existing_bookings?.length || 0} existing airport pickup(s) around the same time. Would you like to merge this booking with the existing one(s)?
            </p>
            
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm font-medium text-blue-900">Existing bookings:</div>
              {poolingSuggestion.existing_bookings?.map((booking, index: number) => (
                <div key={index} className="text-xs text-blue-700 mt-1">
                  {new Date(booking.scheduled_time || booking.arrival_time || new Date()).toLocaleString()} - {booking.participants?.map((p) => p.name).join(", ") || 'Unknown participant'}
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-green-50 rounded text-sm text-green-700">
              <strong>Benefits of pooling:</strong> Shared transport costs, reduced environmental impact, and better coordination.
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => createBookingWithPooling(poolingSuggestion.bookingData, poolingSuggestion)}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Yes, Merge Bookings
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  setPoolingSuggestion(null);
                  // Create booking separately
                  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/bookings/`;
                  const response = await fetch(url, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${apiClient.getToken()}`,
                      "Content-Type": "application/json",
                      'X-Tenant-ID': tenantSlug
                    },
                    body: JSON.stringify(poolingSuggestion.bookingData),
                  });
                  if (response.ok) {
                    toast({ title: "Success", description: "Transport booking created successfully" });
                    onSuccess();
                    onOpenChange(false);
                    resetForm();
                  }
                }}
                className="flex-1"
                disabled={loading}
              >
                Create Separate
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}