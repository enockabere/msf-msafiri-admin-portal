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
  const [travelChecklistProgress, setTravelChecklistProgress] = useState<any>(null);

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
          { 
            headers: { 
              'X-Tenant-ID': tenantSlug,
              'X-Tenant-Context': tenantSlug  // 🔥 Add explicit tenant context
            } 
          }
        );

        console.log(`DEBUG ACCOMMODATION: SUCCESS - Received ${Array.isArray(accommodationData) ? accommodationData.length : 'non-array'} accommodations:`, accommodationData);
        
        // 🔥 CRITICAL FIX: Ensure we handle the response correctly
        if (Array.isArray(accommodationData)) {
          setAccommodationDetails(accommodationData as AccommodationDetails[]);
        } else {
          console.warn('DEBUG ACCOMMODATION: Response is not an array, setting empty array');
          setAccommodationDetails([]);
        }
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

      // Fetch travel checklist progress
      try {
        const checklistUrl = `/travel-checklist/progress/${eventId}/${participantEmail}`;
        console.log(`🔍 PORTAL DEBUG: Fetching checklist from URL: ${checklistUrl}`);
        console.log(`🔍 PORTAL DEBUG: Participant Email: ${participantEmail}, Event ID: ${eventId}`);
        
        const checklistData = await apiClient.request(
          checklistUrl,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );
        
        console.log(`✅ PORTAL DEBUG: SUCCESS - Received checklist progress:`, checklistData);
        setTravelChecklistProgress(checklistData);
      } catch (error: any) {
        console.error('❌ PORTAL DEBUG: ERROR fetching checklist:', error);
        console.error('❌ PORTAL DEBUG: Error message:', error.message);
        console.error('❌ PORTAL DEBUG: Error status:', error.status);
        setTravelChecklistProgress(null);
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
    <div className="border border-gray-200 rounded-xl bg-white shadow-lg">
      <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-2 text-gray-600">Loading details...</span>
            </div>
          ) : (
            <>
              {/* Participant Information - Enhanced */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <User className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-base">Participant Information</h4>
                    <p className="text-xs text-gray-500">Basic details and registration info</p>
                  </div>
                </div>
                {participantDetails && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
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

              {/* Flight Itineraries - Enhanced Design */}
              {(() => {
                console.log('DEBUG FLIGHT RENDER: Flight itineraries state:', flightItineraries);
                console.log('DEBUG FLIGHT RENDER: Length:', flightItineraries.length);
                console.log('DEBUG FLIGHT RENDER: Should show section:', flightItineraries.length > 0);
                return flightItineraries.length > 0;
              })() && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Plane className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-base">Flight Itineraries</h4>
                        <p className="text-xs text-gray-500">Travel details and bookings</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-sm px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                      {flightItineraries.length} {flightItineraries.length === 1 ? 'Flight' : 'Flights'}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {flightItineraries.map((flight) => {
                      console.log('DEBUG FLIGHT RENDER: Rendering flight item:', flight);
                      return (
                      <div key={flight.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        {/* Header with airline info and status */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                              <Plane className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-base">
                                {flight.airline} {flight.flight_number}
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                {flight.ticket_type.replace('_', ' ').charAt(0).toUpperCase() + flight.ticket_type.replace('_', ' ').slice(1)}
                              </div>
                            </div>
                          </div>
                          <Badge className={`text-xs px-3 py-1 ${getStatusColor(flight.status)}`}>
                            {flight.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        {/* Flight route visualization */}
                        <div className="bg-white rounded-lg p-4 mb-3">
                          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                            {/* Departure */}
                            <div className="text-left">
                              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Departure</div>
                              <div className="font-bold text-xl text-gray-900 mb-1">{flight.departure_city}</div>
                              <div className="flex items-center gap-1 text-sm text-gray-700">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{formatDate(flight.departure_date)}</span>
                              </div>
                              <div className="text-lg font-semibold text-blue-600 mt-1">
                                {flight.departure_time}
                              </div>
                            </div>

                            {/* Arrow indicator */}
                            <div className="flex flex-col items-center px-4">
                              <div className="w-16 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 relative">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                  <div className="w-0 h-0 border-l-8 border-l-indigo-400 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mt-2 whitespace-nowrap">
                                <Plane className="h-3 w-3 inline mr-1" />
                                Flight
                              </div>
                            </div>

                            {/* Arrival */}
                            <div className="text-right">
                              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Arrival</div>
                              <div className="font-bold text-xl text-gray-900 mb-1">{flight.arrival_city}</div>
                              <div className="flex items-center gap-1 justify-end text-sm text-gray-700">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{formatDate(flight.arrival_date)}</span>
                              </div>
                              <div className="text-lg font-semibold text-indigo-600 mt-1">
                                {flight.arrival_time}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Booking details */}
                        {(flight.booking_reference || flight.seat_number) && (
                          <div className="flex items-center gap-4 text-sm bg-white rounded-lg p-3">
                            {flight.booking_reference && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 font-medium">Booking Ref:</span>
                                <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                  {flight.booking_reference}
                                </span>
                              </div>
                            )}
                            {flight.seat_number && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 font-medium">Seat:</span>
                                <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                  {flight.seat_number}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ETA & Travel Requirements - Enhanced Section */}
              {participantDetails && ((participantDetails as Record<string, unknown>).requires_eta ||
                (participantDetails as Record<string, unknown>).passport_document ||
                (participantDetails as Record<string, unknown>).ticket_document) && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-base">Travel Requirements</h4>
                        <p className="text-xs text-gray-500">Document compliance and ETA status</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Debug Info */}
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-xs font-mono text-yellow-800">
                      <div>🔍 PORTAL DEBUG: Travel Requirements Status</div>
                      <div>📧 Participant: {participantEmail}</div>
                      <div>🎫 Event ID: {eventId}</div>
                      <div>📋 Passport Document: {String((participantDetails as Record<string, unknown>).passport_document)}</div>
                      <div>✈️ Ticket Document: {String((participantDetails as Record<string, unknown>).ticket_document)}</div>
                      <div>🌍 Requires ETA: {String((participantDetails as Record<string, unknown>).requires_eta)}</div>
                      <div>💾 Mobile Checklist Status: {travelChecklistProgress ? 'Loaded' : 'Not Loaded'}</div>
                      {travelChecklistProgress && (
                        <>
                          <div>✅ Checklist Completed: {String(travelChecklistProgress.completed)}</div>
                          <div>📝 Checklist Items: {JSON.stringify(travelChecklistProgress.checklist_items)}</div>
                          <div>🕰️ Last Updated: {travelChecklistProgress.updated_at || 'Never'}</div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Mobile Checklist Status */}
                  {travelChecklistProgress && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-blue-100 p-1.5 rounded">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-semibold text-gray-900">Mobile Checklist Status</span>
                        <Badge className={`text-xs px-2 py-1 ${
                          travelChecklistProgress.completed
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-orange-100 text-orange-800 border-orange-300'
                        }`}>
                          {travelChecklistProgress.completed ? '✅ Complete' : '🔄 Pending'}
                        </Badge>
                      </div>
                      
                      {travelChecklistProgress.checklist_items && Object.keys(travelChecklistProgress.checklist_items).length > 0 && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(travelChecklistProgress.checklist_items).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 bg-white p-2 rounded">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                value ? 'bg-green-500 border-green-500' : 'border-gray-300'
                              }`}>
                                {value && <span className="text-white text-xs">✓</span>}
                              </div>
                              <span className="text-gray-700 capitalize">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <span className={`text-xs px-1 py-0.5 rounded ${
                                value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {value ? '✓' : '❌'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {travelChecklistProgress.updated_at && (
                        <div className="mt-3 text-xs text-gray-500">
                          Last updated: {new Date(travelChecklistProgress.updated_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* ETA Requirement */}
                      {(participantDetails as Record<string, unknown>).requires_eta && (
                        <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="bg-orange-100 p-1.5 rounded">
                                <FileText className="h-4 w-4 text-orange-600" />
                              </div>
                              <span className="font-semibold text-gray-900">ETA Required</span>
                            </div>
                            <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                              Required
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            Electronic Travel Authorization is needed for this participant
                          </p>
                        </div>
                      )}

                      {/* Passport Document */}
                      <div className={`bg-white rounded-lg p-4 border-l-4 shadow-sm ${
                        (participantDetails as Record<string, unknown>).passport_document
                          ? 'border-green-500'
                          : 'border-gray-300'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${
                              (participantDetails as Record<string, unknown>).passport_document
                                ? 'bg-green-100'
                                : 'bg-gray-100'
                            }`}>
                              <FileText className={`h-4 w-4 ${
                                (participantDetails as Record<string, unknown>).passport_document
                                  ? 'text-green-600'
                                  : 'text-gray-400'
                              }`} />
                            </div>
                            <span className="font-semibold text-gray-900">Passport</span>
                          </div>
                          <Badge className={
                            (participantDetails as Record<string, unknown>).passport_document
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }>
                            {(participantDetails as Record<string, unknown>).passport_document ? 'Uploaded' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          {(participantDetails as Record<string, unknown>).passport_document
                            ? 'Passport document has been submitted'
                            : 'Passport document not yet uploaded'}
                        </p>
                      </div>

                      {/* Flight Ticket Document */}
                      <div className={`bg-white rounded-lg p-4 border-l-4 shadow-sm ${
                        (participantDetails as Record<string, unknown>).ticket_document
                          ? 'border-green-500'
                          : 'border-gray-300'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${
                              (participantDetails as Record<string, unknown>).ticket_document
                                ? 'bg-green-100'
                                : 'bg-gray-100'
                            }`}>
                              <Plane className={`h-4 w-4 ${
                                (participantDetails as Record<string, unknown>).ticket_document
                                  ? 'text-green-600'
                                  : 'text-gray-400'
                              }`} />
                            </div>
                            <span className="font-semibold text-gray-900">Flight Ticket</span>
                          </div>
                          <Badge className={
                            (participantDetails as Record<string, unknown>).ticket_document
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }>
                            {(participantDetails as Record<string, unknown>).ticket_document ? 'Uploaded' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          {(participantDetails as Record<string, unknown>).ticket_document
                            ? 'Flight ticket has been submitted'
                            : 'Flight ticket not yet uploaded'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Letter of Invitation (LOI) Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-base">Letter of Invitation (LOI)</h4>
                    <p className="text-xs text-gray-500">Official invitation document for visa applications</p>
                  </div>
                </div>
                <LOISection 
                  participantEmail={participantEmail}
                  eventId={eventId}
                  tenantSlug={tenantSlug}
                />
              </div>

              {/* Services Grid */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-base">Event Services</h4>
                    <p className="text-xs text-gray-500">Transport, accommodation, and benefits</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Transport */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 p-1.5 rounded-lg">
                        <Car className="h-4 w-4 text-green-600" />
                      </div>
                      <h5 className="font-medium text-gray-900 text-sm">Transport</h5>
                      <Badge variant="outline" className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200">
                        {transportDetails.length}
                      </Badge>
                    </div>
                  {transportDetails.length > 0 ? (
                    <div className="space-y-3">
                      {transportDetails.map((transport) => (
                        <div key={transport.id} className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs px-2 py-1 bg-white border-green-300 text-green-700 font-medium">
                              {transport.booking_type.replace('_', ' ').charAt(0).toUpperCase() + transport.booking_type.replace('_', ' ').slice(1)}
                            </Badge>
                            <Badge className={`text-xs px-2 py-1 ${getStatusColor(transport.status)}`}>
                              {transport.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 mb-2">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-0.5">Route</div>
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {transport.pickup_locations.join(', ')} → {transport.destination}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-0.5">Schedule</div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDate(transport.scheduled_time)} at {formatTime(transport.scheduled_time)}
                                </div>
                              </div>
                            </div>
                          </div>
                          {transport.driver_name && (
                            <div className="flex items-center gap-2 text-xs bg-white rounded p-2 mb-2">
                              <User className="h-3.5 w-3.5 text-gray-500" />
                              <span className="text-gray-600">Driver:</span>
                              <span className="font-medium text-gray-900 truncate">{transport.driver_name}</span>
                            </div>
                          )}
                          {transport.has_welcome_package && (
                            <div className="flex items-center justify-between bg-white rounded p-2">
                              <div className="flex items-center gap-2">
                                <Package className="h-3.5 w-3.5 text-orange-500" />
                                <span className="text-xs text-gray-700 font-medium">Welcome Package</span>
                              </div>
                              <Badge variant="outline" className={`text-xs px-2 py-0.5 ${
                                transport.package_collected ? 'bg-green-100 text-green-800 border-green-300' : 'bg-orange-100 text-orange-800 border-orange-300'
                              }`}>
                                {transport.package_collected ? 'Collected' : 'Pending'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 text-center border border-gray-200">
                      <Car className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 font-medium">No transport arranged</p>
                    </div>
                  )}
                </div>

                  {/* Accommodation */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-100 p-1.5 rounded-lg">
                        <Home className="h-4 w-4 text-amber-600" />
                      </div>
                      <h5 className="font-medium text-gray-900 text-sm">Accommodation</h5>
                      <Badge variant="outline" className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-200">
                        {accommodationDetails.length}
                      </Badge>
                    </div>
                  {/* 🔥 DEBUG: Show accommodation state */}
                  <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <div>🏠 DEBUG: Accommodation State</div>
                    <div>📊 Count: {accommodationDetails.length}</div>
                    <div>📋 Data: {JSON.stringify(accommodationDetails, null, 2)}</div>
                  </div>
                  
                  {accommodationDetails.length > 0 ? (
                    <div className="space-y-3">
                      {accommodationDetails.map((accommodation, index) => (
                        <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs px-2 py-1 bg-white border-amber-300 text-amber-700 font-medium">
                              {accommodation.type.charAt(0).toUpperCase() + accommodation.type.slice(1)}
                            </Badge>
                            {accommodation.status && (
                              <Badge className={`text-xs px-2 py-1 ${getStatusColor(accommodation.status)}`}>
                                {accommodation.status.replace("_", " ").toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-2.5 mb-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Home className="h-4 w-4 text-amber-600" />
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-0.5">Property</div>
                                <div className="text-sm font-semibold text-gray-900 truncate">{accommodation.name}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-amber-600" />
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-0.5">Location</div>
                                <div className="text-sm font-medium text-gray-900 truncate">{accommodation.location}</div>
                              </div>
                            </div>
                          </div>
                          {accommodation.check_in_date && (
                            <div className="bg-white rounded p-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-amber-600" />
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-0.5">Duration</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatDate(accommodation.check_in_date)} - {accommodation.check_out_date ? formatDate(accommodation.check_out_date) : 'TBD'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {accommodation.is_shared !== undefined && (
                            <div className="flex items-center justify-between bg-white rounded p-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-amber-600" />
                                <span className="text-xs font-medium text-gray-900">
                                  {accommodation.is_shared ? 'Shared Room' : 'Private Room'}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-300">
                                {accommodation.room_occupants}/{accommodation.room_capacity}
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 text-center border border-gray-200">
                      <Home className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 font-medium">No accommodation arranged</p>
                      <div className="mt-2 text-xs text-gray-400">
                        🔍 Debug: Participant {participantId}, Event {eventId}, Tenant {tenantSlug}
                      </div>
                    </div>
                  )}
                </div>

                {/* Drink Vouchers - Enhanced Design */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-100 p-1.5 rounded-lg">
                      <div className="h-4 w-4 text-purple-600">🍺</div>
                    </div>
                    <h5 className="font-medium text-gray-900 text-sm">Drink Vouchers</h5>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200">
                      {voucherSummary?.total_drinks || 0}
                    </Badge>
                  </div>
                  {voucherSummary && voucherSummary.total_drinks > 0 ? (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                      <div className="space-y-3">
                        {/* Voucher Stats with Better Visual Design */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-blue-200">
                            <div className="text-2xl font-bold text-blue-600">{voucherSummary.total_drinks}</div>
                            <div className="text-xs text-gray-600 mt-1 font-medium">Assigned</div>
                            <div className="text-xs text-gray-400 mt-0.5">Total allocated</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-red-200">
                            <div className="text-2xl font-bold text-red-600">{voucherSummary.redeemed_drinks || 0}</div>
                            <div className="text-xs text-gray-600 mt-1 font-medium">Redeemed</div>
                            <div className="text-xs text-gray-400 mt-0.5">Already used</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-green-200">
                            <div className={`text-2xl font-bold ${voucherSummary.remaining_drinks < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {voucherSummary.remaining_drinks}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 font-medium">Remaining</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {voucherSummary.remaining_drinks < 0 ? 'Over-redeemed' : 'Available'}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-white rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1 text-xs">
                            <span className="text-gray-600 font-medium">Redemption Progress</span>
                            <span className="text-gray-900 font-semibold">
                              {voucherSummary.total_drinks > 0
                                ? Math.min(100, Math.round((voucherSummary.redeemed_drinks || 0) / voucherSummary.total_drinks * 100))
                                : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-300 ${
                                voucherSummary.remaining_drinks < 0
                                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                                  : 'bg-gradient-to-r from-blue-500 to-purple-600'
                              }`}
                              style={{
                                width: `${voucherSummary.total_drinks > 0
                                  ? Math.min(100, Math.round((voucherSummary.redeemed_drinks || 0) / voucherSummary.total_drinks * 100))
                                  : 0}%`
                              }}
                            ></div>
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
                          <div className="flex gap-2">
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
                              className="flex-1 h-9 text-sm font-medium bg-white border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all shadow-sm"
                            >
                              <Minus className="h-4 w-4 mr-1.5" />
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
                              className="flex-1 h-9 text-sm font-medium bg-white border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm"
                            >
                              <Edit className="h-4 w-4 mr-1.5" />
                              Edit
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
              </div>

              {/* Action Buttons - Enhanced */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowBadge(true)}
                    className="gap-2 h-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 font-semibold transition-all shadow-sm"
                  >
                    <BadgeIcon className="h-5 w-5" />
                    Event Badge
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowPDFReport(true)}
                    className="gap-2 h-12 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 font-semibold transition-all shadow-sm"
                  >
                    <FileText className="h-5 w-5" />
                    PDF Report
                  </Button>
                </div>
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

// LOI Section Component
interface LOISectionProps {
  participantEmail: string;
  eventId: number;
  tenantSlug: string;
}

function LOISection({ participantEmail, eventId, tenantSlug }: LOISectionProps) {
  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [participantData, setParticipantData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loiSlug, setLoiSlug] = useState<string | null>(null);

  const { apiClient } = useAuthenticatedApi();

  useEffect(() => {
    const loadLOIData = async () => {
      try {
        // Load active invitation template
        const templatesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/${tenantSlug}/invitation-templates`, {
          headers: { 'Authorization': `Bearer ${apiClient.getToken()}` }
        });
        
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          const activeTemplate = templatesData.templates?.find((t: any) => t.is_active);
          setActiveTemplate(activeTemplate);
        }

        // Load participant data
        const participantResponse = await apiClient.request(
          `/event-registration/participant-by-email/${participantEmail}?event_id=${eventId}`,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );
        setParticipantData(participantResponse);

        // Load event data
        const eventResponse = await apiClient.request(
          `/events/${eventId}`,
          { headers: { 'X-Tenant-ID': tenantSlug } }
        );
        setEventData(eventResponse);

        // Generate unique slug for this LOI
        const slug = `${tenantSlug}-${eventId}-${participantEmail.replace('@', '-').replace('.', '-')}-${Date.now()}`;
        setLoiSlug(slug);

      } catch (error) {
        console.error('Failed to load LOI data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLOIData();
  }, [participantEmail, eventId, tenantSlug, apiClient]);

  const generateLOIContent = () => {
    if (!activeTemplate || !participantData || !eventData) return '';

    const data = {
      participant_name: participantData.full_name || participantData.name || 'N/A',
      passport_number: participantData.passport_number || 'N/A',
      nationality: participantData.nationality || 'N/A',
      date_of_birth: participantData.date_of_birth || 'N/A',
      passport_issue_date: participantData.passport_issue_date || 'N/A',
      passport_expiry_date: participantData.passport_expiry_date || 'N/A',
      event_name: eventData.title || eventData.name || 'N/A',
      event_start_date: eventData.start_date ? new Date(eventData.start_date).toLocaleDateString() : 'N/A',
      event_end_date: eventData.end_date ? new Date(eventData.end_date).toLocaleDateString() : 'N/A',
      event_location: eventData.location || 'N/A',
      accommodation_details: 'TBD',
      organization_name: 'Médecins Sans Frontières',
      organization_address: activeTemplate.address_fields?.filter((f: string) => f.trim()).join('<br>') || 'Médecins Sans Frontières<br>Nairobi, Kenya',
      organizer_name: eventData.organizer_name || 'Event Organizer',
      organizer_title: eventData.organizer_title || 'Event Coordinator',
      logo: activeTemplate.logo_url 
        ? `<img src="${activeTemplate.logo_url}" alt="Organization Logo" style="max-height: 60px; max-width: 100px; display: block;" />` 
        : '',
      signature: activeTemplate.signature_url 
        ? `<img src="${activeTemplate.signature_url}" alt="Signature" style="max-height: 40px; max-width: 150px; display: block;" />` 
        : '',
      qr_code: activeTemplate.enable_qr_code && loiSlug
        ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL}/public/loi/${loiSlug}`)}" alt="QR Code" style="width: 58px; height: 58px;" />`
        : ''
    };

    let content = activeTemplate.template_content;
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value || '');
    });

    return content;
  };

  const handleViewLOI = () => {
    if (loiSlug) {
      window.open(`${process.env.NEXT_PUBLIC_BASE_URL}/public/loi/${loiSlug}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading LOI template...</p>
      </div>
    );
  }

  if (!activeTemplate) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 rounded-lg p-4 border-2">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-2 rounded-lg">
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">LOI Document</span>
              <Badge className="text-xs px-2 py-1 bg-gray-100 text-gray-600 border-gray-300">
                No Template
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">No active invitation template found. Please create and activate a template first.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 rounded-lg p-4 border-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">LOI Document</span>
                <Badge className="text-xs px-2 py-1 bg-green-100 text-green-800 border-green-300">
                  Ready
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">Generated using template: {activeTemplate.name}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleViewLOI}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <FileText className="h-4 w-4 mr-1" />
              View LOI
            </Button>
          </div>
        </div>
      </div>

      {/* LOI Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h5 className="font-medium text-gray-900">Letter of Invitation Preview</h5>
          {loiSlug && (
            <div className="text-xs text-gray-500">
              Public URL: /public/loi/{loiSlug}
            </div>
          )}
        </div>
        <div 
          className="prose max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: generateLOIContent() }}
          style={{ fontSize: '12px', lineHeight: '1.4' }}
        />
      </div>
    </div>
  );
}