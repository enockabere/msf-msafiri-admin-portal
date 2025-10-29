"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Send,
  Search,
  Printer,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Participant {
  id: number;
  full_name: string;
  email: string;
  status: string;
  registration_type: string;
  registered_by: string;
  notes?: string;
  created_at: string;
  invitation_sent?: boolean;
  invitation_sent_at?: string;
  invitation_accepted?: boolean;
  invitation_accepted_at?: string;
  role?: string;
  participant_role?: string;
  oc?: string;
  position?: string;
  country?: string;
  contract_status?: string;
  contract_type?: string;
  gender_identity?: string;
  sex?: string;
  pronouns?: string;
  project_of_work?: string;
  personal_email?: string;
  msf_email?: string;
  hrco_email?: string;
  career_manager_email?: string;
  line_manager_email?: string;
  phone_number?: string;
  certificate_name?: string;
  badge_name?: string;
  motivation_letter?: string;
  dietary_requirements?: string;
  accommodation_needs?: string;
  code_of_conduct_confirm?: string;
  travel_requirements_confirm?: string;
  daily_meals?: string;
  travelling_internationally?: string;
  travelling_from_country?: string;
  accommodation_type?: string;
  // Alternative field names from API
  certificateName?: string;
  badgeName?: string;
  motivationLetter?: string;
  dietaryRequirements?: string;
  accommodationNeeds?: string;
  codeOfConductConfirm?: string;
  travelRequirementsConfirm?: string;
  dailyMeals?: string;
  travellingInternationally?: string;
  accommodationType?: string;
  // Document upload fields
  passport_document?: string;
  ticket_document?: string;
  // Decline fields
  decline_reason?: string;
  declined_at?: string;
}

interface EventParticipantsProps {
  eventId: number;
  roleFilter?: string;
  allowAdminAdd?: boolean;
  onParticipantsChange?: (count: number) => void;
  eventHasEnded?: boolean;
}

export default function EventParticipants({
  eventId,
  roleFilter,
  allowAdminAdd = false,
  onParticipantsChange,
  eventHasEnded = false,
}: EventParticipantsProps) {
  const { apiClient } = useAuthenticatedApi();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    full_name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingParticipant, setViewingParticipant] =
    useState<Participant | null>(null);
  const [viewingParticipantIndex, setViewingParticipantIndex] = useState(0);


  const [selectedParticipants, setSelectedParticipants] = useState<number[]>(
    []
  );
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [processingBulk, setProcessingBulk] = useState(false);
  const [bulkRole, setBulkRole] = useState<string>("");
  const [processingBulkRole, setProcessingBulkRole] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);

  // Participant Details Modal Component
  interface ParticipantDetailsModalProps {
    participant: Participant;
    onClose: () => void;
    eventId: number;
    getStatusColor: (status: string) => string;
    onStatusChange: (participantId: number, newStatus: string) => Promise<void>;
    onRoleChange: (participantId: number, newRole: string) => Promise<void>;
    onNext: () => void;
    onPrevious: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
    currentIndex: number;
    totalCount: number;
  }

  interface TransportBooking {
    booking_type?: string;
    pickup_locations?: string[];
    status?: string;
    scheduled_time?: string;
  }

  interface AccommodationData {
    id: number;
    guest_name: string;
    guest_email: string;
    check_in_date: string;
    check_out_date: string;
    accommodation_type: 'guesthouse' | 'vendor';
    status: string;
    event_id?: number;
    room_type?: 'single' | 'double';
    room?: {
      id: number;
      room_number: string;
      capacity: number;
      current_occupants: number;
      guesthouse: {
        id: number;
        name: string;
        location?: string;
      };
    };
    vendor_accommodation?: {
      id: number;
      vendor_name: string;
      location: string;
      roommate_name?: string;
    };
  }

  interface VoucherData {
    total_drinks?: number;
    remaining_drinks?: number;
    redeemed_drinks?: number;
    qr_token?: string;
    qr_data_url?: string;
    participant_id?: number;
    event_id?: number;
  }

  interface LineManagerRecommendation {
    id: number;
    line_manager_email: string;
    recommendation_text?: string;
    submitted_at?: string;
    created_at: string;
  }

  interface TravelRequirement {
    id: number;
    country: string;
    visa_required: boolean;
    eta_required: boolean;
    passport_required: boolean;
    flight_ticket_required: boolean;
    additional_requirements?: {
      name: string;
      required: boolean;
      description?: string;
    }[];
  }

  function ParticipantDetailsModal({
    participant,
    onClose,
    eventId,
    getStatusColor,
    onStatusChange,
    onRoleChange,
    onNext,
    onPrevious,
    hasNext,
    hasPrevious,
    currentIndex,
    totalCount,
  }: ParticipantDetailsModalProps) {
    const [transportData, setTransportData] = useState<TransportBooking[]>([]);
    const [accommodationData, setAccommodationData] = useState<
      AccommodationData[]
    >([]);
    const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
    const [recommendationData, setRecommendationData] = useState<LineManagerRecommendation | null>(null);
    const [travelRequirements, setTravelRequirements] = useState<TravelRequirement | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchParticipantServices = async () => {
        try {
          const token = apiClient.getToken();
          // Get tenant slug from URL
          const tenantSlug = window.location.pathname.split('/')[2];
          const headers = {
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': tenantSlug
          };

          console.log('Fetching participant services for:', {
            participantId: participant.id,
            travellingInternationally: participant.travelling_internationally || participant.travellingInternationally,
            travellingFromCountry: participant.travelling_from_country,
            tenantSlug
          });
          
          // First, get the current event details to get the event title
          let currentEventTitle = null;
          try {
            const eventResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}`,
              { headers }
            );
            if (eventResponse.ok) {
              const eventData = await eventResponse.json();
              currentEventTitle = eventData.title;
              console.log('Current event title:', currentEventTitle);
            }
          } catch (error) {
            console.log('Could not fetch event details:', error);
          }

          // Skip transport API calls for now - service not implemented
          setTransportData([]);

          // Fetch accommodation allocations for this participant by email
          try {
            // Fetch all allocations and filter client-side by guest_email and event_id
            const accommodationResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/allocations`,
              { headers }
            );
            if (accommodationResponse.ok) {
              const allAccommodations = await accommodationResponse.json();
              console.log('All accommodations from API:', allAccommodations);
              console.log('Filtering for participant:', participant.email, 'event:', eventId);

              // Filter by participant email and event title
              const filteredAccommodations = Array.isArray(allAccommodations)
                ? allAccommodations.filter((acc: AccommodationData) => {
                    const emailMatch = acc.guest_email?.toLowerCase() === participant.email?.toLowerCase();
                    
                    // Check event title match
                    const eventTitleFromObject = acc.event?.title;
                    
                    console.log('Full accommodation object:', acc);
                    console.log('Event filtering:', {
                      'accommodation event title': eventTitleFromObject,
                      'current event title': currentEventTitle,
                      'event match': currentEventTitle ? eventTitleFromObject === currentEventTitle : true
                    });
                    
                    // Match by event title if we have the current event title
                    // Be more lenient - if we can't get event title or no event info, show all
                    const eventMatch = !currentEventTitle || !eventTitleFromObject ? 
                      true : // Show all if missing event info
                      eventTitleFromObject === currentEventTitle;

                    // Exclude cancelled accommodations
                    const statusMatch = acc.status?.toLowerCase() !== 'cancelled';

                    console.log('Checking accommodation:', {
                      guest_email: acc.guest_email,
                      'event.title': eventTitleFromObject,
                      status: acc.status,
                      emailMatch,
                      eventMatch,
                      statusMatch,
                      willInclude: emailMatch && eventMatch && statusMatch
                    });

                    return emailMatch && eventMatch && statusMatch;
                  })
                : [];

              console.log('Filtered accommodations for participant:', filteredAccommodations);
              setAccommodationData(filteredAccommodations);
            } else {
              setAccommodationData([]);
            }
          } catch (error) {
            setAccommodationData([]);
          }

          // Fetch QR/voucher data with proper error handling
          try {
            const qrResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/participants/${participant.id}/qr`,
              { headers }
            );
            if (qrResponse.ok) {
              const qrData = await qrResponse.json();


              // Try to decode what's in the QR code by creating a temporary image
              if (qrData.qr_data_url) {
                const img = new Image();
                img.onload = () => {
                  // The QR code content is embedded in the image, we can't easily decode it here
                  // But we can test by scanning it or checking API logs
                };
                img.src = qrData.qr_data_url;
              }

              setVoucherData({
                ...qrData.allocation_summary,
                qr_token: qrData.qr_token,
                qr_data_url: qrData.qr_data_url,
              });
            } else {
              // Fallback to event allocations
              const allocationsResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/event/${eventId}`,
                { headers }
              );
              if (allocationsResponse.ok) {
                const allocations = await allocationsResponse.json();
                const drinkAllocations = allocations.filter(
                  (a: any) => a.drink_vouchers_per_participant > 0
                );
                if (drinkAllocations.length > 0) {
                  const totalVouchers = drinkAllocations.reduce(
                    (sum: number, a: any) =>
                      sum + (a.drink_vouchers_per_participant || 0),
                    0
                  );
                  setVoucherData({
                    total_drinks: totalVouchers,
                    remaining_drinks: totalVouchers,
                    redeemed_drinks: 0,
                    participant_id: participant.id,
                    event_id: eventId,
                  });
                } else {
                  setVoucherData(null);
                }
              } else {
                setVoucherData(null);
              }
            }
          } catch {
            setVoucherData(null);
          }

          // Fetch line manager recommendation
          try {
            const recommendationResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/line-manager-recommendation/participant/${participant.id}?event_id=${eventId}`,
              { headers }
            );
            
            if (recommendationResponse.ok) {
              const recommendationData = await recommendationResponse.json();
              setRecommendationData(recommendationData);
            } else {
              setRecommendationData(null);
            }
          } catch (error) {
            setRecommendationData(null);
          }

          // Fetch travel requirements if travelling internationally
          const isInternational = participant.travelling_internationally === 'yes' || participant.travellingInternationally === 'yes';
          const fromCountry = participant.travelling_from_country;
          
          console.log('Travel requirements check:', {
            isInternational,
            fromCountry,
            travellingInternationally: participant.travelling_internationally,
            travellingInternationallyAlt: participant.travellingInternationally
          });
          
          if (isInternational && fromCountry) {
            try {
              console.log('Fetching travel requirements for country:', fromCountry);
              
              // First get tenant ID
              const tenantResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
                { headers }
              );
              
              if (tenantResponse.ok) {
                const tenantData = await tenantResponse.json();
                const tenantId = tenantData.id;
                
                console.log('Got tenant ID:', tenantId, 'for slug:', tenantSlug);
                
                const travelResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/country-travel-requirements/tenant/${tenantId}/country/${encodeURIComponent(fromCountry)}`,
                  { headers }
                );
                
                console.log('Travel requirements response status:', travelResponse.status);
                
                if (travelResponse.ok) {
                  const travelData = await travelResponse.json();
                  console.log('Travel requirements data:', travelData);
                  setTravelRequirements(travelData);
                } else {
                  console.log('Travel requirements not found for country:', fromCountry);
                  setTravelRequirements(null);
                }
              } else {
                console.log('Failed to get tenant data');
                setTravelRequirements(null);
              }
            } catch (error) {
              console.error('Error fetching travel requirements:', error);
              setTravelRequirements(null);
            }
          } else {
            console.log('Not international travel or no from country specified');
            setTravelRequirements(null);
          }
        } catch {
          // Error handled silently
        } finally {
          setLoading(false);
        }
      };

      // Show services for selected, confirmed, attended, and registered participants
      const allowedStatuses = ["selected", "confirmed", "attended", "registered"];
      if (allowedStatuses.includes(participant.status?.toLowerCase())) {
        // Only fetch if participant has an email
        if (participant.email) {
          fetchParticipantServices();
        } else {
          setLoading(false);
        }
      } else {
        // Still fetch travel requirements for other statuses if they're travelling internationally
        const isInternational = participant.travelling_internationally === 'yes' || participant.travellingInternationally === 'yes';
        const fromCountry = participant.travelling_from_country;
        
        if (isInternational && fromCountry) {
          fetchParticipantServices();
        } else {
          setLoading(false);
        }
      }
    }, [participant.id, participant.email, participant.status, eventId, apiClient, participant.travelling_internationally, participant.travellingInternationally, participant.travelling_from_country]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white w-full h-full overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {participant.full_name}
                  </h3>
                  <p className="text-gray-600 mt-1">{participant.email}</p>
                  <Badge className={`mt-2 ${getStatusColor(participant.status)}`}>
                    {participant.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
                
                {/* Navigation Controls */}
                <div className="flex items-center gap-2 ml-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrevious}
                    disabled={!hasPrevious}
                    className="h-8 px-3"
                  >
                    ← Previous
                  </Button>
                  <span className="text-sm text-gray-500 px-2">
                    {currentIndex + 1} of {totalCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNext}
                    disabled={!hasNext}
                    className="h-8 px-3"
                  >
                    Next →
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Select
                    value={participant.status}
                    onValueChange={(value) => onStatusChange(participant.id, value)}
                  >
                    <SelectTrigger className="w-32 h-8 bg-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="not_selected">Not Selected</SelectItem>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                      <SelectItem value="attended">Attended</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={participant.participant_role || participant.role || "visitor"}
                    onValueChange={(value) => onRoleChange(participant.id, value)}
                  >
                    <SelectTrigger className="w-32 h-8 bg-white">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visitor">Visitor</SelectItem>
                      <SelectItem value="facilitator">Facilitator</SelectItem>
                      <SelectItem value="organizer">Organizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 text-xl px-3 py-2"
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Personal Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-gray-200 pb-2">
                  Personal Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Personal Email:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.personal_email || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      MSF Email:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.msf_email || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <br />
                    <span className="text-gray-900">
                      {participant.phone_number || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Gender Identity:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.gender_identity || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Sex:</span>
                    <br />
                    <span className="text-gray-900">
                      {participant.sex || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Pronouns:</span>
                    <br />
                    <span className="text-gray-900">
                      {participant.pronouns || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-blue-200 pb-2">
                  Work Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">OC:</span>
                    <br />
                    <span className="text-gray-900">
                      {participant.oc || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Position:</span>
                    <br />
                    <span className="text-gray-900">
                      {participant.position || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Country:</span>
                    <br />
                    <span className="text-gray-900">
                      {participant.country || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Project:</span>
                    <br />
                    <span className="text-gray-900">
                      {participant.project_of_work || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Contract Status:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.contract_status || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Contract Type:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.contract_type || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-green-200 pb-2">
                  Contact Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      HRCO Email:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.hrco_email || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Career Manager:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.career_manager_email || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Line Manager:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.line_manager_email || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Registered:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {new Date(participant.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Registration Details */}
              <div className="bg-purple-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-purple-200 pb-2">
                  Registration Details
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Certificate Name:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.certificate_name ||
                        participant.certificateName ||
                        "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Badge Name:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.badge_name ||
                        participant.badgeName ||
                        "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Travelling Internationally:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.travelling_internationally ||
                        participant.travellingInternationally ||
                        "-"}
                    </span>
                  </div>
                  {participant.travelling_from_country && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Travelling From Country:
                      </span>
                      <br />
                      <span className="text-gray-900">
                        {participant.travelling_from_country}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">
                      Accommodation Type:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.accommodation_type ||
                        participant.accommodationType ||
                        "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Daily Meals:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.daily_meals || participant.dailyMeals || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Dietary Requirements:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.dietary_requirements ||
                        participant.dietaryRequirements ||
                        "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Accommodation Needs:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.accommodation_needs ||
                        participant.accommodationNeeds ||
                        "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Code of Conduct:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.code_of_conduct_confirm ||
                        participant.codeOfConductConfirm ||
                        "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Travel Requirements:
                    </span>
                    <br />
                    <span className="text-gray-900">
                      {participant.travel_requirements_confirm ||
                        participant.travelRequirementsConfirm ||
                        "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Motivation Letter & Recommendation */}
              <div className="bg-yellow-50 p-6 rounded-lg col-span-1 lg:col-span-4">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-yellow-200 pb-2">
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <span className="font-medium text-gray-700 block mb-2">
                      Motivation Letter:
                    </span>
                    <div className="bg-white p-4 rounded-lg border max-h-40 overflow-y-auto">
                      <span className="text-gray-900 text-sm whitespace-pre-wrap">
                        {participant.motivation_letter ||
                          participant.motivationLetter ||
                          "No motivation letter provided"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 block mb-2">
                      Line Manager Recommendation:
                    </span>
                    <div className="bg-white p-4 rounded-lg border max-h-40 overflow-y-auto">
                      {recommendationData ? (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500">
                            From: {recommendationData.line_manager_email}
                          </div>
                          <div className="text-xs text-gray-500">
                            Submitted: {recommendationData.submitted_at ? 
                              new Date(recommendationData.submitted_at).toLocaleDateString() : 
                              'Pending'}
                          </div>
                          <div className="text-gray-900 text-sm whitespace-pre-wrap">
                            {recommendationData.recommendation_text || "Recommendation pending"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          No recommendation available
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Travel Requirements */}
                  {(participant.travelling_internationally === 'yes' || participant.travellingInternationally === 'yes') && participant.travelling_from_country && (
                    <div>
                      <span className="font-medium text-gray-700 block mb-2">
                        Travel Requirements ({participant.travelling_from_country}):
                      </span>
                      <div className="bg-white p-4 rounded-lg border max-h-40 overflow-y-auto">
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-gray-600">Loading requirements...</span>
                          </div>
                        ) : travelRequirements ? (
                          <div className="space-y-3">
                            {/* Standard Requirements */}
                            <div className="space-y-2">
                              {travelRequirements.visa_required && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span className="text-xs font-medium text-red-700">Visa Required</span>
                                </div>
                              )}
                              {travelRequirements.eta_required && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <span className="text-xs font-medium text-orange-700">eTA Required</span>
                                </div>
                              )}
                              {travelRequirements.passport_required && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-xs font-medium text-blue-700">Passport Required</span>
                                </div>
                              )}
                              {travelRequirements.flight_ticket_required && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-xs font-medium text-green-700">Flight Ticket Required</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Additional Requirements */}
                            {travelRequirements.additional_requirements && travelRequirements.additional_requirements.length > 0 && (
                              <div className="border-t pt-2">
                                <div className="text-xs font-semibold text-gray-600 mb-2">Additional Requirements:</div>
                                <div className="space-y-1">
                                  {travelRequirements.additional_requirements.map((req, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                      <div className={`w-2 h-2 rounded-full mt-1 ${req.required ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
                                      <div>
                                        <span className={`text-xs font-medium ${req.required ? 'text-purple-700' : 'text-gray-600'}`}>
                                          {req.name}
                                        </span>
                                        {req.description && (
                                          <div className="text-[10px] text-gray-500 mt-0.5">{req.description}</div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            No travel requirements configured for {participant.travelling_from_country}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {participant.status === 'declined' && (
                    <div>
                      <span className="font-medium text-gray-700 block mb-2">
                        Decline Information:
                      </span>
                      <div className="bg-white p-4 rounded-lg border max-h-40 overflow-y-auto">
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500">
                            Declined: {participant.declined_at ? 
                              new Date(participant.declined_at).toLocaleDateString() : 
                              'Unknown date'}
                          </div>
                          <div className="text-gray-900 text-sm whitespace-pre-wrap">
                            {participant.decline_reason || "No reason provided"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Event Services - Show for selected, confirmed, attended, and registered participants */}
            {["selected", "confirmed", "attended", "registered"].includes(participant.status?.toLowerCase()) && (
              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-6 text-xl border-b border-gray-300 pb-3">
                  Event Services
                </h4>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading services...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Transport */}
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <h5 className="font-semibold text-purple-900 mb-4">
                        Transport Bookings
                      </h5>
                      {transportData && transportData.length > 0 ? (
                        <div className="space-y-3">
                          {transportData.map(
                            (booking: TransportBooking, index) => (
                              <div
                                key={index}
                                className="bg-white p-3 rounded border"
                              >
                                <p className="font-medium text-sm">
                                  {booking.booking_type || "Transport"}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {booking.pickup_locations?.[0] || "TBD"}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Status: {booking.status || "Pending"}
                                </p>
                                {booking.scheduled_time && (
                                  <p className="text-xs text-gray-600">
                                    {new Date(
                                      booking.scheduled_time
                                    ).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          <p>No transport bookings assigned</p>
                          <p className="text-xs mt-1 text-gray-500">
                            Transport services will be arranged closer to the
                            event date
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Accommodation */}
                    <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-6 rounded-xl border-2 border-orange-200">
                      <h5 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Accommodation
                      </h5>
                      {accommodationData && accommodationData.length > 0 ? (
                        <div className="space-y-4">
                          {accommodationData.map((accommodation, ) => {
                            const isGuesthouse = accommodation.accommodation_type === 'guesthouse';
                            const isShared = isGuesthouse
                              ? (accommodation.room?.capacity || 0) > 1
                              : accommodation.room_type === 'double';
                            const accommodationName = isGuesthouse
                              ? accommodation.room?.guesthouse.name
                              : accommodation.vendor_accommodation?.vendor_name;
                            const location = isGuesthouse
                              ? accommodation.room?.guesthouse.location
                              : accommodation.vendor_accommodation?.location;

                            return (
                              <div
                                key={accommodation.id}
                                className="bg-white p-5 rounded-xl border-2 border-orange-100 shadow-sm hover:shadow-md transition-shadow"
                              >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                        isGuesthouse
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-purple-100 text-purple-700'
                                      }`}>
                                        {isGuesthouse ? 'Guesthouse' : 'Vendor Hotel'}
                                      </span>
                                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                        accommodation.status === 'booked'
                                          ? 'bg-blue-100 text-blue-700'
                                          : accommodation.status === 'checked_in'
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {accommodation.status.replace('_', ' ').toUpperCase()}
                                      </span>
                                    </div>
                                    <h6 className="font-semibold text-gray-900 text-base">
                                      {accommodationName}
                                    </h6>
                                    {location && (
                                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {location}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Room Details */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Room</p>
                                    <p className="font-medium text-sm text-gray-900">
                                      {isGuesthouse
                                        ? `Room ${accommodation.room?.room_number}`
                                        : `${accommodation.room_type === 'single' ? 'Single' : 'Double'} Room`}
                                    </p>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Sharing</p>
                                    <p className="font-medium text-sm text-gray-900">
                                      {isShared ? (
                                        <span className="text-orange-600">Shared</span>
                                      ) : (
                                        <span className="text-green-600">Private</span>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {/* Roommate Info */}
                                {isShared && accommodation.vendor_accommodation?.roommate_name && (
                                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                                    <p className="text-xs text-blue-700 font-medium mb-1">Sharing with:</p>
                                    <p className="font-semibold text-blue-900">
                                      {accommodation.vendor_accommodation.roommate_name}
                                    </p>
                                  </div>
                                )}

                                {isGuesthouse && isShared && accommodation.room && (
                                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                                    <p className="text-xs text-blue-700 font-medium mb-1">Room Capacity:</p>
                                    <p className="font-semibold text-blue-900">
                                      {accommodation.room.current_occupants} / {accommodation.room.capacity} occupants
                                    </p>
                                  </div>
                                )}

                                {/* Dates */}
                                <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-3 rounded-lg border border-orange-100">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-gray-600 mb-1">Check-in</p>
                                      <p className="font-semibold text-sm text-gray-900">
                                        {new Date(accommodation.check_in_date).toLocaleDateString('en-US', {
                                          weekday: 'short',
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                    <div className="text-right">
                                      <p className="text-xs text-gray-600 mb-1">Check-out</p>
                                      <p className="font-semibold text-sm text-gray-900">
                                        {new Date(accommodation.check_out_date).toLocaleDateString('en-US', {
                                          weekday: 'short',
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-white p-6 rounded-lg border-2 border-dashed border-orange-200 text-center">
                          <svg className="w-12 h-12 text-orange-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <p className="text-sm font-medium text-gray-700">No accommodation assigned</p>
                          <p className="text-xs mt-1 text-gray-500">
                            Accommodation will be arranged closer to the event date
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Drink Vouchers */}
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h5 className="font-semibold text-blue-900 mb-4">
                        Drink Vouchers
                      </h5>
                      {voucherData ? (
                        <div className="bg-white p-4 rounded border">
                          <div className="text-center mb-4">
                            {voucherData.qr_data_url ? (
                              <div className="inline-block p-4 bg-white rounded-lg shadow-sm border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={voucherData.qr_data_url}
                                  alt="Drink Voucher QR Code"
                                  className="w-40 h-40 mx-auto"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                  Scan to redeem vouchers
                                </p>
                              </div>
                            ) : (
                              <div className="text-gray-500 text-sm">
                                QR Code not available
                              </div>
                            )}
                            {voucherData.qr_token && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 font-mono">
                                  Token: {voucherData.qr_token.slice(0, 8)}...
                                </p>

                                <p className="text-xs text-blue-600 mt-1">
                                  QR URL:{" "}
                                  <a
                                    href={`${process.env.NEXT_PUBLIC_BASE_URL}/public/qr/${voucherData.qr_token}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"

                                  >
                                    {process.env.NEXT_PUBLIC_BASE_URL}
                                    /public/qr/{voucherData.qr_token}
                                  </a>
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                              <span>Total Vouchers:</span>
                              <span className="font-medium">
                                {voucherData.total_drinks || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Remaining:</span>
                              <span className="font-medium text-green-600">
                                {voucherData.remaining_drinks || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Redeemed:</span>
                              <span className="font-medium text-red-600">
                                {voucherData.redeemed_drinks || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          <p>No drink vouchers assigned</p>
                          <p className="text-xs mt-1 text-gray-500">
                            Vouchers will be available once event allocations
                            are configured
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const fetchParticipants = useCallback(async () => {
    try {
      setFetchLoading(true);
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/event-registration/event/${eventId}/registrations`
      );
      if (statusFilter && statusFilter !== "all") {
        url.searchParams.append("status_filter", statusFilter);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        const filteredData = roleFilter
          ? data.filter(
              (p: Participant) => (p.participant_role || p.role) === roleFilter
            )
          : data; // Show all participants when no role filter is applied

        setParticipants(filteredData);
        const countForCallback = roleFilter ? filteredData.length : data.length; // Count all participants when no role filter
        onParticipantsChange?.(countForCallback);


      }
    } catch {
      // Error handled silently
    } finally {
      setFetchLoading(false);
    }
  }, [eventId, statusFilter, roleFilter, onParticipantsChange]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleAddParticipant = async () => {
    if (!newParticipant.full_name.trim() || !newParticipant.email.trim())
      return;

    const requestData = {
      event_id: eventId,
      user_email: newParticipant.email,
      full_name: newParticipant.full_name,
      role: "attendee", // System role
    };

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/event-registration/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiClient.getToken()}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      if (response.ok) {
        fetchParticipants();
        setNewParticipant({ full_name: "", email: "" });
        setShowAddForm(false);

        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Success!",
          description: `${
            newParticipant.full_name
          } has been added as ${roleFilter}. ${
            roleFilter === "facilitator" ? "Notification email sent." : ""
          }`,
        });
      } else {
        const errorData = await response.json();

        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: errorData.detail || "Failed to add participant.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Network Error!",
        description: "Failed to connect to server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    participantId: number,
    newStatus: string
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/event-registration/participant/${participantId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        fetchParticipants(); // Refresh the list
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Success!",
          description: `Participant status updated to ${newStatus}. ${
            newStatus === "selected" ? "Invitation email sent." : ""
          }`,
        });
      }
    } catch (error) {
    }
  };

  const handleResendInvitation = async (participantId: number) => {
    setResendingId(participantId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/event-registration/participant/${participantId}/resend-invitation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        fetchParticipants(); // Refresh the list
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Success!",
          description: "Invitation email resent successfully.",
        });
      } else {
        const errorData = await response.json();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: errorData.detail || "Failed to resend invitation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registered":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "selected":
        return "bg-green-100 text-green-800 border-green-200";
      case "not_selected":
        return "bg-red-100 text-red-800 border-red-200";
      case "waiting":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "canceled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "attended":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "invited":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "declined":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredParticipants = participants.filter((participant) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      participant.full_name.toLowerCase().includes(searchLower) ||
      participant.email.toLowerCase().includes(searchLower) ||
      (participant.oc && participant.oc.toLowerCase().includes(searchLower)) ||
      (participant.position &&
        participant.position.toLowerCase().includes(searchLower)) ||
      (participant.country &&
        participant.country.toLowerCase().includes(searchLower));

    return matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Name",
        "Email",
        "OC",
        "Position",
        "Country",
        "Contract Status",
        "Contract Type",
        "Gender Identity",
        "Sex",
        "Pronouns",
        "Project",
        "Personal Email",
        "MSF Email",
        "HRCO Email",
        "Career Manager",
        "Line Manager",
        "Phone",
        "Certificate Name",
        "Badge Name",
        "Motivation Letter",
        "Status",
      ].join(","),
      ...filteredParticipants.map((p) =>
        [
          p.full_name,
          p.email,
          p.oc || "",
          p.position || "",
          p.country || "",
          p.contract_status || "",
          p.contract_type || "",
          p.gender_identity || "",
          p.sex || "",
          p.pronouns || "",
          p.project_of_work || "",
          p.personal_email || "",
          p.msf_email || "",
          p.hrco_email || "",
          p.career_manager_email || "",
          p.line_manager_email || "",
          p.phone_number || "",
          p.certificate_name || "",
          p.badge_name || "",
          (p.motivation_letter || "").replace(/\n/g, ' ').substring(0, 100) + (p.motivation_letter && p.motivation_letter.length > 100 ? '...' : ''),
          p.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-${eventId}-participants.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteParticipant = async (participantId: number) => {
    setDeletingId(participantId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/event-registration/participant/${participantId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
          },
        }
      );

      if (response.ok) {
        fetchParticipants();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Success!",
          description: "Participant deleted successfully.",
        });
      } else {
        const errorData = await response.json();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: errorData.detail || "Failed to delete participant.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParticipants = filteredParticipants.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleSelectParticipant = (participantId: number) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleSelectAll = () => {
    if (selectedParticipants.length === currentParticipants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(currentParticipants.map((p) => p.id));
    }
  };

  const handleRoleChange = async (participantId: number, newRole: string) => {
    setUpdatingRoleId(participantId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/participants/${participantId}/role`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        fetchParticipants();
        
        // If viewing this participant in modal, refresh their data after a short delay
        // to allow backend accommodation reallocation to complete
        if (viewingParticipant && viewingParticipant.id === participantId) {
          setTimeout(() => {
            const updatedParticipant = participants.find(p => p.id === participantId);
            if (updatedParticipant) {
              setViewingParticipant({...updatedParticipant, participant_role: newRole, role: newRole});
            }
          }, 2000); // 2 second delay to allow backend processing
        }
        
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Success!",
          description: `Participant role updated to ${newRole}. Accommodation will be reallocated automatically.`,
        });
      } else {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: "Failed to update participant role.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to update participant role.",
        variant: "destructive",
      });
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedParticipants.length === 0) return;

    setProcessingBulk(true);
    try {
      for (const participantId of selectedParticipants) {
        await handleStatusChange(participantId, bulkStatus);
        await new Promise((resolve) => setTimeout(resolve, 100)); // Queue emails
      }
      setSelectedParticipants([]);
      setBulkStatus("");
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Success!",
        description: `Updated ${selectedParticipants.length} participants to ${bulkStatus}`,
      });
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to update some participants",
        variant: "destructive",
      });
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleBulkRoleChange = async () => {
    if (!bulkRole || selectedParticipants.length === 0) return;

    setProcessingBulkRole(true);
    try {
      for (const participantId of selectedParticipants) {
        await handleRoleChange(participantId, bulkRole);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      setSelectedParticipants([]);
      setBulkRole("");
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Success!",
        description: `Updated ${selectedParticipants.length} participants to ${bulkRole} role`,
      });
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to update some participant roles",
        variant: "destructive",
      });
    } finally {
      setProcessingBulkRole(false);
    }
  };

  const handleNextParticipant = () => {
    const nextIndex = viewingParticipantIndex + 1;
    if (nextIndex < filteredParticipants.length) {
      setViewingParticipantIndex(nextIndex);
      setViewingParticipant(filteredParticipants[nextIndex]);
    }
  };

  const handlePreviousParticipant = () => {
    const prevIndex = viewingParticipantIndex - 1;
    if (prevIndex >= 0) {
      setViewingParticipantIndex(prevIndex);
      setViewingParticipant(filteredParticipants[prevIndex]);
    }
  };

  const handleViewParticipant = (participant: Participant) => {
    const index = filteredParticipants.findIndex(p => p.id === participant.id);
    setViewingParticipantIndex(index);
    setViewingParticipant(participant);
  };



  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {roleFilter ? `Event ${roleFilter}s` : "Event Participants"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredParticipants.length} {roleFilter || "participants"}{" "}
            {statusFilter && statusFilter !== "all"
              ? `(${statusFilter.replace("_", " ")})`
              : "total"}{" "}
            • Page {currentPage} of {totalPages || 1}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 border-gray-300 focus:border-red-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white border-gray-300">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
              <SelectItem
                value="all"
                className="hover:bg-red-50 focus:bg-red-50"
              >
                All Statuses
              </SelectItem>
              <SelectItem
                value="registered"
                className="hover:bg-red-50 focus:bg-red-50"
              >
                Registered
              </SelectItem>
              <SelectItem
                value="selected"
                className="hover:bg-red-50 focus:bg-red-50"
              >
                Selected
              </SelectItem>
              <SelectItem
                value="not_selected"
                className="hover:bg-red-50 focus:bg-red-50"
              >
                Not Selected
              </SelectItem>
              <SelectItem
                value="waiting"
                className="hover:bg-red-50 focus:bg-red-50"
              >
                Waiting
              </SelectItem>
              <SelectItem
                value="canceled"
                className="hover:bg-red-50 focus:bg-red-50"
              >
                Canceled
              </SelectItem>
              <SelectItem
                value="attended"
                className="hover:bg-red-50 focus:bg-red-50"
              >
                Attended
              </SelectItem>
              <SelectItem
                value="declined"
                className="hover:bg-red-50 focus:bg-red-50"
              >
                Declined
              </SelectItem>
            </SelectContent>
          </Select>
          {selectedParticipants.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border">
              <span className="text-sm text-blue-700">
                {selectedParticipants.length} selected
              </span>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-32 h-8 bg-white">
                  <SelectValue placeholder="Set status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="not_selected">Not Selected</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="attended">Attended</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleBulkStatusChange}
                disabled={!bulkStatus || processingBulk}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white h-8"
              >
                {processingBulk ? "Processing..." : "Update"}
              </Button>
              <Select value={bulkRole} onValueChange={setBulkRole}>
                <SelectTrigger className="w-32 h-8 bg-white">
                  <SelectValue placeholder="Set role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitor">Visitor</SelectItem>
                  <SelectItem value="facilitator">Facilitator</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleBulkRoleChange}
                disabled={!bulkRole || processingBulkRole}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white h-8"
              >
                {processingBulkRole ? "Processing..." : "Set Role"}
              </Button>
            </div>
          )}
          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {allowAdminAdd && (
            <Button
              onClick={() => setShowAddForm(true)}
              disabled={eventHasEnded}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {roleFilter || "Participant"}
            </Button>
          )}
        </div>
      </div>

      {showAddForm && allowAdminAdd && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 space-y-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-red-600" />
            <h4 className="text-lg font-semibold text-gray-900">
              Add New {roleFilter || "Participant"}
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <Input
                placeholder="Enter full name"
                value={newParticipant.full_name}
                onChange={(e) =>
                  setNewParticipant({
                    ...newParticipant,
                    full_name: e.target.value,
                  })
                }
                className="border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <Input
                placeholder="Enter email address"
                type="email"
                value={newParticipant.email}
                onChange={(e) =>
                  setNewParticipant({
                    ...newParticipant,
                    email: e.target.value,
                  })
                }
                className="border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleAddParticipant}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              disabled={
                !newParticipant.full_name || !newParticipant.email || loading
              }
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {roleFilter || "Participant"}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAddForm(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg transition-all duration-200"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={
                    selectedParticipants.length ===
                      currentParticipants.length &&
                    currentParticipants.length > 0
                  }
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                OC
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confirmed
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Documents
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentParticipants.map((participant) => (
              <tr key={participant.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(participant.id)}
                    onChange={() => handleSelectParticipant(participant.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td
                  className="px-3 py-4 whitespace-nowrap cursor-pointer"
                  onClick={() => {
                    console.log('Selected participant accommodation data:', {
                      participant_email: participant.email,
                      accommodation_type: participant.accommodation_type || participant.accommodationType,
                      accommodation_needs: participant.accommodation_needs || participant.accommodationNeeds,
                      travelling_internationally: participant.travelling_internationally || participant.travellingInternationally
                    });
                    handleViewParticipant(participant);
                  }}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 mr-3">
                      {participant.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="text-sm font-medium text-blue-600 hover:text-blue-800 underline">
                      {participant.full_name}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {participant.email}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {participant.oc || "-"}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {participant.position || "-"}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {participant.country || "-"}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <Select
                    value={
                      participant.participant_role ||
                      participant.role ||
                      "visitor"
                    }
                    onValueChange={(value) =>
                      handleRoleChange(participant.id, value)
                    }
                    disabled={
                      eventHasEnded || updatingRoleId === participant.id
                    }
                  >
                    <SelectTrigger className="w-24 h-7 text-xs">
                      {updatingRoleId === participant.id ? (
                        <div className="flex items-center gap-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                          <span className="text-xs">Updating...</span>
                        </div>
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visitor">Visitor</SelectItem>
                      <SelectItem value="facilitator">Facilitator</SelectItem>
                      <SelectItem value="organizer">Organizer</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <Badge
                    className={`text-xs px-2 py-0.5 ${getStatusColor(
                      participant.status
                    )}`}
                  >
                    {participant.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {participant.status === 'confirmed' ? (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-700 font-medium">Yes</span>
                    </div>
                  ) : participant.status === 'selected' || participant.status === 'approved' ? (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-xs text-orange-700 font-medium">Pending</span>
                    </div>
                  ) : participant.status === 'declined' ? (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs text-red-700 font-medium">No</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs text-gray-500 font-medium">N/A</span>
                    </div>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {participant.travelling_internationally === 'yes' || participant.travellingInternationally === 'yes' ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-green-700">P</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-green-700">T</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs text-gray-500 font-medium">N/A</span>
                    </div>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-1">
                    {participant.status === "selected" &&
                      participant.email &&
                      participant.email.trim() && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvitation(participant.id)}
                          disabled={
                            resendingId === participant.id || eventHasEnded
                          }
                          className="h-7 px-2 text-xs border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resendingId === participant.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-700"></div>
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteParticipant(participant.id)}
                      disabled={deletingId === participant.id || eventHasEnded}
                      className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === participant.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700"></div>
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredParticipants.length)} of{" "}
              {filteredParticipants.length} participants
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-3 text-xs"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-3 text-xs"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {fetchLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading participants...</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No {roleFilter || "participants"} yet
              </h4>
              <p className="text-gray-500 mb-4">
                Get started by adding your first {roleFilter || "participant"}
              </p>
              {allowAdminAdd ? (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {roleFilter || "Participant"}
                </Button>
              ) : (
                <p className="text-gray-500">
                  Participants can only register themselves for published events
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Participant Details Modal */}
      {viewingParticipant && (
        <ParticipantDetailsModal
          participant={viewingParticipant}
          onClose={() => setViewingParticipant(null)}
          eventId={eventId}
          getStatusColor={getStatusColor}
          onStatusChange={handleStatusChange}
          onRoleChange={handleRoleChange}
          onNext={handleNextParticipant}
          onPrevious={handlePreviousParticipant}
          hasNext={viewingParticipantIndex < filteredParticipants.length - 1}
          hasPrevious={viewingParticipantIndex > 0}
          currentIndex={viewingParticipantIndex}
          totalCount={filteredParticipants.length}
        />
      )}
    </div>
  );
}
