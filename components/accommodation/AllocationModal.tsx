"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Save, Loader2 } from "lucide-react";

interface Room {
  id: number;
  guesthouse_id: number;
  room_number: string;
  capacity: number;
  room_type: string;
  current_occupants: number;
  occupantInfo?: {
    occupant_genders: string[];
    can_accept_gender: {
      male: boolean;
      female: boolean;
      other: boolean;
    };
  } | null;
}

interface VendorAccommodation {
  id: number;
  vendor_name: string;
  current_occupants: number;
  capacity: number;
}

interface GuestHouse {
  id: number;
  name: string;
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
  email: string;
  phone?: string;
  role: string;
  event_id: number;
}

interface AllocationForm {
  event_id: string;
  participant_ids: string[];
  check_in_date: string;
  check_out_date: string;
  accommodation_type: "guesthouse" | "vendor";
  room_id: string;
  vendor_accommodation_id: string;
}

interface AllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: AllocationForm;
  onFormChange: (form: AllocationForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  availableRooms: Room[];
  selectedRooms: number[];
  onRoomToggle: (roomId: number) => void;
  vendors: VendorAccommodation[];
  guesthouses: GuestHouse[];

  events: Event[];
  participants: Participant[];
  onEventChange: (eventId: string) => void;
  selectedParticipants: number[];
  onParticipantToggle: (participantId: number) => void;
  selectedGuesthouses: number[];
  onGuesthouseToggle: (guesthouseId: number) => void;
  fetchRoomsForGuesthouses: (guesthouseIds: number[]) => void;
  allocatedParticipants: number[];
}

export default function AllocationModal({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  submitting,
  availableRooms,
  selectedRooms,
  onRoomToggle,
  vendors,
  guesthouses,
  events,
  participants,
  onEventChange,
  selectedParticipants,
  onParticipantToggle,
  selectedGuesthouses,
  onGuesthouseToggle,
  fetchRoomsForGuesthouses,
  allocatedParticipants
}: AllocationModalProps) {
  // Helper function to get selected participant genders
  const getSelectedParticipantGenders = () => {
    return selectedParticipants.map(id => {
      const participant = participants.find(p => p.id === id);
      return participant?.gender;
    }).filter(Boolean);
  };
  
  // Helper function to get room occupant genders
  const getRoomOccupantGenders = (roomIds: number[]) => {
    return roomIds.map(roomId => {
      const room = availableRooms.find(r => r.id === roomId);
      return room?.occupantInfo?.occupant_genders || [];
    }).flat().filter(Boolean);
  };
  
  // Get current gender constraints
  const selectedGenders = [...new Set(getSelectedParticipantGenders())];
  const roomOccupantGenders = [...new Set(getRoomOccupantGenders(selectedRooms))];
  const allConstrainingGenders = [...new Set([...selectedGenders, ...roomOccupantGenders])];
  return (
    <Dialog open={open} onOpenChange={(openState) => {
      onOpenChange(openState);
      if (openState && form.accommodation_type === "guesthouse" && selectedGuesthouses.length > 0) {
        fetchRoomsForGuesthouses(selectedGuesthouses);
      }
    }}>
      <DialogContent className="bg-white border border-gray-200 shadow-lg overflow-hidden flex flex-col" style={{ width: '85vw', height: '80vh', maxWidth: 'none', maxHeight: 'none' }}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Allocate Visitor</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-6 pr-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_id" className="text-sm font-medium text-gray-700">Event</Label>
              <Select 
                value={form.event_id} 
                onValueChange={(value) => {
                  onFormChange({ ...form, event_id: value, participant_ids: [] });
                  onEventChange(value);
                }}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 shadow-lg">
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accommodation_type" className="text-sm font-medium text-gray-700">Accommodation Type</Label>
              <Select 
                value={form.accommodation_type} 
                onValueChange={(value: "guesthouse" | "vendor") => {
                  onFormChange({ ...form, accommodation_type: value, room_id: "", vendor_accommodation_id: "" });
                  // Reset selections when changing accommodation type
                  if (value === "guesthouse") {
                    // Don't fetch all rooms immediately, wait for guesthouse selection
                  } else {
                    // Clear guesthouse-related selections when switching to vendor
                    selectedGuesthouses.forEach(id => onGuesthouseToggle(id));
                  }
                }}
                disabled={!form.event_id}
              >
                <SelectTrigger className="bg-white border border-gray-300">
                  <SelectValue placeholder={form.event_id ? "Select accommodation type" : "Select event first"} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 shadow-lg">
                  <SelectItem value="guesthouse">Guesthouse</SelectItem>
                  <SelectItem value="vendor">Vendor Hotel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.accommodation_type === "guesthouse" && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Select Guesthouses</Label>
                {guesthouses.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No guesthouses available</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-2 max-h-24 overflow-y-auto">
                      {guesthouses.map((guesthouse) => {
                        const isSelected = selectedGuesthouses.includes(guesthouse.id);
                        return (
                          <div 
                            key={guesthouse.id}
                            className={`p-2 border rounded cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => onGuesthouseToggle(guesthouse.id)}
                          >
                            <div className="text-sm font-medium">{guesthouse.name}</div>
                            <div className="text-xs text-gray-600">{guesthouse.location || 'No location'}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      Selected: {selectedGuesthouses.length} guesthouses
                    </div>
                  </>
                )}
              </div>
              {selectedGuesthouses.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Available Rooms</Label>
                  {availableRooms.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No available rooms</p>
                      <p className="text-xs">All rooms are fully occupied</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto">
                        {availableRooms.map((room) => {
                          const availableSpaces = room.capacity - room.current_occupants;
                          const isSelected = selectedRooms.includes(room.id);
                          const guesthouse = guesthouses.find(gh => gh.id === room.guesthouse_id);
                          
                          let canAcceptParticipants = true;
                          let genderWarning = '';
                          
                          // Check if there are any gender constraints from selected participants or other rooms
                          if (allConstrainingGenders.length > 0) {
                            // If room has occupants, check if they match the constraint
                            if (room.occupantInfo?.occupant_genders.length > 0) {
                              const roomGenders = [...new Set(room.occupantInfo.occupant_genders)];
                              const hasConflict = roomGenders.some(gender => !allConstrainingGenders.includes(gender)) ||
                                                 allConstrainingGenders.some(gender => !roomGenders.includes(gender));
                              
                              if (hasConflict) {
                                canAcceptParticipants = false;
                                genderWarning = `Has ${roomGenders.join('/')} occupant(s), conflicts with ${allConstrainingGenders.join('/')} constraint`;
                              }
                            }
                            // If room is empty but we have gender constraints, check if it can accept the constraint gender
                            else if (room.current_occupants === 0) {
                              // For "other" gender, only allow single occupancy rooms
                              if (allConstrainingGenders.includes('other') && room.capacity > 1 && selectedParticipants.length > 1) {
                                canAcceptParticipants = false;
                                genderWarning = 'Multi-capacity room not suitable for "Other" gender participants';
                              }
                            }
                          }
                          // If no constraints yet, check room's existing occupants against selected participants
                          else if (room.occupantInfo?.occupant_genders.length > 0 && selectedParticipants.length > 0) {
                            const participantGenders = getSelectedParticipantGenders();
                            const uniqueParticipantGenders = [...new Set(participantGenders)];
                            const roomGenders = [...new Set(room.occupantInfo.occupant_genders)];
                            
                            if (uniqueParticipantGenders.length > 0) {
                              const hasConflict = roomGenders.some(gender => !uniqueParticipantGenders.includes(gender)) ||
                                                 uniqueParticipantGenders.some(gender => !roomGenders.includes(gender));
                              
                              if (hasConflict) {
                                canAcceptParticipants = false;
                                genderWarning = `Has ${roomGenders.join('/')} occupant(s), selected participants are ${uniqueParticipantGenders.join('/')}`;
                              }
                            }
                          }
                          
                          return (
                            <div 
                              key={room.id}
                              className={`p-2 border rounded transition-colors ${
                                !canAcceptParticipants ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-75' :
                                isSelected ? 'bg-blue-100 border-blue-500 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'
                              }`}
                              onClick={() => canAcceptParticipants && onRoomToggle(room.id)}
                            >
                              <div className="text-xs font-medium">Room {room.room_number}</div>
                              <div className="text-xs text-gray-600">{guesthouse?.name || 'Unknown'}</div>
                              <div className="text-xs text-gray-600">{availableSpaces} spaces</div>
                              {genderWarning && (
                                <div className="text-xs text-red-600 mt-1">{genderWarning}</div>
                              )}
                              {room.occupantInfo?.occupant_genders.length === 0 && room.current_occupants === 0 && (
                                <div className="text-xs text-green-600 mt-1">Empty room</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        Selected: {selectedRooms.length} rooms, Total capacity: {selectedRooms.reduce((sum, roomId) => {
                          const room = availableRooms.find(r => r.id === roomId);
                          return sum + (room ? room.capacity - room.current_occupants : 0);
                        }, 0)} people
                        {allConstrainingGenders.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1 capitalize">
                            Gender constraint: {allConstrainingGenders.join('/')} only
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Participants</Label>
            {!form.event_id || !form.accommodation_type ? (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">Select event and accommodation type first</p>
              </div>
            ) : form.accommodation_type === "guesthouse" && (selectedGuesthouses.length === 0 || selectedRooms.length === 0) ? (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">{selectedGuesthouses.length === 0 ? 'Select guesthouses first' : 'Select rooms first to see capacity'}</p>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No participants found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {participants.filter(p => !allocatedParticipants.includes(p.id)).map((participant) => {
                    const isSelected = selectedParticipants.includes(participant.id);
                    const totalCapacity = form.accommodation_type === "guesthouse" 
                      ? selectedRooms.reduce((sum, roomId) => {
                          const room = availableRooms.find(r => r.id === roomId);
                          return sum + (room ? room.capacity - room.current_occupants : 0);
                        }, 0)
                      : Infinity;
                    const canSelect = selectedParticipants.length < totalCapacity || isSelected;
                    const hasGender = participant.gender;
                    let isDisabledDueToGender = !hasGender;
                    let genderConflictMessage = '';
                    
                    // For "other" gender participants, check if they can share rooms
                    if (hasGender && participant.gender === 'other' && !isSelected && form.accommodation_type === "guesthouse") {
                      const hasMultiCapacityRooms = selectedRooms.some(roomId => {
                        const room = availableRooms.find(r => r.id === roomId);
                        return room && room.capacity > 1;
                      });
                      
                      if (hasMultiCapacityRooms && (selectedParticipants.length > 0 || selectedRooms.some(roomId => {
                        const room = availableRooms.find(r => r.id === roomId);
                        return room && room.current_occupants > 0;
                      }))) {
                        isDisabledDueToGender = true;
                        genderConflictMessage = '"Other" gender cannot share rooms';
                      }
                    }
                    
                    // Check for gender conflicts with existing constraints
                    if (hasGender && !isSelected && allConstrainingGenders.length > 0) {
                      if (!allConstrainingGenders.includes(participant.gender)) {
                        isDisabledDueToGender = true;
                        genderConflictMessage = `Cannot select ${participant.gender} - only ${allConstrainingGenders.join('/')} allowed`;
                      }
                    }
                    
                    return (
                      <div 
                        key={participant.id}
                        className={`p-2 border rounded transition-colors ${
                          isDisabledDueToGender ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-75' :
                          isSelected ? 'bg-blue-100 border-blue-500 cursor-pointer' : 
                          canSelect ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-100 cursor-not-allowed opacity-50'
                        }`}
                        onClick={() => !isDisabledDueToGender && canSelect && onParticipantToggle(participant.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{participant.name}</div>
                            <div className="text-xs text-gray-600">{participant.role} • {participant.email}</div>
                            {participant.gender && (
                              <div className="text-xs text-gray-500 capitalize mt-1">
                                Gender: {participant.gender}
                              </div>
                            )}
                            {genderConflictMessage && (
                              <div className="text-xs text-red-600 mt-1">{genderConflictMessage}</div>
                            )}
                          </div>
                          {!hasGender && (
                            <div className="text-xs text-red-600 font-medium">No Gender</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-500">
                  Selected: {selectedParticipants.length} participants
                  {form.accommodation_type === "guesthouse" && selectedRooms.length > 0 && (
                    <span className="ml-2">
                      (Max: {selectedRooms.reduce((sum, roomId) => {
                        const room = availableRooms.find(r => r.id === roomId);
                        return sum + (room ? room.capacity - room.current_occupants : 0);
                      }, 0)} people)
                    </span>
                  )}
                  {allConstrainingGenders.length > 0 && (
                    <div className="text-xs text-blue-600 mt-1 capitalize">
                      Only {allConstrainingGenders.join('/')} participants can be selected
                    </div>
                  )}
                  {allocatedParticipants.length > 0 && (
                    <div className="text-xs text-orange-600 mt-1">
                      {allocatedParticipants.length} participants already allocated and hidden
                    </div>
                  )}
                  {participants.filter(p => !p.gender && !allocatedParticipants.includes(p.id)).length > 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      {participants.filter(p => !p.gender && !allocatedParticipants.includes(p.id)).length} participants without gender information cannot be booked
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="check_in_date" className="text-sm font-medium text-gray-700">Check-in Date</Label>
              <Input
                id="check_in_date"
                type="date"
                value={form.check_in_date}
                onChange={(e) => onFormChange({ ...form, check_in_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out_date" className="text-sm font-medium text-gray-700">Check-out Date</Label>
              <Input
                id="check_out_date"
                type="date"
                value={form.check_out_date}
                onChange={(e) => onFormChange({ ...form, check_out_date: e.target.value })}
                required
              />
            </div>
          </div>
          {form.accommodation_type === "vendor" && (
            <div className="space-y-2">
              <Label htmlFor="vendor_accommodation_id" className="text-sm font-medium text-gray-700">Vendor</Label>
              <Select 
                value={form.vendor_accommodation_id} 
                onValueChange={(value) => onFormChange({ ...form, vendor_accommodation_id: value })}
              >
                <SelectTrigger className="bg-white border border-gray-300">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 shadow-lg">
                  {vendors.filter(vendor => vendor.current_occupants < vendor.capacity).map((vendor) => {
                    const isAvailable = vendor.current_occupants < vendor.capacity;
                    return (
                      <SelectItem key={vendor.id} value={vendor.id.toString()} disabled={!isAvailable}>
                        <div className="flex items-center justify-between w-full">
                          <span>{vendor.vendor_name}</span>
                          <Badge variant={isAvailable ? "default" : "secondary"}>
                            {vendor.current_occupants}/{vendor.capacity}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t bg-white">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {submitting ? "Allocating..." : "Allocate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}