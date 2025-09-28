"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Car, Package, MapPin, Clock, User, Phone, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import Swal from "sweetalert2";
import BookingDetailsModal from "./BookingDetailsModal";

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

interface TransportVendor {
  id: number;
  name: string;
  vendor_type: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

interface TransportBookingsListProps {
  bookings: TransportBooking[];
  vendors: TransportVendor[];
  canEdit: boolean;
  onRefresh: () => void;
  onCreateBooking: () => void;
  onEditBooking: (booking: TransportBooking) => void;
  apiClient: { getToken: () => string };
  tenantSlug: string;
}

export default function TransportBookingsList({
  bookings,

  canEdit,
  onRefresh,
  onCreateBooking,
  onEditBooking,
  apiClient,
  tenantSlug
}: TransportBookingsListProps) {
  const [filters, setFilters] = useState({
    status: 'all',
    booking_type: 'all',
    vendor_type: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<TransportBooking | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-red-100 text-red-800",
      package_collected: "bg-orange-100 text-orange-800",
      visitor_picked_up: "bg-red-100 text-red-800",
      in_transit: "bg-red-100 text-red-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800"
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case 'airport_pickup':
        return <Car className="w-4 h-4" />;
      case 'event_transfer':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filters.status !== 'all' && booking.status !== filters.status) return false;
    if (filters.booking_type !== 'all' && booking.booking_type !== filters.booking_type) return false;
    if (filters.vendor_type !== 'all' && booking.vendor_type !== filters.vendor_type) return false;
    return true;
  });

  const handleViewDetails = (booking: TransportBooking) => {
    setSelectedBooking(booking);
    setDetailsModalOpen(true);
  };

  const handleDeleteBooking = async (booking: TransportBooking) => {
    if (booking.status !== 'pending') {
      toast({ title: "Error", description: "Cannot delete confirmed booking", variant: "destructive" });
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Transport Booking?',
      text: `Are you sure you want to delete this ${booking.booking_type.replace('_', ' ')} booking?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setDeleting(booking.id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport/bookings/${booking.id}?tenant_context=${tenantSlug}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${apiClient.getToken()}` },
        }
      );

      if (response.ok) {
        toast({ title: "Success", description: "Booking deleted successfully" });
        onRefresh();
      } else {
        const errorData = await response.json();
        toast({ title: "Error", description: errorData.detail || "Failed to delete booking", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          {(filters.status !== 'all' || filters.booking_type !== 'all' || filters.vendor_type !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ status: 'all', booking_type: 'all', vendor_type: 'all' })}
            >
              Clear Filters
            </Button>
          )}
        </div>
        
        {canEdit && (
          <Button 
            onClick={onCreateBooking} 
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Booking
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger className="h-8 bg-white border border-gray-300">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="package_collected">Package Collected</SelectItem>
                    <SelectItem value="visitor_picked_up">Visitor Picked Up</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Booking Type</label>
                <Select value={filters.booking_type} onValueChange={(value) => setFilters({...filters, booking_type: value})}>
                  <SelectTrigger className="h-8 bg-white border border-gray-300">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
                    <SelectItem value="event_transfer">Event Transfer</SelectItem>
                    <SelectItem value="office_visit">Office Visit</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Vendor Type</label>
                <Select value={filters.vendor_type} onValueChange={(value) => setFilters({...filters, vendor_type: value})}>
                  <SelectTrigger className="h-8 bg-white border border-gray-300">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="absolute_taxi">Absolute Taxi</SelectItem>
                    <SelectItem value="manual_vendor">Manual Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                  <Car className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No transport bookings found</h3>
                <p className="text-gray-500">Create your first transport booking to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-red-500 to-red-700"></div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md text-white">
                        {getBookingTypeIcon(booking.booking_type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {booking.booking_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <div className="flex items-center gap-3">
                          <Badge className={`${getStatusBadge(booking.status)} font-semibold px-3 py-1 rounded-full`}>
                            {booking.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          {booking.has_welcome_package && (
                            <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                              <Package className="w-3 h-3" />
                              <span className="text-xs font-medium">Package</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(booking)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canEdit && booking.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditBooking(booking)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBooking(booking)}
                            disabled={deleting === booking.id}
                            className="h-10 w-10 p-0 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-semibold">Scheduled Time</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {new Date(booking.scheduled_time).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-red-600 font-medium">
                        {new Date(booking.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-semibold">Passengers</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {booking.participants?.length || booking.participant_ids.length}
                      </div>
                      <div className="text-gray-600 text-sm truncate">
                        {booking.participants?.map(p => p.name).join(', ') || 'Loading...'}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-semibold">Route</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 truncate">
                        {booking.pickup_locations[0]}
                      </div>
                      <div className="text-red-600 text-sm font-medium">
                        → {booking.destination}
                      </div>
                      {booking.pickup_locations.length > 1 && (
                        <div className="text-gray-500 text-xs mt-1">
                          +{booking.pickup_locations.length - 1} more stops
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-semibold">Driver</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {booking.driver_name || 'Not assigned'}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {booking.driver_phone || booking.vendor_name}
                      </div>
                    </div>
                  </div>

                  {booking.flight_number && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 text-red-700 mb-2">
                        <Car className="w-4 h-4" />
                        <span className="font-semibold">Flight Information</span>
                      </div>
                      <div className="text-red-900">
                        <span className="font-bold">Flight:</span> {booking.flight_number}
                        {booking.arrival_time && (
                          <span className="ml-4">
                            <span className="font-bold">Arrival:</span> {new Date(booking.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {booking.has_welcome_package && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-orange-700">
                          <Package className="w-4 h-4" />
                          <span className="font-semibold">Welcome Package</span>
                        </div>
                        {booking.package_collected ? (
                          <Badge className="bg-green-500 text-white font-semibold px-3 py-1 rounded-full">
                            Collected
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-500 text-white font-semibold px-3 py-1 rounded-full">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="text-orange-900">
                        <span className="font-bold">Pickup Location:</span> {booking.package_pickup_location}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BookingDetailsModal
        booking={selectedBooking}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onRefresh={onRefresh}
        apiClient={apiClient}
        tenantSlug={tenantSlug}
      />
    </div>
  );
}