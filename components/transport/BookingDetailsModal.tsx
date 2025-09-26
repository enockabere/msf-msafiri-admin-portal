"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { 
  Car, Package, MapPin, Clock, User, Phone, Calendar, 
  CheckCircle, Loader2, MessageSquare 
} from "lucide-react";

interface TransportBooking {
  id: number;
  booking_type: string;
  status: string;
  participant_ids: number[];
  pickup_locations: string[];
  destination: string;
  scheduled_time: string;
  has_welcome_package: boolean;
  package_pickup_location?: string;
  package_collected: boolean;
  vendor_type: string;
  vendor_name?: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_details?: string;
  flight_number?: string;
  arrival_time?: string;
  event_title?: string;
  participants?: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
  }>;
  created_by: string;
  created_at: string;
}

interface BookingDetailsModalProps {
  booking: TransportBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  apiClient: { getToken: () => string };
  tenantSlug: string;
}

export default function BookingDetailsModal({
  booking,
  open,
  onOpenChange,
  onRefresh,
  apiClient,
  tenantSlug
}: BookingDetailsModalProps) {
  const [updating, setUpdating] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: "",
    notes: "",
    location: ""
  });

  if (!booking) return null;

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      package_collected: "bg-orange-100 text-orange-800",
      visitor_picked_up: "bg-purple-100 text-purple-800",
      in_transit: "bg-indigo-100 text-indigo-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const getNextStatuses = (currentStatus: string) => {
    const statusFlow = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["package_collected", "visitor_picked_up", "cancelled"],
      package_collected: ["visitor_picked_up", "cancelled"],
      visitor_picked_up: ["in_transit", "completed", "cancelled"],
      in_transit: ["completed", "cancelled"],
      completed: [],
      cancelled: []
    };
    return statusFlow[currentStatus as keyof typeof statusFlow] || [];
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate.status) {
      toast({ title: "Error", description: "Please select a status", variant: "destructive" });
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/bookings/${booking.id}/status?tenant_context=${tenantSlug}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(statusUpdate),
        }
      );

      if (response.ok) {
        toast({ title: "Success", description: "Status updated successfully" });
        onRefresh();
        setStatusUpdate({ status: "", notes: "", location: "" });
      } else {
        const errorData = await response.json();
        toast({ title: "Error", description: errorData.detail || "Failed to update status", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const nextStatuses = getNextStatuses(booking.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Booking Details #{booking.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-gray-400" />
              <span className="font-medium">
                {booking.booking_type.replace('_', ' ').toUpperCase()}
              </span>
              {booking.has_welcome_package && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Package</span>
                </div>
              )}
            </div>
            <Badge className={getStatusBadge(booking.status)}>
              {booking.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Booking Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Scheduled Time</span>
                </div>
                <div className="text-gray-900">
                  {new Date(booking.scheduled_time).toLocaleDateString()}
                </div>
                <div className="text-gray-600">
                  {new Date(booking.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Passengers ({booking.participants?.length || booking.participant_ids.length})</span>
                </div>
                <div className="space-y-1">
                  {booking.participants?.map((participant) => (
                    <div key={participant.id} className="text-sm">
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-gray-600">{participant.email}</div>
                      {participant.phone && (
                        <div className="text-gray-500">{participant.phone}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {booking.event_title && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Event</span>
                  </div>
                  <div className="text-gray-900">{booking.event_title}</div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Route</span>
                </div>
                <div className="space-y-2">
                  {booking.pickup_locations.map((location, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">{location}</span>
                      {index === 0 && booking.has_welcome_package && (
                        <Package className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">{booking.destination}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">Driver & Vehicle</span>
                </div>
                <div className="space-y-1">
                  <div className="font-medium">{booking.driver_name || 'Not assigned'}</div>
                  <div className="text-gray-600">{booking.driver_phone || 'No phone'}</div>
                  <div className="text-gray-600">{booking.vehicle_details || 'No vehicle details'}</div>
                  <div className="text-sm text-gray-500">
                    {booking.vendor_type === 'absolute_taxi' ? 'Absolute Taxi' : 'Manual Vendor'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Details */}
          {booking.flight_number && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-900 mb-2">Flight Information</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Flight:</span> {booking.flight_number}
                </div>
                {booking.arrival_time && (
                  <div>
                    <span className="text-blue-700">Arrival:</span>{' '}
                    {new Date(booking.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Welcome Package Status */}
          {booking.has_welcome_package && (
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-900">Welcome Package</span>
                </div>
                {booking.package_collected ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Collected
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                )}
              </div>
              <div className="text-sm text-orange-700">
                Pickup Location: {booking.package_pickup_location}
              </div>
            </div>
          )}

          {/* Status Update */}
          {nextStatuses.length > 0 && (
            <div className="border-t pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900">Update Status</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">New Status</label>
                    <Select value={statusUpdate.status} onValueChange={(value) => setStatusUpdate({...statusUpdate, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {nextStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Location (Optional)</label>
                    <input
                      type="text"
                      value={statusUpdate.location}
                      onChange={(e) => setStatusUpdate({...statusUpdate, location: e.target.value})}
                      placeholder="Current location"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <Textarea
                    value={statusUpdate.notes}
                    onChange={(e) => setStatusUpdate({...statusUpdate, notes: e.target.value})}
                    placeholder="Add notes about this status update"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleStatusUpdate}
                  disabled={updating || !statusUpdate.status}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {updating ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </div>
          )}

          {/* Booking Metadata */}
          <div className="border-t pt-4 text-sm text-gray-500">
            <div>Created by: {booking.created_by}</div>
            <div>Created: {new Date(booking.created_at).toLocaleString()}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}