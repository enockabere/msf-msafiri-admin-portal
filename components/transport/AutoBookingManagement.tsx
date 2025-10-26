"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Plane, MapPin, Clock, User, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PendingBooking {
  id: number;
  booking_type: string;
  participants: Array<{
    id: number;
    name: string;
    email: string;
    country: string;
  }>;
  pickup_locations: string[];
  destination: string;
  scheduled_time: string;
  flight_number?: string;
  arrival_time?: string;
  special_instructions?: string;
  created_at: string;
}

interface AutoBookingManagementProps {
  canEdit: boolean;
  onRefresh: () => void;
  apiClient: { getToken: () => string };
  tenantSlug: string;
}

export default function AutoBookingManagement({
  canEdit,
  onRefresh,
  apiClient,
  tenantSlug
}: AutoBookingManagementProps) {
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmingBooking, setConfirmingBooking] = useState<PendingBooking | null>(null);
  const [flightDetails, setFlightDetails] = useState({
    flight_number: "",
    arrival_time: ""
  });

  const fetchPendingBookings = async () => {
    try {
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/pending-bookings?tenant_context=${tenantSlug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPendingBookings(data);
      }
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      toast({ title: "Error", description: "Failed to load pending bookings", variant: "destructive" });
    }
  };

  const createAutoBookings = async () => {
    if (!canEdit) return;
    
    setLoading(true);
    try {
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/auto-create-bookings?tenant_context=${tenantSlug}`,
        {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast({ 
          title: "Success", 
          description: `Created ${data.bookings.length} automatic transport bookings`
        });
        fetchPendingBookings();
        onRefresh();
      } else {
        throw new Error("Failed to create bookings");
      }
    } catch (error) {
      console.error("Error creating auto bookings:", error);
      toast({ title: "Error", description: "Failed to create automatic bookings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async () => {
    if (!confirmingBooking) return;

    try {
      const token = apiClient.getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/confirm-booking/${confirmingBooking.id}?tenant_context=${tenantSlug}`,
        {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(flightDetails)
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast({ 
          title: "Success", 
          description: `Booking confirmed and sent to Absolute Cabs. Reference: ${data.booking_reference}`
        });
        setConfirmingBooking(null);
        setFlightDetails({ flight_number: "", arrival_time: "" });
        fetchPendingBookings();
        onRefresh();
      } else {
        throw new Error("Failed to confirm booking");
      }
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast({ title: "Error", description: "Failed to confirm booking", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case "airport_pickup":
        return <Plane className="w-4 h-4" />;
      case "event_transfer":
        return <MapPin className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getBookingTypeBadge = (type: string) => {
    switch (type) {
      case "airport_pickup":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Airport Pickup</Badge>;
      case "event_transfer":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Transfer</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Automatic Transport Bookings</h3>
          <p className="text-sm text-gray-600">
            Automatically create transport bookings for international visitors based on their accommodations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchPendingBookings}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {canEdit && (
            <Button
              onClick={createAutoBookings}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plane className="w-4 h-4 mr-2" />
              )}
              Create Auto Bookings
            </Button>
          )}
        </div>
      </div>

      {pendingBookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Bookings</h3>
            <p className="text-sm text-gray-600 text-center max-w-md">
              All international visitors have confirmed transport bookings, or click "Create Auto Bookings" to scan for new visitors.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingBookings.map((booking) => (
            <Card key={booking.id} className="border-l-4 border-l-yellow-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getBookingTypeIcon(booking.booking_type)}
                    <div>
                      <CardTitle className="text-base">
                        {booking.participants.map(p => p.name).join(", ")}
                      </CardTitle>
                      <CardDescription>
                        From {booking.participants[0]?.country} • Created {formatDateTime(booking.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getBookingTypeBadge(booking.booking_type)}
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Pending Confirmation
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Pickup:</span>
                      <span>{booking.pickup_locations.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Destination:</span>
                      <span>{booking.destination}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Scheduled:</span>
                      <span>{formatDateTime(booking.scheduled_time)}</span>
                    </div>
                    {booking.flight_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Plane className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Flight:</span>
                        <span>{booking.flight_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {booking.special_instructions && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{booking.special_instructions}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  {booking.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                      <User className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-800">{participant.name}</span>
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => setConfirmingBooking(booking)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm & Send to Absolute Cabs
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmingBooking} onOpenChange={(open) => !open && setConfirmingBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Transport Booking</DialogTitle>
            <DialogDescription>
              Please provide flight details to complete the booking for {confirmingBooking?.participants[0]?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="flight_number">Flight Number</Label>
              <Input
                id="flight_number"
                value={flightDetails.flight_number}
                onChange={(e) => setFlightDetails(prev => ({ ...prev, flight_number: e.target.value }))}
                placeholder="e.g., KQ101"
              />
            </div>
            <div>
              <Label htmlFor="arrival_time">Arrival Date & Time</Label>
              <Input
                id="arrival_time"
                type="datetime-local"
                value={flightDetails.arrival_time}
                onChange={(e) => setFlightDetails(prev => ({ ...prev, arrival_time: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingBooking(null)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmBooking}
              disabled={!flightDetails.flight_number || !flightDetails.arrival_time}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm & Send Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}