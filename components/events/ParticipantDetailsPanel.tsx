"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Calendar, Phone, Mail, Home, MapPin, Users, Car, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { useAuthenticatedApi } from "@/lib/auth";
import ParticipantQRCode from "./ParticipantQRCode";

interface ParticipantDetailsProps {
  participantId: number;
  participantName: string;
  participantEmail: string;
  eventId: number;
  tenantSlug: string;
  isOpen: boolean;
  onToggle: () => void;
}

interface DrinkVoucherAllocation {
  id: number;
  allocation_type: string;
  quantity: number;
  status: string;
  allocated_date: string;
  notes?: string;
}

interface AccommodationDetails {
  type: string;
  name: string;
  location: string;
  address: string;
  check_in_date?: string;
  check_out_date?: string;
  status?: string;
  room_capacity?: number;
  room_occupants?: number;
  is_shared?: boolean;
}

interface TransportDetails {
  id: number;
  booking_type: string;
  status: string;
  pickup_locations: string[];
  destination: string;
  scheduled_time: string;
  has_welcome_package: boolean;
  package_pickup_location?: string;
  package_collected: boolean;
  vendor_name?: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_details?: string;
  flight_number?: string;
  arrival_time?: string;
}

interface ParticipantDetails {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  registration_type: string;
  registered_by: string;
  created_at: string;
}

export default function ParticipantDetailsPanel({
  participantId,
  participantName,

  eventId,
  tenantSlug,
  isOpen,

}: ParticipantDetailsProps) {
  const [participantDetails, setParticipantDetails] = useState<ParticipantDetails | null>(null);
  const [drinkVoucherAllocations, setDrinkVoucherAllocations] = useState<DrinkVoucherAllocation[]>([]);
  const [accommodationDetails, setAccommodationDetails] = useState<AccommodationDetails[]>([]);
  const [transportDetails, setTransportDetails] = useState<TransportDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const { apiClient } = useAuthenticatedApi();

  const fetchParticipantData = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {

      
      // Fetch participant details
      try {
        const participantData = await apiClient.request(
          `/event-registration/participant/${participantId}`,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );

        setParticipantDetails(participantData as ParticipantDetails);
      } catch (error) {
        console.error('Failed to fetch participant details:', error);
      }

      // Fetch drink voucher allocations
      try {
        const voucherData = await apiClient.request(
          `/allocations/participant/${participantId}?event_id=${eventId}`,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );

        // Filter to only show drink vouchers, hide inventory items
        const drinkVouchers = (voucherData as DrinkVoucherAllocation[]).filter((allocation: DrinkVoucherAllocation) => 
          allocation.allocation_type === 'drink_voucher' && 
          !allocation.notes?.includes('ITEMS:')
        );
        setDrinkVoucherAllocations(drinkVouchers);
      } catch (error) {
        console.error('Failed to fetch voucher allocations:', error);
        setDrinkVoucherAllocations([]);
      }

      // Fetch accommodation details
      try {

        const accommodationData = await apiClient.request(
          `/accommodation/participant/${participantId}/accommodation`,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );

        setAccommodationDetails(accommodationData as AccommodationDetails[]);
      } catch (error) {
        console.error('Failed to fetch accommodation details:', error);
        setAccommodationDetails([]);
      }

      // Fetch transport details
      try {

        const transportData = await apiClient.request(
          `/transport/bookings/?participant_id=${participantId}`,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );

        setTransportDetails(transportData as TransportDetails[]);
      } catch (error) {
        console.error('Failed to fetch transport details:', error);
        setTransportDetails([]);
      }
    } catch (error) {
      console.error("Error fetching participant data:", error);
    } finally {
      setLoading(false);
    }
  }, [isOpen, participantId, apiClient, tenantSlug, eventId]);

  useEffect(() => {
    fetchParticipantData();
  }, [fetchParticipantData]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "selected":
      case "attended":
        return "bg-green-100 text-green-800";
      case "pending":
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
      case "not_selected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-2 text-gray-600">Loading details...</span>
            </div>
          ) : (
            <>
              {/* Participant Information */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-red-600" />
                  <h4 className="font-medium text-gray-900">Participant Information</h4>
                </div>
                {participantDetails && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium truncate">{participantDetails.email}</span>
                      </div>
                      {participantDetails.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">{participantDetails.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Role:</span>
                        <Badge className="text-xs px-1 py-0">{participantDetails.role}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Status:</span>
                        <Badge className={`text-xs px-1 py-0 ${getStatusColor(participantDetails.status)}`}>
                          {participantDetails.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">Registered:</span>
                        <span className="font-medium">{formatDate(participantDetails.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">By:</span>
                        <span className="font-medium truncate">{participantDetails.registered_by}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Transport */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-red-600" />
                    <h5 className="font-medium text-gray-900 text-sm">Transport</h5>
                    <Badge variant="outline" className="text-xs px-1">
                      {transportDetails.length}
                    </Badge>
                  </div>
                  {transportDetails.length > 0 ? (
                    <div className="space-y-2">
                      {transportDetails.map((transport) => (
                        <div key={transport.id} className="bg-gray-50 rounded p-2 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs px-1">
                              {transport.booking_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge className={`text-xs px-1 ${getStatusColor(transport.status)}`}>
                              {transport.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600 truncate">{transport.pickup_locations.join(', ')} → {transport.destination}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">{formatDate(transport.scheduled_time)} {formatTime(transport.scheduled_time)}</span>
                            </div>
                            {transport.driver_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600 truncate">{transport.driver_name}</span>
                              </div>
                            )}
                            {transport.has_welcome_package && (
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3 text-orange-400" />
                                <Badge variant="outline" className={`text-xs px-1 ${
                                  transport.package_collected ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {transport.package_collected ? 'Collected' : 'Pending'}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded p-2 text-center text-gray-500 text-xs">
                      No transport
                    </div>
                  )}
                </div>

                {/* Accommodation */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-red-600" />
                    <h5 className="font-medium text-gray-900 text-sm">Accommodation</h5>
                    <Badge variant="outline" className="text-xs px-1">
                      {accommodationDetails.length}
                    </Badge>
                  </div>
                  {accommodationDetails.length > 0 ? (
                    <div className="space-y-2">
                      {accommodationDetails.map((accommodation, index) => (
                        <div key={index} className="bg-gray-50 rounded p-2 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs px-1">
                              {accommodation.type.toUpperCase()}
                            </Badge>
                            {accommodation.status && (
                              <Badge className={`text-xs px-1 ${getStatusColor(accommodation.status)}`}>
                                {accommodation.status.replace("_", " ").toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Home className="h-3 w-3 text-gray-400" />
                              <span className="font-medium truncate">{accommodation.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600 truncate">{accommodation.location}</span>
                            </div>
                            {accommodation.check_in_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600">{formatDate(accommodation.check_in_date)} - {accommodation.check_out_date ? formatDate(accommodation.check_out_date) : 'TBD'}</span>
                              </div>
                            )}
                            {accommodation.is_shared !== undefined && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600">
                                  {accommodation.is_shared ? 'Shared' : 'Private'} ({accommodation.room_occupants}/{accommodation.room_capacity})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded p-2 text-center text-gray-500 text-xs">
                      No accommodation
                    </div>
                  )}
                </div>

                {/* Drink Vouchers */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 text-red-600">🍺</div>
                    <h5 className="font-medium text-gray-900 text-sm">Drink Vouchers</h5>
                    <Badge variant="outline" className="text-xs px-1">
                      {drinkVoucherAllocations.length}
                    </Badge>
                  </div>
                  {drinkVoucherAllocations.length > 0 ? (
                    <div className="space-y-2">
                      {drinkVoucherAllocations.map((allocation) => (
                        <div key={allocation.id} className="bg-gray-50 rounded p-2 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <Badge className={`text-xs px-1 ${getStatusColor(allocation.status)}`}>
                              {allocation.status.toUpperCase()}
                            </Badge>
                            <span className="text-gray-600">{formatDate(allocation.allocated_date)}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-medium">{allocation.quantity}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">Used:</span>
                              <span className="font-medium">0 / {allocation.quantity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded p-2 text-center text-gray-500 text-xs">
                      No vouchers
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Section */}
              <div className="mt-4">
                <ParticipantQRCode
                  participantId={participantId}
                  participantName={participantName}
                  eventId={eventId}
                  tenantSlug={tenantSlug}
                />
              </div>
            </>
          )}
        </div>
    </div>
  );
}