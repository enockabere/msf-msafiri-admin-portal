"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmailTemplateEditor } from "@/components/ui/email-template-editor";
import {
  Plus,
  Send,
  Search,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  X,
  Mail,
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
  // Proof of Accommodation
  proof_of_accommodation_url?: string;
  proof_generated_at?: string;
  // Vetting comments
  vetting_comments?: string;
}

interface VettingMode {
  isVettingCommittee: boolean;
  isVettingApprover: boolean;
  canEdit: boolean;
  submissionStatus?: 'open' | 'pending_approval' | 'approved';
  onRegisteredCountChange?: (count: number) => void;
  onStatusChange?: (status: string) => void;
}

interface EventParticipantsProps {
  eventId: number;
  roleFilter?: string;
  allowAdminAdd?: boolean;
  onParticipantsChange?: (count: number) => void;
  eventHasEnded?: boolean;
  vettingMode?: VettingMode;
}

// LOI Quick Access Component for table
function LOIQuickAccess({ participant, eventId }: { participant: Participant; eventId: number }) {
  const [hasLOI, setHasLOI] = useState<boolean | null>(null);
  const [loiSlug, setLoiSlug] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const checkLOI = async () => {
    if (checking || hasLOI !== null) return;
    
    setChecking(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/loi/participant/${encodeURIComponent(participant.email)}/event/${eventId}/check`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.available && data.slug) {
          setHasLOI(true);
          setLoiSlug(data.slug);
        } else {
          setHasLOI(false);
        }
      } else {
        setHasLOI(false);
      }
    } catch (error) {
      setHasLOI(false);
    } finally {
      setChecking(false);
    }
  };

  const openLOI = () => {
    if (loiSlug) {
      const loiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/public/loi/${loiSlug}`;
      window.open(loiUrl, '_blank');
    }
  };

  // Auto-check on mount for selected/confirmed participants
  useEffect(() => {
    if (['selected', 'confirmed', 'attended'].includes(participant.status?.toLowerCase())) {
      checkLOI();
    }
  }, [participant.status]);

  if (checking) {
    return (
      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
    );
  }

  if (hasLOI && loiSlug) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={openLOI}
        className="h-7 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
        title="View Letter of Invitation"
      >
        <FileText className="h-3 w-3" />
      </Button>
    );
  }

  return null;
}

// LOI Component
function LOISection({ participant, eventId }: { participant: Participant; eventId: number }) {
  const [loiStatus, setLoiStatus] = useState<{
    available: boolean;
    slug?: string;
    message: string;
    loading: boolean;
  }>({ available: false, message: '', loading: false });
  const [error, setError] = useState<string | null>(null);

  const fetchLOI = async () => {
    setLoiStatus(prev => ({ ...prev, loading: true }));
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/loi/participant/${encodeURIComponent(participant.email)}/event/${eventId}/check`
      );
      
      if (response.ok) {
        const data = await response.json();
        setLoiStatus({
          available: data.available,
          slug: data.slug,
          message: data.message,
          loading: false
        });
      } else {
        setError('LOI not available for this participant');
        setLoiStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      setError('Failed to fetch LOI data');
      setLoiStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const openLOIPage = () => {
    if (loiStatus.slug) {
      const loiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/public/loi/${loiStatus.slug}`;
      window.open(loiUrl, '_blank');
    }
  };

  return (
    <div className="space-y-3">
      {!loiStatus.available && !loiStatus.loading && !error && (
        <Button
          onClick={fetchLOI}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <FileText className="h-4 w-4 mr-2" />
          Check LOI Availability
        </Button>
      )}
      
      {loiStatus.loading && (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Checking LOI...</span>
        </div>
      )}
      
      {error && (
        <div className="text-sm text-gray-500">
          {error}
        </div>
      )}
      
      {loiStatus.available && loiStatus.slug && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">LOI Available</p>
              <p className="text-xs text-gray-500">Slug: {loiStatus.slug}</p>
            </div>
            <Button
              onClick={openLOIPage}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View LOI
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventParticipants({
  eventId,
  roleFilter,
  allowAdminAdd = false,
  onParticipantsChange,
  eventHasEnded = false,
  vettingMode,
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
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [participantComments, setParticipantComments] = useState<Record<number, string>>({});
  const [submittingVetting, setSubmittingVetting] = useState(false);
  const [vettingSubmitted, setVettingSubmitted] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    oc: true,
    position: true,
    country: true,
    role: true,
    status: true,
    confirmed: true,
    documents: true,
    comments: true,
    actions: true
  });
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Event Selection Results - {{EVENT_TITLE}}');
  const [emailBody, setEmailBody] = useState(`Dear {{PARTICIPANT_NAME}},



We have completed the selection process for {{EVENT_TITLE}}.

{{#if_selected}}
🎉 <strong>Congratulations! You have been selected to participate.</strong>

Event Details:
• Event: {{EVENT_TITLE}}
• Location: {{EVENT_LOCATION}}
• Date: {{EVENT_DATE_RANGE}}

Next Steps:
1. Download the Msafiri mobile app
2. Login using your work email ({{PARTICIPANT_EMAIL}})
3. Accept the invitation from the app notifications
4. Submit required documents through the mobile app

Important: Please use the Msafiri mobile application to accept your invitation and access all event details.

We look forward to your participation!
{{/if_selected}}

{{#if_not_selected}}
Thank you for your interest in participating in {{EVENT_TITLE}}.

After careful consideration, we regret to inform you that you have not been selected for this event. Due to limited capacity and specific requirements, we were unable to accommodate all applicants.

We encourage you to apply for future events and appreciate your continued engagement with our programs.
{{/if_not_selected}}

Best regards,
The Event Organization Team`);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [vettingApproved, setVettingApproved] = useState(false);
  const [committeeStatus, setCommitteeStatus] = useState<string | null>(null);
  
  // Update vetting mode based on committee status
  const normalizeStatus = (status: string | undefined) => {
    if (status === 'pending') return 'pending_approval';
    return status;
  };
  
  const actualStatus = normalizeStatus(committeeStatus || vettingMode?.submissionStatus);
  
  const effectiveVettingMode = vettingMode ? {
    ...vettingMode,
    canEdit: vettingMode.isVettingCommittee 
      ? actualStatus === 'open'
      : vettingMode.isVettingApprover 
      ? actualStatus === 'pending_approval'
      : vettingMode.canEdit,
    submissionStatus: actualStatus as 'open' | 'pending_approval' | 'approved'
  } : undefined;
  
  console.log('effectiveVettingMode DEBUG:', {
    vettingMode,
    committeeStatus,
    actualStatus,
    effectiveVettingMode
  });

  // Load email template on mount
  useEffect(() => {
    if (effectiveVettingMode?.isVettingApprover) {
      loadEmailTemplate();
    }
  }, [effectiveVettingMode?.isVettingApprover]);

  const loadEmailTemplate = async () => {
    try {
      const pathParts = window.location.pathname.split('/');
      const tenantSlug = pathParts[2]; // Should be the tenant slug from /tenant/[slug]/...
      
      // Validate tenant slug exists and is not empty
      if (!tenantSlug || tenantSlug === 'tenant') {
        return; // Use default template
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/email-templates/tenant/${tenantSlug}/vetting-notification`,
        {
          headers: {
            'Authorization': `Bearer ${apiClient.getToken()}`
          }
        }
      );
      
      if (response.ok) {
        const template = await response.json();
        setEmailSubject(template.subject);
        setEmailBody(template.body);
      }
      // If no custom template exists, the default prefilled template will be used
    } catch (error) {
      // Use default prefilled template if loading fails
    }
  };

  const saveEmailTemplate = async () => {
    setSavingTemplate(true);
    try {
      const pathParts = window.location.pathname.split('/');
      const tenantSlug = pathParts[2]; // Should be the tenant slug from /tenant/[slug]/...
      
      // Validate tenant slug exists and is not empty
      if (!tenantSlug || tenantSlug === 'tenant') {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: "Invalid tenant context.",
          variant: "destructive",
        });
        return;
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/email-templates/tenant/${tenantSlug}/vetting-notification`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${apiClient.getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject: emailSubject,
            body: emailBody
          })
        }
      );
      
      if (response.ok) {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Success!",
          description: "Email template saved successfully!",
        });
      } else {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: "Failed to save email template.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to save email template.",
        variant: "destructive",
      });
    } finally {
      setSavingTemplate(false);
    }
  };
  

  


  


// Helper function to show feedback message
  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedbackMessage({ type, message });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

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

  interface ChecklistProgress {
    checklist_items: Record<string, boolean>;
    completed: boolean;
    updated_at?: string;
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
    const [flightItineraries, setFlightItineraries] = useState<FlightItinerary[]>([]);
    const [checklistProgress, setChecklistProgress] = useState<ChecklistProgress | null>(null);
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

            }
          } catch (error) {

          }

          // Skip transport API calls for now - service not implemented
          setTransportData([]);
          
          // Fetch flight itineraries
          try {
            const flightUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flight-itinerary/participant/${participant.id}?event_id=${eventId}`;
            const flightResponse = await fetch(flightUrl, { headers });
            
            if (flightResponse.ok) {
              const flightData = await flightResponse.json();
              if (Array.isArray(flightData)) {
                setFlightItineraries(flightData);
              } else {
                setFlightItineraries([]);
              }
            } else {
              setFlightItineraries([]);
            }
          } catch (error) {
            setFlightItineraries([]);
          }

          // Fetch accommodation allocations for this participant by email
          try {
            // Fetch all allocations and filter client-side by guest_email and event_id
            const accommodationResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accommodation/allocations`,
              { headers }
            );
            if (accommodationResponse.ok) {
              const allAccommodations = await accommodationResponse.json();


              // Filter by participant email and event title
              const filteredAccommodations = Array.isArray(allAccommodations)
                ? allAccommodations.filter((acc: AccommodationData) => {
                    const emailMatch = acc.guest_email?.toLowerCase() === participant.email?.toLowerCase();
                    
                    // Check event title match
                    const eventTitleFromObject = acc.event?.title;
                    

                    
                    // Match by event title if we have the current event title
                    // Be more lenient - if we can't get event title or no event info, show all
                    const eventMatch = !currentEventTitle || !eventTitleFromObject ? 
                      true : // Show all if missing event info
                      eventTitleFromObject === currentEventTitle;

                    // Exclude cancelled accommodations
                    const statusMatch = acc.status?.toLowerCase() !== 'cancelled';



                    return emailMatch && eventMatch && statusMatch;
                  })
                : [];


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
          const isInternational = 
            (participant.travelling_internationally && participant.travelling_internationally.toLowerCase() === 'yes') || 
            (participant.travellingInternationally && participant.travellingInternationally.toLowerCase() === 'yes');
          const fromCountry = participant.travelling_from_country;
          

          
          if (isInternational && fromCountry) {
            try {
              // Get tenant info and travel requirements using apiClient
              const tenantData = await apiClient.request(`/tenants/slug/${tenantSlug}`);
              const tenantId = tenantData.id;
              
              const travelData = await apiClient.request(
                `/country-travel-requirements/tenant/${tenantId}/country/${encodeURIComponent(fromCountry)}`
              );
              setTravelRequirements(travelData);
            } catch (error) {
              setTravelRequirements(null);
            }
          } else {
            setTravelRequirements(null);
          }

          // Fetch checklist progress for this participant
          try {
            const progressResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/travel-checklist/progress/${eventId}/${participant.email}`,
              { headers }
            );
            
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              setChecklistProgress(progressData);
            } else {
              setChecklistProgress(null);
            }
          } catch (error) {
            setChecklistProgress(null);
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
        const isInternational = 
          (participant.travelling_internationally && participant.travelling_internationally.toLowerCase() === 'yes') || 
          (participant.travellingInternationally && participant.travellingInternationally.toLowerCase() === 'yes');
        const fromCountry = participant.travelling_from_country;
        
        if (isInternational && fromCountry) {
          // Simplified fetch for travel requirements only
          const fetchTravelRequirements = async () => {
            try {
              const tenantSlug = window.location.pathname.split('/')[2];
              const tenantData = await apiClient.request(`/tenants/slug/${tenantSlug}`);
              const travelData = await apiClient.request(
                `/country-travel-requirements/tenant/${tenantData.id}/country/${encodeURIComponent(fromCountry)}`
              );
              setTravelRequirements(travelData);
            } catch (error) {
              setTravelRequirements(null);
            } finally {
              setLoading(false);
            }
          };
          fetchTravelRequirements();
        } else {
          setLoading(false);
        }
      }
    }, [participant.id, participant.email, participant.status, eventId, apiClient, participant.travelling_internationally, participant.travellingInternationally, participant.travelling_from_country]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white w-full h-full overflow-y-auto">
          <div className="p-6">
            {/* Feedback Message */}
            {feedbackMessage && (
              <div className={`flex items-center justify-between p-4 rounded-lg border-2 shadow-md animate-in slide-in-from-top-2 mb-6 ${
                feedbackMessage.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {feedbackMessage.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${
                    feedbackMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {feedbackMessage.message}
                  </span>
                </div>
                <button
                  onClick={() => setFeedbackMessage(null)}
                  className={`p-1 rounded-lg transition-colors ${
                    feedbackMessage.type === 'success'
                      ? 'hover:bg-green-100 text-green-600'
                      : 'hover:bg-red-100 text-red-600'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

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
                {(!effectiveVettingMode || effectiveVettingMode.canEdit) && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={participant.status}
                      onValueChange={(value) => onStatusChange(participant.id, value)}
                      disabled={effectiveVettingMode && !effectiveVettingMode.canEdit}
                    >
                      <SelectTrigger className="w-32 h-8 bg-white">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="selected">Selected</SelectItem>
                        <SelectItem value="not_selected">Not Selected</SelectItem>
                        <SelectItem value="waiting">Waiting</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="attended">Attended</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={participant.participant_role || participant.role || "visitor"}
                      onValueChange={(value) => onRoleChange(participant.id, value)}
                      disabled={effectiveVettingMode && !effectiveVettingMode.canEdit}
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
                )}
                
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
                    <div
                      className="text-gray-900"
                      dangerouslySetInnerHTML={{
                        __html: participant.dietary_requirements || participant.dietaryRequirements || "-"
                      }}
                    />
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Accommodation Needs:
                    </span>
                    <br />
                    <div
                      className="text-gray-900"
                      dangerouslySetInnerHTML={{
                        __html: participant.accommodation_needs || participant.accommodationNeeds || "-"
                      }}
                    />
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
                      <div
                        className="text-gray-900 text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: participant.motivation_letter || participant.motivationLetter || "No motivation letter provided"
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 block mb-2">
                      Line Manager Recommendation:
                    </span>
                    <div className="bg-white p-4 rounded-lg border">
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
                          <div className="mt-2">
                            {recommendationData.submitted_at ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">Recommendation:</span>
                                {recommendationData.is_recommended ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                    </svg>
                                    Yes, Recommended
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                                    </svg>
                                    Not Recommended
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-500 text-sm italic">
                                Recommendation pending
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          No recommendation requested
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 block mb-2">
                      Letter of Invitation (LOI):
                    </span>
                    <div className="bg-white p-4 rounded-lg border">
                      <LOISection participant={participant} eventId={eventId} />
                    </div>
                  </div>
                  {/* Travel Requirements & Checklist Status */}
                  {((participant.travelling_internationally && participant.travelling_internationally.toLowerCase() === 'yes') || 
                    (participant.travellingInternationally && participant.travellingInternationally.toLowerCase() === 'yes')) && 
                   participant.travelling_from_country && (
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
                            {/* Standard Requirements with Completion Status */}
                            <div className="space-y-2">
                              {travelRequirements.visa_required && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-xs font-medium text-red-700">Visa Required</span>
                                  </div>
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                    checklistProgress?.checklist_items?.visa_required ? 'bg-green-500' : 'bg-gray-300'
                                  }`}>
                                    {checklistProgress?.checklist_items?.visa_required ? (
                                      <span className="text-[8px] text-white">✓</span>
                                    ) : (
                                      <span className="text-[8px] text-gray-600">○</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {travelRequirements.eta_required && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span className="text-xs font-medium text-orange-700">eTA Required</span>
                                  </div>
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                    checklistProgress?.checklist_items?.eta_required ? 'bg-green-500' : 'bg-gray-300'
                                  }`}>
                                    {checklistProgress?.checklist_items?.eta_required ? (
                                      <span className="text-[8px] text-white">✓</span>
                                    ) : (
                                      <span className="text-[8px] text-gray-600">○</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {travelRequirements.passport_required && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-xs font-medium text-blue-700">Passport Required</span>
                                  </div>
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                    checklistProgress?.checklist_items?.passport_required ? 'bg-green-500' : 'bg-gray-300'
                                  }`}>
                                    {checklistProgress?.checklist_items?.passport_required ? (
                                      <span className="text-[8px] text-white">✓</span>
                                    ) : (
                                      <span className="text-[8px] text-gray-600">○</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {travelRequirements.flight_ticket_required && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-xs font-medium text-green-700">Flight Ticket Required</span>
                                  </div>
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                    checklistProgress?.checklist_items?.flight_ticket_required ? 'bg-green-500' : 'bg-gray-300'
                                  }`}>
                                    {checklistProgress?.checklist_items?.flight_ticket_required ? (
                                      <span className="text-[8px] text-white">✓</span>
                                    ) : (
                                      <span className="text-[8px] text-gray-600">○</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Additional Requirements */}
                            {travelRequirements.additional_requirements && travelRequirements.additional_requirements.length > 0 && (
                              <div className="border-t pt-2">
                                <div className="text-xs font-semibold text-gray-600 mb-2">Additional Requirements:</div>
                                <div className="space-y-1">
                                  {travelRequirements.additional_requirements.map((req, index) => {
                                    const reqKey = req.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                                    const isCompleted = checklistProgress?.checklist_items?.[reqKey];
                                    
                                    return (
                                      <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-start gap-2">
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
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                          isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                        }`}>
                                          {isCompleted ? (
                                            <span className="text-[8px] text-white">✓</span>
                                          ) : (
                                            <span className="text-[8px] text-gray-600">○</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Completion Summary */}
                            <div className="border-t pt-2">
                              <div className="text-xs text-gray-500 mb-1">Mobile Checklist Status:</div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                                    <span className="text-[8px] text-white">✓</span>
                                  </div>
                                  <span className="text-[10px] text-gray-600">Complete</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-[8px] text-gray-600">○</span>
                                  </div>
                                  <span className="text-[10px] text-gray-600">Pending</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-[8px] text-gray-600">?</span>
                                  </div>
                                  <span className="text-[10px] text-gray-600">Unknown</span>
                                </div>
                              </div>
                            </div>
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
                  {participant.vetting_comments && (
                    <div>
                      <span className="font-medium text-gray-700 block mb-2">
                        Vetting Comments:
                      </span>
                      <div className="bg-white p-4 rounded-lg border max-h-40 overflow-y-auto">
                        <div className="text-gray-900 text-sm whitespace-pre-wrap">
                          {participant.vetting_comments}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Event Services - Show for selected, confirmed, attended, and registered participants */}
            {["selected", "confirmed", "attended", "registered"].includes(participant.status?.toLowerCase()) &&
             (loading || (flightItineraries && flightItineraries.length > 0) ||
              (transportData && transportData.length > 0) ||
              (accommodationData && accommodationData.length > 0) ||
              voucherData) && (
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
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Flight Itineraries - Only show if has data */}
                    {flightItineraries && flightItineraries.length > 0 && (
                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-6 rounded-xl border-2 border-sky-200">
                      <h5 className="font-semibold text-sky-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Flight Itineraries
                      </h5>
                      <div className="space-y-4">
                        {flightItineraries.map((flight, index) => (
                            <div
                              key={flight.id || index}
                              className="bg-white p-4 rounded-xl border-2 border-sky-100 shadow-sm hover:shadow-md transition-shadow"
                            >
                              {/* Flight Header */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                    flight.ticket_type === 'arrival'
                                      ? 'bg-green-100 text-green-700'
                                      : flight.ticket_type === 'departure'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {flight.ticket_type?.toUpperCase() || 'FLIGHT'}
                                  </span>
                                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                    flight.status === 'confirmed'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {flight.status?.toUpperCase() || 'PENDING'}
                                  </span>
                                </div>
                              </div>

                              {/* Flight Route */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 mb-1">From</p>
                                  <p className="font-semibold text-sm text-gray-900">
                                    {flight.departure_city || 'N/A'}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {flight.departure_time || ''}
                                  </p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 mb-1">To</p>
                                  <p className="font-semibold text-sm text-gray-900">
                                    {flight.arrival_city || 'N/A'}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {flight.arrival_time || ''}
                                  </p>
                                </div>
                              </div>

                              {/* Flight Details */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {flight.airline && (
                                  <div>
                                    <span className="text-gray-500">Airline:</span>
                                    <p className="font-medium text-gray-900">{flight.airline}</p>
                                  </div>
                                )}
                                {flight.flight_number && (
                                  <div>
                                    <span className="text-gray-500">Flight:</span>
                                    <p className="font-medium text-gray-900">{flight.flight_number}</p>
                                  </div>
                                )}
                                {flight.departure_date && (
                                  <div>
                                    <span className="text-gray-500">Date:</span>
                                    <p className="font-medium text-gray-900">
                                      {new Date(flight.departure_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                                {flight.booking_reference && (
                                  <div>
                                    <span className="text-gray-500">Ref:</span>
                                    <p className="font-medium text-gray-900">{flight.booking_reference}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            )
                          )}
                        </div>
                    </div>
                    )}

                    {/* Transport - Only show if has data */}
                    {transportData && transportData.length > 0 && (
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <h5 className="font-semibold text-purple-900 mb-4">
                        Transport Bookings
                      </h5>
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
                    </div>
                    )}

                    {/* Accommodation - Only show if has data */}
                    {accommodationData && accommodationData.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-6 rounded-xl border-2 border-orange-200">
                      <h5 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Accommodation
                      </h5>
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
                    </div>
                    )}

                    {/* Proof of Accommodation - Only show if has proof */}
                    {(participant.proof_of_accommodation_url || accommodationData.length > 0) && (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border-2 border-purple-200 mt-6">
                      <h5 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Proof of Accommodation
                      </h5>

                      {participant.proof_of_accommodation_url ? (
                        <div className="bg-white p-5 rounded-xl border-2 border-purple-100 shadow-sm">
                          {/* Status Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Document Generated
                            </span>
                            {participant.proof_generated_at && (
                              <span className="text-xs text-gray-500">
                                {new Date(participant.proof_generated_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                          </div>

                          {/* Document Info */}
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-purple-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">Accommodation Confirmation</p>
                                <p className="text-sm text-gray-600">Official proof document for visa and travel purposes</p>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <a
                              href={participant.proof_of_accommodation_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Document
                            </a>
                            <a
                              href={participant.proof_of_accommodation_url}
                              download
                              className="flex-1 bg-white hover:bg-gray-50 text-purple-700 border-2 border-purple-200 px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download PDF
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                          <div className="flex items-center gap-3 text-gray-500">
                            <div className="bg-gray-100 p-3 rounded-lg">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Proof document pending</p>
                              <p className="text-sm text-gray-500">Will be generated automatically once accommodation is confirmed</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    )}

                    {/* Drink Vouchers - Only show if has data */}
                    {voucherData && (
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h5 className="font-semibold text-blue-900 mb-4">
                        Drink Vouchers
                      </h5>
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
                              <div className="mt-4 space-y-2">
                                <div className="bg-gray-50 p-2 rounded">
                                  <p className="text-xs text-gray-500 mb-1">Token:</p>
                                  <p className="text-xs font-mono text-gray-700 break-all">
                                    {voucherData.qr_token.slice(0, 8)}...
                                  </p>
                                </div>

                                <div className="bg-blue-50 p-2 rounded">
                                  <p className="text-xs text-gray-500 mb-1">QR URL:</p>
                                  <a
                                    href={`${process.env.NEXT_PUBLIC_BASE_URL}/public/qr/${voucherData.qr_token}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline break-all block"
                                  >
                                    {process.env.NEXT_PUBLIC_BASE_URL}/public/qr/{voucherData.qr_token}
                                  </a>
                                </div>
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
                    </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const fetchParticipants = useCallback(async (preserveOrder = false) => {
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

        // Preserve original order if requested
        if (preserveOrder && participants.length > 0) {
          setParticipants(prevParticipants => {
            const orderedData = [...prevParticipants];
            filteredData.forEach((newP: Participant) => {
              const existingIndex = orderedData.findIndex(p => p.id === newP.id);
              if (existingIndex >= 0) {
                orderedData[existingIndex] = newP;
              } else {
                orderedData.push(newP);
              }
            });
            return orderedData.filter(p => filteredData.some((fp: Participant) => fp.id === p.id));
          });
        } else {
          setParticipants(filteredData);
        }
        
        const countForCallback = roleFilter ? filteredData.length : data.length; // Count all participants when no role filter
        onParticipantsChange?.(countForCallback);
        
        // Load existing comments into state
        const comments: Record<number, string> = {};
        data.forEach((p: Participant) => {
          if (p.vetting_comments) {
            comments[p.id] = p.vetting_comments;
          }
        });
        setParticipantComments(comments);
        
        // Count registered participants for vetting mode
        if (vettingMode?.onRegisteredCountChange) {
          const registeredCount = data.filter((p: Participant) => p.status === 'registered').length;
          vettingMode.onRegisteredCountChange(registeredCount);
        }


      }
    } catch {
      // Error handled silently
    } finally {
      setFetchLoading(false);
    }
  }, [eventId, statusFilter, roleFilter]);

  useEffect(() => {
    fetchParticipants();
  }, [eventId, statusFilter, roleFilter]);
  
  // Close column selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColumnSelector && !(event.target as Element).closest('.column-selector')) {
        setShowColumnSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnSelector]);
  
  useEffect(() => {
    // Check committee status if in vetting mode
    if (vettingMode && (vettingMode.isVettingCommittee || vettingMode.isVettingApprover)) {
      fetchCommitteeStatus();
    }
  }, [eventId, vettingMode?.isVettingCommittee, vettingMode?.isVettingApprover]);
  
  const checkVettingStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/vetting/status`,
        {
          headers: {
            'Authorization': `Bearer ${apiClient.getToken()}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();

        if (data.status === 'submitted') {
          setVettingSubmitted(true);
        } else if (data.status === 'approved') {
          setVettingApproved(true);
        }
      }
    } catch (error) {
      // Silently handle error - vetting status check is not critical
    }
  };

  const fetchCommitteeStatus = useCallback(async () => {
    try {
      const response = await apiClient.request(`/vetting-committee/event/${eventId}`);
      setCommitteeStatus(response.status);
    } catch (error) {
      // Committee not found or access denied
      setCommitteeStatus(null);
    }
  }, [eventId, apiClient]);

  const getCommitteeStatusDisplay = (status: string) => {
    switch (status) {
      case 'open': return { text: 'Open', color: 'bg-blue-100 text-blue-800' };
      case 'pending_approval': return { text: 'Pending Approval', color: 'bg-orange-100 text-orange-800' };
      case 'approved': return { text: 'Approved', color: 'bg-green-100 text-green-800' };
      default: return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

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
    setFeedbackMessage(null);

    // Check if user can edit during vetting
    if (effectiveVettingMode && !effectiveVettingMode.canEdit) {
      showFeedback('error', 'Cannot edit participants during this vetting phase');
      return;
    }

    try {
      const requestBody: any = { status: newStatus };

      // For declined/canceled status, only add comments if they exist
      // Otherwise, user can add them later via the dropdown
      const comments = participantComments[participantId];
      if (comments && comments.trim()) {
        requestBody.comments = comments.trim();
      }

      // In vetting mode, prevent emails until approved
      if (effectiveVettingMode && (effectiveVettingMode.isVettingCommittee || effectiveVettingMode.isVettingApprover)) {
        requestBody.suppress_email = true;
      }

      console.log('Updating participant status:', { participantId, newStatus, requestBody });
      console.log('API URL:', `${process.env.NEXT_PUBLIC_API_URL}/api/v1/event-registration/participant/${participantId}/status`);
      console.log('Token available:', !!apiClient.getToken());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/event-registration/participant/${participantId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('Status update response:', { status: response.status, ok: response.ok, statusText: response.statusText });

      if (response.ok) {
        // Only clear comments if they were actually sent (not for declined/canceled without comments)
        if (comments && comments.trim()) {
          setParticipantComments(prev => ({ ...prev, [participantId]: '' }));
        }
        
        // Update participant in place without refetching
        setParticipants(prev => prev.map(p => 
          p.id === participantId 
            ? { ...p, status: newStatus, vetting_comments: comments || p.vetting_comments }
            : p
        ));
        
        const emailNote = effectiveVettingMode && effectiveVettingMode.submissionStatus !== 'approved' 
          ? " (No email sent - awaiting vetting approval)"
          : newStatus === "selected" ? " Invitation email sent." : "";
        const message = `Participant status updated to ${newStatus}.${emailNote}`;
        showFeedback('success', message);
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || `HTTP ${response.status}` };
        }
        console.error('Status update failed:', { status: response.status, errorData });
        showFeedback('error', `Failed to update participant status: ${errorData.detail || errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Status update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      showFeedback('error', `${errorMessage}. Please try again.`);
    }
  };

  const handleCommentChange = async (participantId: number, comment: string) => {
    if (!comment || !comment.trim()) return;

    try {
      // Get current participant to include current status
      const currentParticipant = participants.find(p => p.id === participantId);
      if (!currentParticipant) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/event-registration/participant/${participantId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            status: currentParticipant.status, // Include current status
            comments: comment.trim(),
            suppress_email: true // Don't send emails when just updating comments
          }),
        }
      );

      if (response.ok) {
        // Update participant comments in place without refetching
        setParticipants(prev => prev.map(p => 
          p.id === participantId 
            ? { ...p, vetting_comments: comment.trim() }
            : p
        ));
        showFeedback('success', 'Comment saved successfully');
      } else {
        const errorText = await response.text();
        console.error('Comment save failed:', errorText);
        showFeedback('error', 'Failed to save comment');
      }
    } catch (error) {
      console.error('Comment save error:', error);
      showFeedback('error', 'Failed to save comment');
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



  const handleExport = () => {
    const csvContent = [
      [
        "Name",
        "OC",
        "Position",
        "Country",
        "Contract Status",
        "Contract Type",
        "Project",
        "Badge Name",
        "Status",
        "Role",
      ].join(","),
      ...filteredParticipants.map((p) =>
        [
          p.full_name,
          p.oc || "",
          p.position || "",
          p.country || "",
          p.contract_status || "",
          p.contract_type || "",
          p.project_of_work || "",
          p.badge_name || "",
          p.status,
          p.participant_role || p.role || "visitor",
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
    setFeedbackMessage(null);

    // Check if user can edit during vetting
    if (vettingMode && !vettingMode.canEdit) {
      showFeedback('error', 'Cannot edit participants during this vetting phase');
      setUpdatingRoleId(null);
      return;
    }

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

        showFeedback('success', `Participant role updated to ${newRole}. Accommodation will be reallocated automatically.`);
      } else {
        showFeedback('error', 'Failed to update participant role.');
      }
    } catch (error) {
      showFeedback('error', 'Failed to update participant role.');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedParticipants.length === 0) return;

    setProcessingBulk(true);
    setFeedbackMessage(null);

    const count = selectedParticipants.length;
    let successCount = 0;
    
    try {
      for (const participantId of selectedParticipants) {
        try {
          await handleStatusChange(participantId, bulkStatus);
          successCount++;
          await new Promise((resolve) => setTimeout(resolve, 100)); // Queue emails
        } catch (error) {
          console.error(`Failed to update participant ${participantId}:`, error);
        }
      }
      
      // Force refresh the participants list
      await fetchParticipants();
      
      setSelectedParticipants([]);
      setBulkStatus("");
      
      if (successCount === count) {
        showFeedback('success', `Updated ${count} participants to ${bulkStatus}`);
      } else {
        showFeedback('error', `Updated ${successCount} of ${count} participants. Some updates failed.`);
      }
    } catch {
      showFeedback('error', 'Failed to update participants');
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleBulkRoleChange = async () => {
    if (!bulkRole || selectedParticipants.length === 0) return;

    setProcessingBulkRole(true);
    setFeedbackMessage(null);

    const count = selectedParticipants.length;
    try {
      for (const participantId of selectedParticipants) {
        await handleRoleChange(participantId, bulkRole);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      setSelectedParticipants([]);
      setBulkRole("");
      showFeedback('success', `Updated ${count} participants to ${bulkRole} role`);
    } catch {
      showFeedback('error', 'Failed to update some participant roles');
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
      {/* Feedback Message */}
      {feedbackMessage && (
        <div className={`flex items-center justify-between p-4 rounded-lg border-2 shadow-md animate-in slide-in-from-top-2 ${
          feedbackMessage.type === 'success'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <span className={`text-sm font-medium ${
              feedbackMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {feedbackMessage.message}
            </span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className={`p-1 rounded-lg transition-colors ${
              feedbackMessage.type === 'success'
                ? 'hover:bg-green-100 text-green-600'
                : 'hover:bg-red-100 text-red-600'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Vetting Mode Read-Only Indicator */}
      {effectiveVettingMode && !effectiveVettingMode.canEdit && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                {(() => {
                  console.log('READ-only message DEBUG:', {
                    submissionStatus: effectiveVettingMode.submissionStatus,
                    isVettingCommittee: effectiveVettingMode.isVettingCommittee,
                    isVettingApprover: effectiveVettingMode.isVettingApprover
                  });
                  
                  const getStatusDisplay = (status: string) => {
                    console.log('getStatusDisplay called with:', status);
                    if (status === 'pending_approval') return 'Pending Approval';
                    if (status === 'approved') return 'Approved';
                    return 'Open';
                  };
                  
                  if (effectiveVettingMode.submissionStatus === 'approved') {
                    return 'Vetting approved - View only mode';
                  } else if (effectiveVettingMode.isVettingCommittee) {
                    return `Read-only: Committee members can only edit when status is Open (current: ${getStatusDisplay(effectiveVettingMode.submissionStatus || 'open')})`;
                  } else if (effectiveVettingMode.isVettingApprover) {
                    return `Read-only: Approvers can only edit when status is Pending Approval (current: ${getStatusDisplay(effectiveVettingMode.submissionStatus || 'open')})`;
                  } else {
                    return 'Read-only: Cannot edit participants during this phase';
                  }
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {roleFilter ? `Event ${roleFilter}s` : "Event Participants"}
            {effectiveVettingMode && (
              <Badge className="ml-2 bg-blue-100 text-blue-800">
                {effectiveVettingMode.isVettingCommittee ? "Vetting Committee" : "Vetting Approver"}
              </Badge>
            )}

          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredParticipants.length} {roleFilter || "participants"}{" "}
            {statusFilter && statusFilter !== "all"
              ? `(${statusFilter.replace("_", " ")})`
              : "total"}{" "}
            • Page {currentPage} of {totalPages || 1}
            {(() => {
              const showReadOnly = effectiveVettingMode && !effectiveVettingMode.canEdit;
              console.log('READ-ONLY DEBUG:', {
                effectiveVettingMode,
                canEdit: effectiveVettingMode?.canEdit,
                showReadOnly
              });
              return showReadOnly ? (
                <span className="text-orange-600 font-medium"> • Read-only mode</span>
              ) : null;
            })()}
            {committeeStatus && (
              <span className="ml-2">
                • Vetting Status: 
                <Badge className={`ml-1 text-xs ${getCommitteeStatusDisplay(committeeStatus).color}`}>
                  {getCommitteeStatusDisplay(committeeStatus).text}
                </Badge>
              </span>
            )}
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
          {selectedParticipants.length > 0 && (!effectiveVettingMode || effectiveVettingMode.canEdit) && (
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
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="attended">Attended</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleBulkStatusChange}
                disabled={!bulkStatus || processingBulk || (effectiveVettingMode && !effectiveVettingMode.canEdit)}
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
                disabled={!bulkRole || processingBulkRole || (effectiveVettingMode && !effectiveVettingMode.canEdit)}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white h-8"
              >
                {processingBulkRole ? "Processing..." : "Set Role"}
              </Button>
            </div>
          )}

          <div className="relative column-selector">
            <Button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Column Filter
            </Button>
            {showColumnSelector && (
              <div className="absolute right-0 top-10 bg-white border rounded-lg shadow-lg p-3 z-10 min-w-48">
                <div className="text-sm font-medium mb-2">Show/Hide Columns</div>
                {Object.entries({
                  name: 'Name',
                  email: 'Email', 
                  oc: 'OC',
                  position: 'Position',
                  country: 'Country',
                  role: 'Role',
                  status: 'Status',
                  confirmed: 'Confirmed',
                  documents: 'Documents',
                  comments: 'Comments',
                  actions: 'Actions'
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={visibleColumns[key as keyof typeof visibleColumns]}
                      onChange={(e) => setVisibleColumns(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="rounded"
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
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
              {visibleColumns.name && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
              )}
              {visibleColumns.email && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
              )}
              {visibleColumns.oc && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OC
                </th>
              )}
              {visibleColumns.position && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
              )}
              {visibleColumns.country && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
              )}
              {visibleColumns.role && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
              )}
              {visibleColumns.status && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              )}
              {visibleColumns.confirmed && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confirmed
                </th>
              )}
              {visibleColumns.documents && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
              )}
              {visibleColumns.comments && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comments
                </th>
              )}
              {visibleColumns.actions && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
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
                {visibleColumns.name && (
                  <td
                    className="px-3 py-4 whitespace-nowrap cursor-pointer"
                    onClick={() => handleViewParticipant(participant)}
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
                )}
                {visibleColumns.email && (
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {participant.email}
                  </td>
                )}
                {visibleColumns.oc && (
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {participant.oc || "-"}
                  </td>
                )}
                {visibleColumns.position && (
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {participant.position || "-"}
                  </td>
                )}
                {visibleColumns.country && (
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {participant.country || "-"}
                  </td>
                )}
                {visibleColumns.role && (
                  <td className="px-3 py-4 whitespace-nowrap">
                    {effectiveVettingMode && !effectiveVettingMode.canEdit ? (
                      <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700">
                        {(participant.participant_role || participant.role || "visitor").toUpperCase()}
                      </Badge>
                    ) : (
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
                    )}
                  </td>
                )}
                {visibleColumns.status && (
                  <td className="px-3 py-4 whitespace-nowrap">
                    <Badge
                      className={`text-xs px-2 py-0.5 ${getStatusColor(
                        participant.status
                      )}`}
                    >
                      {participant.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </td>
                )}
                {visibleColumns.confirmed && (
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
                )}
                {visibleColumns.documents && (
                  <td className="px-3 py-4 whitespace-nowrap">
                    {((participant.travelling_internationally && participant.travelling_internationally.toLowerCase() === 'yes') || 
                      (participant.travellingInternationally && participant.travellingInternationally.toLowerCase() === 'yes')) ? (
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
                )}
                {visibleColumns.comments && (
                  <td className="px-3 py-4">
                    {effectiveVettingMode && effectiveVettingMode.canEdit && 
                     (participant.status === 'declined' || participant.status === 'canceled') ? (
                      <Select
                        value={participantComments[participant.id] || participant.vetting_comments || ''}
                        onValueChange={(value) => {
                          setParticipantComments(prev => ({ 
                            ...prev, 
                            [participant.id]: value 
                          }));
                          // Save comment immediately when selected
                          handleCommentChange(participant.id, value);
                        }}
                      >
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {participant.status === 'declined' ? (
                            <>
                              <SelectItem value="Declined - Operational / Work Reasons">Declined - Operational / Work Reasons</SelectItem>
                              <SelectItem value="Declined - Personal Reasons">Declined - Personal Reasons</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="Cancelled - Operational Reasons">Cancelled - Operational Reasons</SelectItem>
                              <SelectItem value="Cancelled - Personal Reasons">Cancelled - Personal Reasons</SelectItem>
                              <SelectItem value="Cancelled - Prioritising Other Training">Cancelled - Prioritising Other Training</SelectItem>
                              <SelectItem value="Cancelled - Visa Rejected">Cancelled - Visa Rejected</SelectItem>
                              <SelectItem value="Cancelled - Visa Appointment Not Available">Cancelled - Visa Appointment Not Available</SelectItem>
                              <SelectItem value="Cancelled - Visa Issuing Took Too Long">Cancelled - Visa Issuing Took Too Long</SelectItem>
                              <SelectItem value="Cancelled - Visa Process Unfeasible">Cancelled - Visa Process Unfeasible</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    ) : effectiveVettingMode && effectiveVettingMode.canEdit ? (
                      <textarea
                        value={participantComments[participant.id] || ''}
                        onChange={(e) => setParticipantComments(prev => ({ 
                          ...prev, 
                          [participant.id]: e.target.value 
                        }))}
                        placeholder="Add comments..."
                        className="w-full h-16 text-xs border border-gray-300 rounded px-2 py-1 resize-none focus:border-blue-500 focus:outline-none"
                        maxLength={500}
                      />
                    ) : participant.vetting_comments ? (
                      <div className="text-xs text-gray-700 max-w-40 truncate" title={participant.vetting_comments}>
                        {participant.vetting_comments}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                )}
                {visibleColumns.actions && (
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-1">
                    <LOIQuickAccess participant={participant} eventId={eventId} />
                    {/* Show email status for vetting approvers after approval */}
                    {effectiveVettingMode && effectiveVettingMode.isVettingApprover && vettingApproved && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Email sent"></div>
                        {!eventHasEnded && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendInvitation(participant.id)}
                            disabled={resendingId === participant.id}
                            className="h-7 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                            title="Resend notification email"
                          >
                            {resendingId === participant.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700"></div>
                            ) : (
                              <Mail className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                    {/* Show email button for approvers and non-vetting users */}
                    {(!effectiveVettingMode || effectiveVettingMode.isVettingApprover) &&
                      participant.status === "selected" &&
                      participant.email &&
                      participant.email.trim() &&
                      !vettingApproved && (
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
                    {/* Show delete button only for non-vetting users */}
                    {!effectiveVettingMode && (
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
                    )}
                  </div>
                  </td>
                )}
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

      {/* Vetting Committee Submit Button */}
      {vettingMode && vettingMode.isVettingCommittee && filteredParticipants.length > 0 && 
       effectiveVettingMode?.submissionStatus === 'open' && (
        <div className="mt-6 p-4 border-2 rounded-lg bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold mb-1 text-blue-900">
                Vetting Complete
              </h4>
              <p className="text-xs text-blue-700">
                Review all participants and submit for approval when ready.
              </p>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              disabled={submittingVetting}
              onClick={async () => {
                setSubmittingVetting(true);
                try {
                  // Submit vetting for approval
                  const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/vetting/submit`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${apiClient.getToken()}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        event_id: eventId,
                        submitted_by: 'vetting_committee'
                      })
                    }
                  );
                  
                  if (response.ok) {
                    // Update committee status immediately
                    setCommitteeStatus('pending_approval');
                    
                    // Notify parent component about status change
                    if (vettingMode?.onStatusChange) {
                      vettingMode.onStatusChange('pending_approval');
                    }
                    showFeedback('success', 'Vetting submitted for approval! Approver has been notified.');
                  } else {
                    const errorData = await response.json().catch(() => ({}));
                    showFeedback('error', errorData.detail || 'Failed to submit vetting. Please try again.');
                  }
                } catch (error) {
                  showFeedback('error', 'Network error. Please try again.');
                } finally {
                  setSubmittingVetting(false);
                }
              }}
            >
              {submittingVetting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit for Approval'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Vetting Approver Email Template Section */}
      {effectiveVettingMode && effectiveVettingMode.isVettingApprover && effectiveVettingMode.submissionStatus === 'pending_approval' && (
        <div className="mt-6 space-y-4">
          <div className="p-4 border-2 rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-semibold text-blue-900">
                  Notification Email Template
                </h4>
              </div>
              <Button
                onClick={() => setShowEmailTemplate(!showEmailTemplate)}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {showEmailTemplate ? 'Hide Template' : 'Customize Template'}
              </Button>
            </div>
            
            {showEmailTemplate && (
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="emailSubject" className="text-sm font-medium text-gray-700">
                    Email Subject
                  </Label>
                  <Input
                    id="emailSubject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="You have been selected for the event"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="emailBody" className="text-sm font-medium text-gray-700">
                    Email Body
                  </Label>
                  <EmailTemplateEditor
                    value={emailBody}
                    onChange={setEmailBody}
                    eventTitle=""
                    placeholder="Dear participant, you have been selected..."
                    height={300}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={saveEmailTemplate}
                    disabled={savingTemplate}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {savingTemplate ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700 mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Template'
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {!showEmailTemplate && (
              <p className="text-xs text-blue-700 mt-2">
                All tenants have access to this template. Click 'Customize Template' to personalize and save for your tenant's future events.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Vetting Committee Submitted Status */}
      {vettingMode && vettingMode.isVettingCommittee && 
       effectiveVettingMode?.submissionStatus === 'pending_approval' && (
        <div className="mt-6 p-4 border-2 rounded-lg bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-orange-900">
                  Vetting Submitted
                </h4>
                <p className="text-xs text-orange-700">
                  Vetting has been submitted and is awaiting approver review.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50"
              disabled={submittingVetting}
              onClick={async () => {
                setSubmittingVetting(true);
                try {
                  // Get the committee ID first
                  const committeeResponse = await apiClient.request(`/vetting-committee/event/${eventId}`);
                  if (!committeeResponse?.id) {
                    throw new Error('Committee not found');
                  }
                  
                  // Call the backend API to cancel submission
                  const response = await apiClient.request(`/vetting-committee/${committeeResponse.id}/cancel-submission`, {
                    method: 'POST'
                  });
                  
                  // Update committee status immediately
                  setCommitteeStatus('open');
                  
                  // Notify parent component about status change
                  if (vettingMode?.onStatusChange) {
                    vettingMode.onStatusChange('open');
                  }
                  showFeedback('success', 'Submission cancelled. You can now edit participants again.');
                } catch (error: any) {
                  showFeedback('error', error.message || 'Failed to cancel submission.');
                } finally {
                  setSubmittingVetting(false);
                }
              }}
            >
              {submittingVetting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700 mr-2"></div>
                  Cancelling...
                </>
              ) : (
                'Cancel Submission'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Vetting Committee Approved Status */}
      {vettingMode && vettingMode.isVettingCommittee && 
       effectiveVettingMode?.submissionStatus === 'approved' && (
        <div className="mt-6 p-4 border-2 rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h4 className="text-sm font-semibold text-green-900">
                Vetting Approved
              </h4>
              <p className="text-xs text-green-700">
                Vetting has been approved and participant notifications have been sent.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vetting Approved Status */}
      {effectiveVettingMode && effectiveVettingMode.isVettingApprover && (effectiveVettingMode.submissionStatus === 'approved' || vettingApproved) && (
        <div className="mt-6 p-4 border-2 rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="text-sm font-semibold text-green-900">
                  Vetting Approved
                </h4>
                <p className="text-xs text-green-700">
                  Participant notifications have been sent successfully.
                </p>
              </div>
            </div>
            {!eventHasEnded && (
              <Button
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
                disabled={submittingVetting}
                onClick={async () => {
                setSubmittingVetting(true);
                try {
                  const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/vetting/cancel-approval`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${apiClient.getToken()}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );
                  
                  if (response.ok) {
                    const { toast } = await import("@/hooks/use-toast");
                    toast({
                      title: "Success!",
                      description: "Vetting approval cancelled. You can now approve again.",
                    });
                    
                    // Update committee status immediately
                    setCommitteeStatus('pending_approval');
                    
                    // Notify parent component about status change
                    if (vettingMode?.onStatusChange) {
                      vettingMode.onStatusChange('pending_approval');
                    }
                    
                    setVettingApproved(false);
                  } else {
                    const errorData = await response.json().catch(() => ({}));
                    const { toast } = await import("@/hooks/use-toast");
                    toast({
                      title: "Error!",
                      description: errorData.detail || 'Failed to cancel approval.',
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
                  setSubmittingVetting(false);
                }
              }}
            >
              {submittingVetting ? "Cancelling..." : "Cancel Approval"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Vetting Approver Approve Button */}
      {effectiveVettingMode && effectiveVettingMode.isVettingApprover && effectiveVettingMode.submissionStatus === 'pending_approval' && !vettingApproved && (
        <div className="mt-6 p-4 border-2 rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold mb-1 text-green-900">
                Vetting Approval Required
              </h4>
              <p className="text-xs text-green-700">
                Review participant selections and approve to send notification emails.
              </p>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
              disabled={submittingVetting}
              onClick={async () => {
                setSubmittingVetting(true);
                try {
                  // Approve vetting with optional custom email template
                  const requestBody: any = {};
                  if (emailSubject || emailBody) {
                    requestBody.email_subject = emailSubject || undefined;
                    requestBody.email_body = emailBody || undefined;
                  }

                  const hasBody = Object.keys(requestBody).length > 0;
                  const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/vetting/approve`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${apiClient.getToken()}`,
                        ...(hasBody && { 'Content-Type': 'application/json' })
                      },
                      ...(hasBody && { body: JSON.stringify(requestBody) })
                    }
                  );
                  
                  if (response.ok) {
                    const data = await response.json();
                    const { toast } = await import("@/hooks/use-toast");
                    toast({
                      title: "Success!",
                      description: `Vetting approved! Notification emails sent to ${data.participants_notified || 0} participants.`,
                    });
                    
                    // Update committee status immediately
                    setCommitteeStatus('approved');
                    
                    // Notify parent component about status change
                    if (vettingMode?.onStatusChange) {
                      vettingMode.onStatusChange('approved');
                    }
                    
                    // Update vetting status to approved
                    setVettingApproved(true);
                  } else {
                    const errorData = await response.json().catch(() => ({}));
                    const { toast } = await import("@/hooks/use-toast");
                    toast({
                      title: "Error!",
                      description: errorData.detail || 'Failed to approve vetting. Please try again.',
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  showFeedback('error', 'Network error. Please try again.');
                } finally {
                  setSubmittingVetting(false);
                }
              }}
            >
              {submittingVetting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Vetting
                </>
              )}
            </Button>
          </div>
        </div>
      )}

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
