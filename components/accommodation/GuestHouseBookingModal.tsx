"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { CalendarIcon, Home, User, Loader2, Save, Search } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReactSelect from "react-select";

interface Event {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
}

interface GuestHouse {
  id: number;
  name: string;
  location: string;
  rooms: Array<{
    id: number;
    room_number: string;
    capacity: number;
    is_active: boolean;
    current_occupants?: number;
    occupant_genders?: string[];
  }>;
}

interface ConfirmedGuest {
  name: string;
  email: string;
  phone: string;
  event: string;
  display_text: string;
  gender?: string;
}

interface GuestHouseBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  apiClient: any;
  tenantSlug: string;
  events: Event[];
}

export default function GuestHouseBookingModal({
  open,
  onOpenChange,
  onSuccess,
  apiClient,
  tenantSlug,
  events
}: GuestHouseBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [guestHouses, setGuestHouses] = useState<GuestHouse[]>([]);
  const [confirmedGuests, setConfirmedGuests] = useState<ConfirmedGuest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<ConfirmedGuest | null>(null);
  const [formData, setFormData] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    event_id: "",
    guest_house_id: "",
    room_id: "",
    check_in_date: undefined as Date | undefined,
    check_out_date: undefined as Date | undefined,
    number_of_guests: 1
  });

  // Filter events to show only those within 1 month after end date
  const availableEvents = events.filter(event => {
    const eventEndDate = new Date(event.end_date);
    const oneMonthAfterEnd = new Date(eventEndDate);
    oneMonthAfterEnd.setMonth(oneMonthAfterEnd.getMonth() + 1);
    const now = new Date();
    
    return now <= oneMonthAfterEnd;
  });

  const fetchGuestHouses = async () => {
    try {
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/guest-houses/?tenant_context=${tenantSlug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGuestHouses(data.filter((gh: GuestHouse) => gh.rooms.some(r => r.is_active)));
      }
    } catch (error) {
      console.error("Error fetching guest houses:", error);
    }
  };

  const fetchConfirmedGuests = async () => {
    try {
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/confirmed-guests?tenant_context=${tenantSlug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfirmedGuests(data.guests || []);
      }
    } catch (error) {
      console.error("Error fetching confirmed guests:", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchGuestHouses();
      fetchConfirmedGuests();
    }
  }, [open]);

  const handleGuestSelect = (guest: ConfirmedGuest | null) => {
    setSelectedGuest(guest);
    if (guest) {
      setFormData(prev => ({
        ...prev,
        guest_name: guest.name
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        guest_name: ""
      }));
    }
  };

  const selectedGuestHouse = guestHouses.find(gh => gh.id === parseInt(formData.guest_house_id));
  const availableRooms = selectedGuestHouse?.rooms.filter(r => r.is_active) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guest_name) {
      toast({ title: "Error", description: "Please select a guest", variant: "destructive" });
      return;
    }
    
    if (!formData.check_in_date || !formData.check_out_date) {
      toast({ title: "Error", description: "Please select check-in and check-out dates", variant: "destructive" });
      return;
    }

    if (formData.check_in_date >= formData.check_out_date) {
      toast({ title: "Error", description: "Check-out date must be after check-in date", variant: "destructive" });
      return;
    }

    // Validate room capacity and gender compatibility
    const selectedRoom = availableRooms.find(r => r.id === parseInt(formData.room_id));
    if (selectedRoom) {
      const remaining = selectedRoom.capacity - (selectedRoom.current_occupants || 0);
      if (remaining <= 0) {
        toast({ title: "Error", description: "Selected room is full", variant: "destructive" });
        return;
      }
      
      // Check gender compatibility for shared rooms
      if (selectedRoom.capacity > 1 && selectedRoom.current_occupants > 0) {
        try {
          const token = apiClient.getToken();
          const roomOccupants = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/rooms/${selectedRoom.id}/occupants?tenant_context=${tenantSlug}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (roomOccupants.ok) {
            const occupantData = await roomOccupants.json();
            const existingGenders = occupantData.occupant_genders || [];
            const guestGender = selectedGuest?.gender;
            
            if (existingGenders.length > 0 && guestGender && !existingGenders.includes(guestGender)) {
              toast({ 
                title: "Error", 
                description: "Cannot mix genders in shared rooms. Please select a different room.", 
                variant: "destructive" 
              });
              return;
            }
          }
        } catch (error) {
          console.error("Error checking room occupants:", error);
        }
      }
    }

    setLoading(true);
    try {
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/allocations`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Tenant-ID": tenantSlug
          },
          body: JSON.stringify({
            guest_name: formData.guest_name,
            guest_email: selectedGuest?.email || "",
            guest_phone: selectedGuest?.phone || "",
            event_id: formData.event_id && formData.event_id !== "none" ? parseInt(formData.event_id) : null,
            room_id: parseInt(formData.room_id),
            check_in_date: format(formData.check_in_date, "yyyy-MM-dd"),
            check_out_date: format(formData.check_out_date, "yyyy-MM-dd"),
            number_of_guests: 1,
            accommodation_type: "guesthouse"
          }),
        }
      );

      if (response.ok) {
        toast({ title: "Success", description: "Guest house booking created successfully" });
        onSuccess();
        onOpenChange(false);
        setSelectedGuest(null);
        setFormData({
          guest_name: "",
          guest_email: "",
          guest_phone: "",
          event_id: "",
          guest_house_id: "",
          room_id: "",
          check_in_date: undefined,
          check_out_date: undefined,
          number_of_guests: 1
        });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({ title: "Error", description: "Failed to create booking", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-0 shadow-2xl max-w-3xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">Book Guest House</DialogTitle>
              <p className="text-red-100 text-xs mt-1">
                Create a new guest house booking for a visitor
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto modal-scrollbar p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
          {/* Guest Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">
              Select Guest
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <ReactSelect
              value={selectedGuest ? { value: selectedGuest, label: selectedGuest.display_text } : null}
              onChange={(option) => handleGuestSelect(option?.value || null)}
              options={confirmedGuests.map(guest => ({
                value: guest,
                label: guest.display_text
              }))}
              placeholder="Search and select a confirmed guest..."
              isSearchable
              isClearable
              className="text-sm"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '40px',
                  border: '2px solid #d1d5db',
                  '&:hover': { borderColor: '#ef4444' },
                  '&:focus-within': { borderColor: '#ef4444', boxShadow: '0 0 0 1px #ef4444' }
                })
              }}
            />
          </div>

          {/* Guest House and Room */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guest_house_id" className="text-sm font-semibold text-gray-900">
                Guest House
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={formData.guest_house_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, guest_house_id: value, room_id: "" }))}
              >
                <SelectTrigger className="h-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 text-sm">
                  <SelectValue placeholder="Select guest house" />
                </SelectTrigger>
                <SelectContent>
                  {guestHouses.map((guestHouse) => (
                    <SelectItem key={guestHouse.id} value={guestHouse.id.toString()}>
                      {guestHouse.name} - {guestHouse.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room_id" className="text-sm font-semibold text-gray-900">
                Room
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={formData.room_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, room_id: value }))}
                disabled={!formData.guest_house_id}
              >
                <SelectTrigger className="h-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 text-sm">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => {
                    const remaining = room.capacity - (room.current_occupants || 0);
                    const genderRestriction = room.occupant_genders && room.occupant_genders.length > 0 
                      ? ` - ${room.occupant_genders[0]} only` 
                      : '';
                    return (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        Room {room.room_number} (Capacity: {room.capacity}, Available: {remaining}{genderRestriction})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Check-in and Check-out Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">
                Check-in Date
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-10 border-2 border-gray-300 hover:border-red-500 text-sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.check_in_date ? format(formData.check_in_date, "PPP") : "Pick check-in date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.check_in_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, check_in_date: date }))}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">
                Check-out Date
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-10 border-2 border-gray-300 hover:border-red-500 text-sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.check_out_date ? format(formData.check_out_date, "PPP") : "Pick check-out date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.check_out_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, check_out_date: date }))}
                    disabled={(date) => {
                      if (!formData.check_in_date) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }
                      const checkIn = new Date(formData.check_in_date);
                      checkIn.setHours(0, 0, 0, 0);
                      return date <= checkIn;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Event Selection */}
          <div className="space-y-2">
            <Label htmlFor="event_id" className="text-sm font-semibold text-gray-900">
              Event (Optional)
            </Label>
            <Select value={formData.event_id} onValueChange={(value) => setFormData(prev => ({ ...prev, event_id: value }))}>
              <SelectTrigger className="h-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 text-sm">
                <SelectValue placeholder="Select event (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No event</SelectItem>
                {availableEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Booking
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-2">
              Cancel
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}