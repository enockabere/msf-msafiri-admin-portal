"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Calendar, Phone, Mail, Home, MapPin, Users, Car, Package, Minus, Edit, Badge as BadgeIcon, FileText, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { useAuthenticatedApi } from "@/lib/auth";
import ParticipantQRCode from "./ParticipantQRCode";
import ParticipantBadge from "./ParticipantBadge";

import ParticipantPDFReport from "./reports/ParticipantPDFReport";
import { toast } from "@/hooks/use-toast";

interface ParticipantDetailsProps {
  participantId: number;
  participantName: string;
  participantEmail: string;
  eventId: number;
  tenantSlug: string;
  isOpen: boolean;
  onToggle: () => void;
  canManageEvents?: boolean;
}

interface DrinkVoucherAllocation {
  id: number;
  allocation_type: string;
  quantity: number;
  current_quantity?: number;
  status: string;
  allocated_date: string;
  notes?: string;
  redeemed?: number;
}

interface QRAllocationData {
  participant_id: number;
  participant_name: string;
  participant_email: string;
  event_id: number;
  event_title: string;
  event_location: string;
  event_start_date?: string;
  event_end_date?: string;
  total_drinks: number;
  remaining_drinks: number;
  redeemed_drinks?: number;
}

interface ParticipantQRResponse {
  qr_token: string;
  qr_data_url: string;
  allocation_summary: QRAllocationData;
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
  country?: string;
  position?: string;
  department?: string;
  gender?: string;
  eta?: string;
  requires_eta?: boolean;
  passport_document?: boolean;
  ticket_document?: boolean;
}

interface FlightItinerary {
  id: number;
  departure_city: string;
  arrival_city: string;
  departure_date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
  airline: string;
  flight_number: string;
  booking_reference?: string;
  seat_number?: string;
  ticket_type: string;
  status: string;
  created_at: string;
}

export default function ParticipantDetailsPanel({
  participantId,
  participantName,
  participantEmail,
  eventId,
  tenantSlug,
  isOpen,

  canManageEvents = true,
}: ParticipantDetailsProps) {
  const [participantDetails, setParticipantDetails] = useState<ParticipantDetails | null>(null);
  const [drinkVoucherAllocations, setDrinkVoucherAllocations] = useState<DrinkVoucherAllocation[]>([]);
  const [voucherSummary, setVoucherSummary] = useState<QRAllocationData | null>(null);
  const [accommodationDetails, setAccommodationDetails] = useState<AccommodationDetails[]>([]);
  const [transportDetails, setTransportDetails] = useState<TransportDetails[]>([]);
  const [flightItineraries, setFlightItineraries] = useState<FlightItinerary[]>([]);
  const [eventDetails, setEventDetails] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const [showPDFReport, setShowPDFReport] = useState(false);
  const [redeemQuantity, setRedeemQuantity] = useState(1);
  const [editAssigned, setEditAssigned] = useState(0);
  const [editRedeemed, setEditRedeemed] = useState(0);
  const [redeeming, setRedeeming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<DrinkVoucherAllocation | null>(null);
  const [qrRefreshKey, setQrRefreshKey] = useState(0);
  const [qrToken, setQrToken] = useState<string | null>(null);

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

      // Fetch event details
      try {
        const eventData = await apiClient.request(
          `/events?tenant_slug=${tenantSlug}`,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );
        const eventResponse = eventData as { data?: Record<string, unknown>[] } | Record<string, unknown>[];
        const events = Array.isArray(eventResponse) ? eventResponse : (eventResponse.data || []);
        const currentEvent = events.find((e: Record<string, unknown>) => e.id === eventId);
        
        // Calculate actual event status based on dates
        if (currentEvent) {
          const now = new Date();
          const startDate = new Date(currentEvent.start_date);
          const endDate = new Date(currentEvent.end_date);
          
          let calculatedStatus = 'upcoming';
          if (now >= startDate && now <= endDate) {
            calculatedStatus = 'ongoing';
          } else if (now > endDate) {
            calculatedStatus = 'ended';
          }
          
          currentEvent.calculated_status = calculatedStatus;
          
          console.warn('DEBUG - Event details:', {
            id: currentEvent.id,
            startDate: currentEvent.start_date,
            endDate: currentEvent.end_date,
            dbStatus: (currentEvent as Record<string, unknown>).event_status,
            calculatedStatus,
            now: now.toISOString()
          });
        }
        
        setEventDetails(currentEvent);
      } catch (error) {
        console.error('Failed to fetch event details:', error);
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

      // Fetch voucher summary from QR endpoint for accurate totals
      try {
        const qrData = await apiClient.request(
          `/participants/${participantId}/qr`,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );
        const qrResponse = qrData as ParticipantQRResponse;
        console.warn('🎫 QR Data fetched:', qrResponse);
        console.warn('🔗 QR Token:', qrResponse.qr_token);
        console.warn('📱 QR URL should be:', `${process.env.NEXT_PUBLIC_BASE_URL}/public/qr/${qrResponse.qr_token}`);
        setVoucherSummary(qrResponse.allocation_summary);
        setQrToken(qrResponse.qr_token);
      } catch (error) {
        console.error('Failed to fetch voucher summary:', error);
        setVoucherSummary(null);
      }

      // Fetch accommodation details
      try {
        const accommodationUrl = `/accommodation/participant/${participantId}/accommodation?event_id=${eventId}`;
        console.log(`DEBUG ACCOMMODATION: Fetching from URL: ${accommodationUrl}`);
        console.log(`DEBUG ACCOMMODATION: Participant ID: ${participantId}, Event ID: ${eventId}, Tenant: ${tenantSlug}`);
        console.log(`DEBUG ACCOMMODATION: Full API base URL will be: ${apiClient.getBaseUrl()}${accommodationUrl}`);

        const accommodationData = await apiClient.request(
          accommodationUrl,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );

        console.log(`DEBUG ACCOMMODATION: SUCCESS - Received ${accommodationData.length} accommodations:`, accommodationData);
        setAccommodationDetails(accommodationData as AccommodationDetails[]);
      } catch (error: any) {
        console.error('DEBUG ACCOMMODATION: ERROR occurred:', error);
        console.error('DEBUG ACCOMMODATION: Error message:', error.message);
        console.error('DEBUG ACCOMMODATION: Error status:', error.status);
        console.error('DEBUG ACCOMMODATION: Full error object:', error);
        setAccommodationDetails([]);
      }

      // Fetch transport details
      try {

        const transportData = await apiClient.request(
          `/transport/bookings/?participant_id=${participantId}&event_id=${eventId}`,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );

        setTransportDetails(transportData as TransportDetails[]);
      } catch (error) {
        console.error('Failed to fetch transport details:', error);
        setTransportDetails([]);
      }

      // Fetch flight itineraries
      try {
        const flightUrl = `/flight-itinerary/participant/${participantId}?event_id=${eventId}`;
        console.log(`DEBUG FLIGHT: Fetching from URL: ${flightUrl}`);
        console.log(`DEBUG FLIGHT: Participant ID: ${participantId}, Event ID: ${eventId}, Tenant: ${tenantSlug}`);
        console.log(`DEBUG FLIGHT: Full API base URL will be: ${apiClient.getBaseUrl()}${flightUrl}`);
        
        const flightData = await apiClient.request(
          flightUrl,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );
        
        console.log(`DEBUG FLIGHT: SUCCESS - Received ${Array.isArray(flightData) ? flightData.length : 'non-array'} flight itineraries:`, flightData);
        setFlightItineraries(flightData as FlightItinerary[]);
      } catch (error: any) {
        console.error('DEBUG FLIGHT: ERROR occurred:', error);
        console.error('DEBUG FLIGHT: Error message:', error.message);
        console.error('DEBUG FLIGHT: Error status:', error.status);
        console.error('DEBUG FLIGHT: Full error object:', error);
        setFlightItineraries([]);
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

  const handleRedeemVoucher = async () => {
    if (!selectedAllocation) return;

    setRedeeming(true);
    try {
      console.warn('Redeeming voucher:', {
        allocationId: selectedAllocation.id,
        quantity: redeemQuantity,
        participantId,
        tenantSlug
      });
      
      // If no allocation ID, find the first allocation for this participant
      let allocationId = selectedAllocation.id;
      if (!allocationId || allocationId === 0) {
        const allocationsResponse = await apiClient.request(
          `/allocations/participant/${participantId}?event_id=${eventId}`,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );
        const allocations = allocationsResponse as DrinkVoucherAllocation[];
        const drinkAllocation = allocations.find(a => a.allocation_type === 'drink_voucher');
        if (drinkAllocation) {
          allocationId = drinkAllocation.id;
        } else {
          throw new Error('No drink voucher allocation found');
        }
      }
      
      // Try the redemption endpoint
      const response = await apiClient.request(
        `/allocations/${allocationId}/redeem`,
        {
          method: 'POST',
          headers: { 'X-Tenant-ID': tenantSlug },
          body: JSON.stringify({ 
            quantity: redeemQuantity,
            participant_id: participantId
          })
        }
      );
      
      console.warn('Redemption response:', response);

      // If successful, refresh data and QR code
      setShowRedeemModal(false);
      await fetchParticipantData();
      setQrRefreshKey(prev => prev + 1);

      // Send notification email
      try {
        await apiClient.request(
          `/participants/${participantId}/voucher-redeemed-notification`,
          {
            method: 'POST',
            headers: { 'X-Tenant-ID': tenantSlug },
            body: JSON.stringify({
              participant_email: participantEmail,
              participant_name: participantName,
              redeemed_quantity: redeemQuantity,
              remaining_quantity: (selectedAllocation.current_quantity || selectedAllocation.quantity) - redeemQuantity
            })
          }
        );
      } catch (emailError) {
        console.warn('Failed to send notification email:', emailError);
      }

      // Show success notification
      const newRemaining = (selectedAllocation.current_quantity || selectedAllocation.quantity) - redeemQuantity;
      toast({
        title: 'Success!',
        description: `Redeemed ${redeemQuantity} voucher${redeemQuantity > 1 ? 's' : ''} for ${participantName}. ${newRemaining < 0 ? `Over-redeemed by ${Math.abs(newRemaining)}` : `${newRemaining} remaining`}. QR code updated.`,
      });
      
      console.warn('Redemption completed successfully');
    } catch (error) {
      console.error('Failed to redeem voucher:', error);
      toast({
        title: 'Error!',
        description: 'Failed to redeem voucher. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRedeeming(false);
    }
  };

  const handleEditVouchers = async () => {
    if (!selectedAllocation) return;

    setEditing(true);
    try {
      // If no allocation ID, find the first allocation for this participant
      let allocationId = selectedAllocation.id;
      if (!allocationId || allocationId === 0) {
        const allocationsResponse = await apiClient.request(
          `/allocations/participant/${participantId}?event_id=${eventId}`,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );
        const allocations = allocationsResponse as DrinkVoucherAllocation[];
        const drinkAllocation = allocations.find(a => a.allocation_type === 'drink_voucher');
        if (drinkAllocation) {
          allocationId = drinkAllocation.id;
        } else {
          throw new Error('No drink voucher allocation found');
        }
      }
      
      // Calculate the net change needed
      const currentAssigned = voucherSummary?.total_drinks || 0;
      const currentRedeemed = voucherSummary?.redeemed_drinks || 0;
      
      const assignedDiff = editAssigned - currentAssigned;
      const redeemedDiff = editRedeemed - currentRedeemed;
      
      // Apply changes by calculating the net effect
      const netChange = assignedDiff - redeemedDiff;
      
      if (netChange > 0) {
        // Net increase in available vouchers (reassign)
        await apiClient.request(
          `/allocations/${allocationId}/reassign`,
          {
            method: 'POST',
            headers: { 'X-Tenant-ID': tenantSlug },
            body: JSON.stringify({ 
              quantity: netChange,
              participant_id: participantId
            })
          }
        );
      } else if (netChange < 0) {
        // Net decrease in available vouchers (redeem)
        await apiClient.request(
          `/allocations/${allocationId}/redeem`,
          {
            method: 'POST',
            headers: { 'X-Tenant-ID': tenantSlug },
            body: JSON.stringify({ 
              quantity: Math.abs(netChange),
              participant_id: participantId
            })
          }
        );
      }
      // If netChange === 0, no API calls needed

      setShowEditModal(false);
      await fetchParticipantData();
      setQrRefreshKey(prev => prev + 1);

      toast({
        title: 'Success!',
        description: `Updated vouchers for ${participantName}. Assigned: ${editAssigned}, Redeemed: ${editRedeemed}, Remaining: ${editAssigned - editRedeemed}. QR code updated.`,
      });
    } catch (error) {
      console.error('Failed to edit vouchers:', error);
      toast({
        title: 'Error!',
        description: 'Failed to update vouchers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setEditing(false);
    }
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
                      {(participantDetails as Record<string, unknown>).country && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Country:</span>
                          <span className="font-medium">{(participantDetails as Record<string, unknown>).country as string}</span>
                        </div>
                      )}
                      {(participantDetails as Record<string, unknown>).position && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Position:</span>
                          <span className="font-medium truncate">{(participantDetails as Record<string, unknown>).position as string}</span>
                        </div>
                      )}
                      {(participantDetails as Record<string, unknown>).department && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Department:</span>
                          <span className="font-medium truncate">{(participantDetails as Record<string, unknown>).department as string}</span>
                        </div>
                      )}
                      {(participantDetails as Record<string, unknown>).gender && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Gender:</span>
                          <span className="font-medium">{(participantDetails as Record<string, unknown>).gender as string}</span>
                        </div>
                      )}
                      {(participantDetails as Record<string, unknown>).travelling_from_country && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Travelling From:</span>
                          <span className="font-medium">{(participantDetails as Record<string, unknown>).travelling_from_country as string}</span>
                        </div>
                      )}
                      {(participantDetails as Record<string, unknown>).requires_eta && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">ETA Required:</span>
                          <Badge className="text-xs px-1 py-0 bg-orange-100 text-orange-800">Yes</Badge>
                        </div>
                      )}
                      {(participantDetails as Record<string, unknown>).passport_document && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Passport:</span>
                          <Badge className="text-xs px-1 py-0 bg-green-100 text-green-800">Uploaded</Badge>
                        </div>
                      )}
                      {(participantDetails as Record<string, unknown>).ticket_document && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Ticket:</span>
                          <Badge className="text-xs px-1 py-0 bg-green-100 text-green-800">Uploaded</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Flight Itineraries */}
              {(() => {
                console.log('DEBUG FLIGHT RENDER: Flight itineraries state:', flightItineraries);
                console.log('DEBUG FLIGHT RENDER: Length:', flightItineraries.length);
                console.log('DEBUG FLIGHT RENDER: Should show section:', flightItineraries.length > 0);
                return flightItineraries.length > 0;
              })() && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="h-4 w-4 text-red-600" />
                    <h4 className="font-medium text-gray-900">Flight Itineraries</h4>
                    <Badge variant="outline" className="text-xs px-1">
                      {flightItineraries.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {flightItineraries.map((flight) => {
                      console.log('DEBUG FLIGHT RENDER: Rendering flight item:', flight);
                      return (
                      <div key={flight.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs px-1">
                              {flight.ticket_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge className={`text-xs px-1 ${getStatusColor(flight.status)}`}>
                              {flight.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {flight.airline} {flight.flight_number}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="font-medium text-gray-900 mb-1">Departure</div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="font-medium">{flight.departure_city}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span>{formatDate(flight.departure_date)} {flight.departure_time}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 mb-1">Arrival</div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="font-medium">{flight.arrival_city}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span>{formatDate(flight.arrival_date)} {flight.arrival_time}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {(flight.booking_reference || flight.seat_number) && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {flight.booking_reference && (
                                <div>
                                  <span className="text-gray-600">Booking Ref:</span>
                                  <span className="font-medium ml-1">{flight.booking_reference}</span>
                                </div>
                              )}
                              {flight.seat_number && (
                                <div>
                                  <span className="text-gray-600">Seat:</span>
                                  <span className="font-medium ml-1">{flight.seat_number}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                      {voucherSummary?.total_drinks || 0}
                    </Badge>
                  </div>
                  {voucherSummary && voucherSummary.total_drinks > 0 ? (
                    <div className="bg-gray-50 rounded p-2 text-xs">
                      <div className="space-y-1">
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <div className="text-center p-1 bg-blue-50 rounded">
                            <div className="font-medium text-blue-600">{voucherSummary.total_drinks}</div>
                            <div className="text-gray-600">Assigned</div>
                          </div>
                          <div className="text-center p-1 bg-red-50 rounded">
                            <div className="font-medium text-red-600">{voucherSummary.redeemed_drinks || 0}</div>
                            <div className="text-gray-600">Redeemed</div>
                          </div>
                          <div className="text-center p-1 bg-green-50 rounded">
                            <div className={`font-medium ${voucherSummary.remaining_drinks < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {voucherSummary.remaining_drinks}
                            </div>
                            <div className="text-gray-600">Remaining</div>
                          </div>
                        </div>
                        {(() => {
                          const calculatedStatus = eventDetails?.calculated_status;
                          const shouldShow = canManageEvents && voucherSummary.total_drinks > 0 && calculatedStatus !== 'ended';
                          console.warn('DEBUG - Voucher buttons visibility:', {
                            canManageEvents,
                            totalDrinks: voucherSummary.total_drinks,
                            calculatedStatus,
                            shouldShow
                          });
                          return shouldShow;
                        })() && (
                          <div className="flex gap-1 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Create a dummy allocation if none exists
                                const allocation = drinkVoucherAllocations.length > 0 
                                  ? drinkVoucherAllocations[0]
                                  : {
                                      id: 0, // Will be handled by API
                                      allocation_type: 'drink_voucher',
                                      quantity: voucherSummary.total_drinks,
                                      current_quantity: voucherSummary.remaining_drinks,
                                      status: 'active',
                                      allocated_date: new Date().toISOString(),
                                      redeemed: voucherSummary.redeemed_drinks || 0
                                    };
                                setSelectedAllocation(allocation);
                                setRedeemQuantity(1);
                                setShowRedeemModal(true);
                              }}
                              className="flex-1 h-6 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            >
                              <Minus className="h-3 w-3 mr-1" />
                              Redeem
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Create a dummy allocation if none exists
                                const allocation = drinkVoucherAllocations.length > 0 
                                  ? drinkVoucherAllocations[0]
                                  : {
                                      id: 0, // Will be handled by API
                                      allocation_type: 'drink_voucher',
                                      quantity: voucherSummary.total_drinks,
                                      current_quantity: voucherSummary.remaining_drinks,
                                      status: 'active',
                                      allocated_date: new Date().toISOString(),
                                      redeemed: voucherSummary.redeemed_drinks || 0
                                    };
                                setSelectedAllocation(allocation);
                                setEditAssigned(voucherSummary.total_drinks);
                                setEditRedeemed(voucherSummary.redeemed_drinks || 0);
                                setShowEditModal(true);
                              }}
                              className="flex-1 h-6 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit Vouchers
                            </Button>
                          </div>
                        )}
                        {qrToken && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                            <div className="text-xs text-blue-800 font-medium mb-1">QR Code URL:</div>
                            <div className="text-xs font-mono text-blue-600 break-all">
                              {process.env.NEXT_PUBLIC_BASE_URL}/public/qr/{qrToken}
                            </div>
                            <div className="mt-1">
                              <a 
                                href={`${process.env.NEXT_PUBLIC_BASE_URL}/public/qr/${qrToken}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Test QR Link
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded p-2 text-center text-gray-500 text-xs">
                      No vouchers allocated
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBadge(true)}
                  className="gap-2 h-10 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-medium"
                >
                  <BadgeIcon className="h-4 w-4" />
                  Event Badge
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPDFReport(true)}
                  className="gap-2 h-10 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 font-medium"
                >
                  <FileText className="h-4 w-4" />
                  PDF Report
                </Button>
              </div>

              {/* QR Code Section */}
              <div className="mt-4">
                <ParticipantQRCode
                  key={qrRefreshKey}
                  participantId={participantId}
                  participantName={participantName}
                  eventId={eventId}
                  tenantSlug={tenantSlug}
                />
              </div>



              {/* Redeem Voucher Modal */}
              <Dialog open={showRedeemModal} onOpenChange={setShowRedeemModal}>
                <DialogContent className="max-w-md bg-white border shadow-lg">
                  <DialogHeader>
                    <DialogTitle>Redeem Drink Vouchers</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Redeeming vouchers for: <span className="font-medium">{participantName}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Current vouchers: <span className="font-medium">{selectedAllocation?.current_quantity || 0}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Note: You can redeem more than available (over-redemption allowed)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity to redeem
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={redeemQuantity}
                        onChange={(e) => setRedeemQuantity(parseInt(e.target.value) || 1)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowRedeemModal(false)}
                      disabled={redeeming}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRedeemVoucher}
                      disabled={redeeming || redeemQuantity < 1}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {redeeming ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Redeeming...
                        </>
                      ) : (
                        `Redeem ${redeemQuantity} Voucher${redeemQuantity > 1 ? 's' : ''}`
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Vouchers Modal */}
              <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="max-w-md bg-white border shadow-lg">
                  <DialogHeader>
                    <DialogTitle>Edit Drink Vouchers</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Editing vouchers for: <span className="font-medium">{participantName}</span>
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assigned
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={editAssigned}
                          onChange={(e) => setEditAssigned(parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Redeemed
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={editRedeemed}
                          onChange={(e) => setEditRedeemed(parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-sm text-gray-600 mb-1">Preview:</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-blue-100 rounded">
                          <div className="font-medium text-blue-600">{editAssigned}</div>
                          <div className="text-gray-600">Assigned</div>
                        </div>
                        <div className="text-center p-2 bg-red-100 rounded">
                          <div className="font-medium text-red-600">{editRedeemed}</div>
                          <div className="text-gray-600">Redeemed</div>
                        </div>
                        <div className="text-center p-2 bg-green-100 rounded">
                          <div className={`font-medium ${(editAssigned - editRedeemed) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {editAssigned - editRedeemed}
                          </div>
                          <div className="text-gray-600">Remaining</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowEditModal(false)}
                      disabled={editing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEditVouchers}
                      disabled={editing || editAssigned < 0 || editRedeemed < 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {editing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        'Update Vouchers'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Participant Badge Modal */}
              <ParticipantBadge
                participantId={participantId}
                participantName={participantName}
                participantEmail={participantEmail}
                tenantSlug={tenantSlug}
                isOpen={showBadge}
                onClose={() => setShowBadge(false)}
                eventDetails={eventDetails as { id: number; title: string; location: string; start_date: string; end_date: string } | undefined}
              />

              {/* PDF Report Modal */}
              <ParticipantPDFReport
                participantId={participantId}
                participantName={participantName}
                participantEmail={participantEmail}
                eventDetails={eventDetails as Record<string, unknown> | null}
                transportDetails={transportDetails}
                accommodationDetails={accommodationDetails}
                voucherSummary={voucherSummary}
                isOpen={showPDFReport}
                onClose={() => setShowPDFReport(false)}
              />
            </>
          )}
        </div>
    </div>
  );
}