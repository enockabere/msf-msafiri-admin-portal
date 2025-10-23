"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Save, Loader2 } from "lucide-react";



interface VendorAccommodation {
  id: number;
  vendor_name: string;
  current_occupants: number;
  capacity: number;
  single_rooms: number;
  double_rooms: number;
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

interface AllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: AllocationForm;
  onFormChange: (form: AllocationForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  vendors: VendorAccommodation[];
  events: Event[];
  participants: Participant[];
  onEventChange: (eventId: string) => void;
  selectedParticipants: number[];
  onParticipantToggle: (participantId: number) => void;
  allocatedParticipants: number[];
}

export default function AllocationModal({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  submitting,
  vendors,
  events,
  participants,
  onEventChange,
  selectedParticipants,
  onParticipantToggle,
  allocatedParticipants
}: AllocationModalProps) {
  // Helper function to get selected participant genders
  const getSelectedParticipantGenders = (): string[] => {
    return selectedParticipants.map(id => {
      const participant = participants.find(p => p.id === id);
      return participant?.gender;
    }).filter((gender): gender is string => Boolean(gender));
  };
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 shadow-lg max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Event Accommodation Setup</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <Label className="text-sm font-medium text-gray-700">Accommodation Type</Label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900">Vendor Hotel</div>
                <div className="text-xs text-blue-600">External hotel partnerships</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="vendor_accommodation_id" className="text-sm font-medium text-gray-700">Vendor Hotel</Label>
              <Select 
                value={form.vendor_accommodation_id} 
                onValueChange={(value) => onFormChange({ ...form, vendor_accommodation_id: value, room_type: undefined })}
              >
                <SelectTrigger className="bg-white border border-gray-300">
                  <SelectValue placeholder="Select vendor hotel" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 shadow-lg">
                  {vendors.filter(vendor => (vendor.single_rooms > 0 || vendor.double_rooms > 0)).map((vendor) => {
                    const hasAvailableRooms = vendor.single_rooms > 0 || vendor.double_rooms > 0;
                    return (
                      <SelectItem key={vendor.id} value={vendor.id.toString()} disabled={!hasAvailableRooms}>
                        <div className="flex flex-col">
                          <span>{vendor.vendor_name}</span>
                          <div className="text-xs text-gray-500">
                            Single: {vendor.single_rooms} | Double: {vendor.double_rooms}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room_type" className="text-sm font-medium text-gray-700">Room Type</Label>
              <Select 
                value={form.room_type || ""} 
                onValueChange={(value: "single" | "double") => onFormChange({ ...form, room_type: value })}
                disabled={!form.vendor_accommodation_id}
              >
                <SelectTrigger className="bg-white border border-gray-300">
                  <SelectValue placeholder={form.vendor_accommodation_id ? "Select room type" : "Select vendor first"} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 shadow-lg">
                  {form.vendor_accommodation_id && (() => {
                    const selectedVendor = vendors.find(v => v.id.toString() === form.vendor_accommodation_id);
                    return [
                      selectedVendor?.single_rooms > 0 && (
                        <SelectItem key="single" value="single">
                          Single Room ({selectedVendor.single_rooms} available)
                        </SelectItem>
                      ),
                      selectedVendor?.double_rooms > 0 && (
                        <SelectItem key="double" value="double">
                          Double Room ({selectedVendor.double_rooms} available)
                        </SelectItem>
                      )
                    ].filter(Boolean);
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.room_type && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Room Type:</strong> {form.room_type === "single" ? "Single Room" : "Double Room"}
                {form.room_type === "single" && " - Individual occupancy, any gender"}
                {form.room_type === "double" && " - Maximum 2 participants, same gender required"}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Participants</Label>
            {!form.event_id ? (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">Select event first</p>
              </div>
            ) : (!form.vendor_accommodation_id || !form.room_type) ? (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">{!form.vendor_accommodation_id ? 'Select vendor hotel first' : 'Select room type first'}</p>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No participants found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {participants.filter(p => !allocatedParticipants.includes(p.id)).map((participant) => {
                    const isSelected = selectedParticipants.includes(participant.id);
                    let totalCapacity = Infinity;
                    
                    if (form.room_type === "double") {
                      totalCapacity = 2; // Double rooms can only accommodate 2 people
                    }
                    
                    const canSelect = selectedParticipants.length < totalCapacity || isSelected;
                    const hasGender = participant.gender;
                    let isDisabledDueToGender = !hasGender;
                    let genderConflictMessage = '';
                    
                    // For vendor accommodations, only check gender for double rooms
                    if (form.room_type === "double" && hasGender && !isSelected) {
                      const selectedGenders = getSelectedParticipantGenders();
                      const uniqueGenders = [...new Set(selectedGenders)];
                      if (uniqueGenders.length > 0 && !uniqueGenders.includes(participant.gender!)) {
                        isDisabledDueToGender = true;
                        genderConflictMessage = `Double room requires same gender - only ${uniqueGenders.join('/')} allowed`;
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
                            {participant.accommodationNeeds && (
                              <div className="text-xs text-blue-600 mt-1">
                                Accommodation needs: {participant.accommodationNeeds}
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
                  {form.room_type && (
                    <span className="ml-2">
                      (Max: {form.room_type === "single" ? "1 person per room" : "2 people per room"})
                    </span>
                  )}
                  {form.room_type === "double" && selectedParticipants.length > 0 && (
                    <div className="text-xs text-blue-600 mt-1 capitalize">
                      Double room: same gender required ({getSelectedParticipantGenders()[0] || 'any'} gender selected)
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="check_in_date" className="text-sm font-medium text-gray-700">Check-in Date</Label>
              <Input
                id="check_in_date"
                type="date"
                value={form.check_in_date}
                min={new Date().toISOString().split('T')[0]}
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
                min={form.check_in_date || new Date().toISOString().split('T')[0]}
                onChange={(e) => onFormChange({ ...form, check_out_date: e.target.value })}
                required
              />
            </div>
          </div>
          </div>
          <div className="flex justify-end space-x-3 pt-3 border-t bg-white px-6 pb-4">
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