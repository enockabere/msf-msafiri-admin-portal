"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { Plane, Car, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface FlightDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    participant_name: string;
    participant_email: string;
    event_title: string;
    pickup_location: string;
    destination: string;
    pickup_time: string;
    flight_number?: string;
  } | null;
  onSuccess: () => void;
  apiClient: { getToken: () => string };
  tenantSlug: string;
}

export default function FlightDetailsModal({
  open,
  onOpenChange,
  booking,
  onSuccess,
  apiClient,
  tenantSlug
}: FlightDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [flightDetails, setFlightDetails] = useState({
    flight_number: "",
    arrival_time: "",
    departure_city: "",
    airline: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!booking || !flightDetails.flight_number || !flightDetails.arrival_time) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/confirm-booking/${booking.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Tenant-ID": tenantSlug
          },
          body: JSON.stringify(flightDetails),
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast({ 
          title: "Success", 
          description: `Booking confirmed and sent to Absolute Cabs. Reference: ${result.booking_reference}` 
        });
        onSuccess();
        onOpenChange(false);
        setFlightDetails({ flight_number: "", arrival_time: "", departure_city: "", airline: "" });
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
      }
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast({ title: "Error", description: "Failed to confirm booking", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-0 shadow-2xl max-w-2xl">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 -m-6 mb-6 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">Confirm Flight Details</DialogTitle>
              <p className="text-blue-100 text-sm mt-1">
                Send booking to Absolute Cabs for {booking.participant_name}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Car className="w-4 h-4" />
              Transport Booking Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Passenger:</span>
                <p className="font-medium">{booking.participant_name}</p>
              </div>
              <div>
                <span className="text-gray-500">Event:</span>
                <p className="font-medium">{booking.event_title}</p>
              </div>
              <div>
                <span className="text-gray-500">Pickup:</span>
                <p className="font-medium">{booking.pickup_location}</p>
              </div>
              <div>
                <span className="text-gray-500">Destination:</span>
                <p className="font-medium">{booking.destination}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Scheduled Time:</span>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {format(new Date(booking.pickup_time), "PPP 'at' p")}
                </p>
              </div>
            </div>
          </div>

          {/* Flight Details Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Flight Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flight_number" className="text-sm font-medium text-gray-700">
                  Flight Number *
                </Label>
                <Input
                  id="flight_number"
                  value={flightDetails.flight_number}
                  onChange={(e) => setFlightDetails(prev => ({ ...prev, flight_number: e.target.value }))}
                  placeholder="e.g., KQ412"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="airline" className="text-sm font-medium text-gray-700">
                  Airline
                </Label>
                <Input
                  id="airline"
                  value={flightDetails.airline}
                  onChange={(e) => setFlightDetails(prev => ({ ...prev, airline: e.target.value }))}
                  placeholder="e.g., Kenya Airways"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arrival_time" className="text-sm font-medium text-gray-700">
                  Arrival Date & Time *
                </Label>
                <Input
                  id="arrival_time"
                  type="datetime-local"
                  value={flightDetails.arrival_time}
                  onChange={(e) => setFlightDetails(prev => ({ ...prev, arrival_time: e.target.value }))}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="departure_city" className="text-sm font-medium text-gray-700">
                  Departure City
                </Label>
                <Input
                  id="departure_city"
                  value={flightDetails.departure_city}
                  onChange={(e) => setFlightDetails(prev => ({ ...prev, departure_city: e.target.value }))}
                  placeholder="e.g., Kampala"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending to Absolute Cabs...
                </>
              ) : (
                <>
                  <Car className="w-4 h-4 mr-2" />
                  Confirm & Send to Absolute Cabs
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}