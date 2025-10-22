"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X, Hotel, Calendar } from "lucide-react";
import { toast } from "@/components/ui/toast";

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

interface EditEventSetupForm {
  single_rooms: number;
  double_rooms: number;
  event_name?: string;
}

interface Event {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
}

interface EditEventSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setup: VendorEventSetup | null;
  events?: Event[];
  apiClient: { getToken: () => string };
  tenantSlug: string;
  onEditComplete: () => void;
}

export default function EditEventSetupModal({
  open,
  onOpenChange,
  setup,
  events = [],
  apiClient,
  tenantSlug,
  onEditComplete,
}: EditEventSetupModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<EditEventSetupForm>({
    single_rooms: 0,
    double_rooms: 0,
    event_name: '',
  });
  const [selectedEventType, setSelectedEventType] = useState<string>('');

  useEffect(() => {
    if (setup) {
      const eventType = setup.event_id ? setup.event_id.toString() : 'other';
      setSelectedEventType(eventType);
      setForm({
        single_rooms: setup.single_rooms,
        double_rooms: setup.double_rooms,
        event_name: setup.event?.title || setup.event_name || '',
      });
    }
  }, [setup]);

  const availableEvents = events.filter(event => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    return startDate > now;
  });

  const handleEventChange = (eventId: string) => {
    setSelectedEventType(eventId);
    if (eventId === "other") {
      setForm({ ...form, event_name: "" });
    } else {
      const selectedEvent = events.find(e => e.id.toString() === eventId);
      setForm({ ...form, event_name: selectedEvent?.title || "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!setup) return;

    if (form.single_rooms === 0 && form.double_rooms === 0) {
      toast({ title: "Error", description: "Please specify at least one room type", variant: "destructive" });
      return;
    }

    // Check if reducing capacity below current occupants
    const newCapacity = form.single_rooms + (form.double_rooms * 2);
    if (newCapacity < setup.current_occupants) {
      toast({ 
        title: "Error", 
        description: `Cannot reduce capacity below current occupants (${setup.current_occupants})`, 
        variant: "destructive" 
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-event-setup/${setup.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
            'X-Tenant-ID': tenantSlug
          },
          body: JSON.stringify(form),
        }
      );

      if (response.ok) {
        onEditComplete();
        onOpenChange(false);
        toast({ title: "Success", description: "Event setup updated successfully" });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!setup) return null;

  const newCapacity = form.single_rooms + (form.double_rooms * 2);
  const isOccupied = setup.current_occupants > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 shadow-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Hotel className="w-5 h-5 text-blue-600" />
            Edit Event Setup
          </DialogTitle>
          {isOccupied && (
            <p className="text-sm text-gray-600 mt-1">
              {setup.event?.title || setup.event_name || 'Custom Event'}
            </p>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isOccupied && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This setup has {setup.current_occupants} current occupants. 
                You can only increase capacity or maintain current levels.
              </p>
            </div>
          )}

          {!isOccupied && (
            <>
              <div className="space-y-2">
                <Label htmlFor="event" className="text-sm font-medium text-gray-700">
                  Select Event
                </Label>
                <Select value={selectedEventType} onValueChange={handleEventChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>{event.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="other">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Other (specify name)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedEventType === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="event_name" className="text-sm font-medium text-gray-700">
                    Event Name
                  </Label>
                  <Input
                    id="event_name"
                    type="text"
                    value={form.event_name || ""}
                    onChange={(e) => setForm({ ...form, event_name: e.target.value })}
                    placeholder="Enter event name"
                  />
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="single_rooms" className="text-sm font-medium text-gray-700">
                Single Rooms
              </Label>
              <Input
                id="single_rooms"
                type="number"
                min="0"
                value={form.single_rooms || ""}
                onChange={(e) => setForm({ ...form, single_rooms: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="double_rooms" className="text-sm font-medium text-gray-700">
                Double Rooms
              </Label>
              <Input
                id="double_rooms"
                type="number"
                min="0"
                value={form.double_rooms || ""}
                onChange={(e) => setForm({ ...form, double_rooms: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>New Capacity:</strong> {newCapacity} people
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Single rooms: {form.single_rooms} × 1 = {form.single_rooms} people<br />
              Double rooms: {form.double_rooms} × 2 = {form.double_rooms * 2} people
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Current occupants: {setup.current_occupants}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || newCapacity < setup.current_occupants} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {submitting ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}