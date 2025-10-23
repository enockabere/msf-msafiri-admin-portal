"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X, Calendar, Hotel } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface Event {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
}

interface VendorAccommodation {
  id: number;
  vendor_name: string;
  location: string;
}

interface EventAccommodationForm {
  event_id: string;
  event_name: string;
  single_rooms: number;
  double_rooms: number;
}

interface EventAccommodationSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: VendorAccommodation;
  events: Event[];
  apiClient: { getToken: () => string };
  tenantSlug: string;
  onSetupComplete: () => void;
}

export default function EventAccommodationSetupModal({
  open,
  onOpenChange,
  vendor,
  events,
  apiClient,
  tenantSlug,
  onSetupComplete,
}: EventAccommodationSetupModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<EventAccommodationForm>({
    event_id: "",
    event_name: "",
    single_rooms: 0,
    double_rooms: 0,
  });

  // Filter events to only show upcoming events (not started or ended)
  const availableEvents = events.filter(event => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    return startDate > now; // Only future events
  });

  const handleEventChange = (eventId: string) => {
    if (eventId === "other") {
      setForm({ ...form, event_id: "other", event_name: "" });
    } else {
      const selectedEvent = events.find(e => e.id.toString() === eventId);
      setForm({ 
        ...form, 
        event_id: eventId, 
        event_name: selectedEvent?.title || "" 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.event_id) {
      toast({ title: "Error", description: "Please select an event", variant: "destructive" });
      return;
    }

    if (form.event_id === "other" && !form.event_name.trim()) {
      toast({ title: "Error", description: "Please enter event name", variant: "destructive" });
      return;
    }

    if (form.single_rooms === 0 && form.double_rooms === 0) {
      toast({ title: "Error", description: "Please specify at least one room type", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        vendor_accommodation_id: vendor.id,
        event_id: form.event_id === "other" ? null : parseInt(form.event_id),
        event_name: form.event_id === "other" ? form.event_name : null,
        single_rooms: form.single_rooms,
        double_rooms: form.double_rooms,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/vendor-event-setup`,
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

      if (response.ok) {
        onSetupComplete();
        onOpenChange(false);
        setForm({
          event_id: "",
          event_name: "",
          single_rooms: 0,
          double_rooms: 0,
        });
        toast({ title: "Success", description: "Event accommodation setup completed" });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] sm:w-[95vw] lg:w-[90vw] xl:w-[85vw] h-[95vh] sm:h-[90vh] max-w-[98vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] overflow-hidden bg-white border-0 shadow-2xl p-0 rounded-2xl">
        <DialogHeader className="px-4 sm:px-6 lg:px-8 py-6 border-b-2 border-gray-100 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-t-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-orange-200/30 to-yellow-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <DialogTitle className="flex items-center gap-3 relative z-10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Hotel className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                Event Accommodation Setup
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure room capacity for {vendor.vendor_name}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          <div className="space-y-2">
            <Label htmlFor="event" className="text-sm font-medium text-gray-700">
              Select Event
            </Label>
            <Select value={form.event_id} onValueChange={handleEventChange}>
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

          {form.event_id === "other" && (
            <div className="space-y-2">
              <Label htmlFor="event_name" className="text-sm font-medium text-gray-700">
                Event Name
              </Label>
              <Input
                id="event_name"
                value={form.event_name}
                onChange={(e) => setForm({ ...form, event_name: e.target.value })}
                placeholder="Enter event name"
                required
              />
            </div>
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
              <strong>Total Capacity:</strong> {form.single_rooms + (form.double_rooms * 2)} people
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Single rooms: {form.single_rooms} × 1 = {form.single_rooms} people<br />
              Double rooms: {form.double_rooms} × 2 = {form.double_rooms * 2} people
            </p>
          </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {submitting ? "Setting up..." : "Setup"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}