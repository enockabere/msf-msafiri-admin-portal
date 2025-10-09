"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Plus, Send, Search, Printer, Download, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

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
  dietary_requirements?: string;
  accommodation_needs?: string;
  code_of_conduct_confirm?: string;
  travel_requirements_confirm?: string;
  daily_meals?: string;
  travelling_internationally?: string;
  accommodation_type?: string;
  // Alternative field names from API
  certificateName?: string;
  dietaryRequirements?: string;
  accommodationNeeds?: string;
  codeOfConductConfirm?: string;
  travelRequirementsConfirm?: string;
  dailyMeals?: string;
  travellingInternationally?: string;
  accommodationType?: string;
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
  const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [processingBulk, setProcessingBulk] = useState(false);

// Participant Details Modal Component
interface ParticipantDetailsModalProps {
  participant: Participant;
  onClose: () => void;
  eventId: number;
  getStatusColor: (status: string) => string;
}

interface TransportBooking {
  booking_type?: string;
  pickup_locations?: string[];
  status?: string;
  scheduled_time?: string;
}

interface AccommodationData {
  name?: string;
  address?: string;
  location?: string;
  status?: string;
  check_in_date?: string;
  check_out_date?: string;
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

function ParticipantDetailsModal({ participant, onClose, eventId, getStatusColor }: ParticipantDetailsModalProps) {
  const [transportData, setTransportData] = useState<TransportBooking[]>([]);
  const [accommodationData, setAccommodationData] = useState<AccommodationData[]>([]);
  const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipantServices = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Skip transport and accommodation API calls for now - services not implemented
        setTransportData([]);
        setAccommodationData([]);

        // Fetch QR/voucher data with proper error handling
        try {
          const qrResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/participants/${participant.id}/qr`,
            { headers }
          );
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();

            setVoucherData({
              ...qrData.allocation_summary,
              qr_token: qrData.qr_token,
              qr_data_url: qrData.qr_data_url
            });
          } else {
            // Fallback to event allocations
            const allocationsResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/event/${eventId}`,
              { headers }
            );
            if (allocationsResponse.ok) {
              const allocations = await allocationsResponse.json();
              const drinkAllocations = allocations.filter((a: any) => a.drink_vouchers_per_participant > 0);
              if (drinkAllocations.length > 0) {
                const totalVouchers = drinkAllocations.reduce((sum: number, a: any) => sum + (a.drink_vouchers_per_participant || 0), 0);
                setVoucherData({
                  total_drinks: totalVouchers,
                  remaining_drinks: totalVouchers,
                  redeemed_drinks: 0,
                  participant_id: participant.id,
                  event_id: eventId
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
      } catch {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    };

    if (participant.status === 'selected') {
      fetchParticipantServices();
    } else {
      setLoading(false);
    }
  }, [participant.id, participant.status, eventId]);



  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{participant.full_name}</h3>
              <p className="text-gray-600 mt-1">{participant.email}</p>
              <Badge className={`mt-2 ${getStatusColor(participant.status)}`}>
                {participant.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <Button
              variant="outline"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl px-3 py-2"
            >
              ×
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Personal Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-gray-200 pb-2">Personal Information</h4>
              <div className="space-y-3 text-sm">
                <div><span className="font-medium text-gray-700">Personal Email:</span><br/><span className="text-gray-900">{participant.personal_email || '-'}</span></div>
                <div><span className="font-medium text-gray-700">MSF Email:</span><br/><span className="text-gray-900">{participant.msf_email || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Phone:</span><br/><span className="text-gray-900">{participant.phone_number || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Gender Identity:</span><br/><span className="text-gray-900">{participant.gender_identity || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Sex:</span><br/><span className="text-gray-900">{participant.sex || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Pronouns:</span><br/><span className="text-gray-900">{participant.pronouns || '-'}</span></div>
              </div>
            </div>
            
            {/* Work Information */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-blue-200 pb-2">Work Information</h4>
              <div className="space-y-3 text-sm">
                <div><span className="font-medium text-gray-700">OC:</span><br/><span className="text-gray-900">{participant.oc || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Position:</span><br/><span className="text-gray-900">{participant.position || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Country:</span><br/><span className="text-gray-900">{participant.country || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Project:</span><br/><span className="text-gray-900">{participant.project_of_work || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Contract Status:</span><br/><span className="text-gray-900">{participant.contract_status || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Contract Type:</span><br/><span className="text-gray-900">{participant.contract_type || '-'}</span></div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-green-200 pb-2">Contact Information</h4>
              <div className="space-y-3 text-sm">
                <div><span className="font-medium text-gray-700">HRCO Email:</span><br/><span className="text-gray-900">{participant.hrco_email || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Career Manager:</span><br/><span className="text-gray-900">{participant.career_manager_email || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Line Manager:</span><br/><span className="text-gray-900">{participant.line_manager_email || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Registered:</span><br/><span className="text-gray-900">{new Date(participant.created_at).toLocaleDateString()}</span></div>
              </div>
            </div>
            
            {/* Registration Details */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-purple-200 pb-2">Registration Details</h4>
              <div className="space-y-3 text-sm">
                <div><span className="font-medium text-gray-700">Certificate Name:</span><br/><span className="text-gray-900">{participant.certificate_name || participant.certificateName || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Travelling Internationally:</span><br/><span className="text-gray-900">{participant.travelling_internationally || participant.travellingInternationally || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Accommodation Type:</span><br/><span className="text-gray-900">{participant.accommodation_type || participant.accommodationType || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Daily Meals:</span><br/><span className="text-gray-900">{participant.daily_meals || participant.dailyMeals || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Dietary Requirements:</span><br/><span className="text-gray-900">{participant.dietary_requirements || participant.dietaryRequirements || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Accommodation Needs:</span><br/><span className="text-gray-900">{participant.accommodation_needs || participant.accommodationNeeds || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Code of Conduct:</span><br/><span className="text-gray-900">{participant.code_of_conduct_confirm || participant.codeOfConductConfirm || '-'}</span></div>
                <div><span className="font-medium text-gray-700">Travel Requirements:</span><br/><span className="text-gray-900">{participant.travel_requirements_confirm || participant.travelRequirementsConfirm || '-'}</span></div>
              </div>
            </div>
          </div>
          
          {/* Event Services - Only show if participant is selected */}
          {participant.status === 'selected' && (
            <div className="mt-8">
              <h4 className="font-semibold text-gray-900 mb-6 text-xl border-b border-gray-300 pb-3">Event Services</h4>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading services...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Transport */}
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <h5 className="font-semibold text-purple-900 mb-4">Transport Bookings</h5>
                    {transportData && transportData.length > 0 ? (
                      <div className="space-y-3">
                        {transportData.map((booking: TransportBooking, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <p className="font-medium text-sm">{booking.booking_type || 'Transport'}</p>
                            <p className="text-xs text-gray-600">{booking.pickup_locations?.[0] || 'TBD'}</p>
                            <p className="text-xs text-gray-600">Status: {booking.status || 'Pending'}</p>
                            {booking.scheduled_time && (
                              <p className="text-xs text-gray-600">{new Date(booking.scheduled_time).toLocaleString()}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        <p>No transport bookings assigned</p>
                        <p className="text-xs mt-1 text-gray-500">Transport services will be arranged closer to the event date</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Accommodation */}
                  <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                    <h5 className="font-semibold text-orange-900 mb-4">Accommodation</h5>
                    {accommodationData && accommodationData.length > 0 ? (
                      <div className="space-y-3">
                        {accommodationData.map((accommodation, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <p className="font-medium text-sm">{accommodation.name || 'Accommodation'}</p>
                            <p className="text-xs text-gray-600">{accommodation.address || accommodation.location || 'TBD'}</p>
                            <p className="text-xs text-gray-600">Status: {accommodation.status || 'Pending'}</p>
                            {accommodation.check_in_date && (
                              <p className="text-xs text-gray-600">
                                {new Date(accommodation.check_in_date).toLocaleDateString()} - 
                                {accommodation.check_out_date ? new Date(accommodation.check_out_date).toLocaleDateString() : 'TBD'}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        <p>No accommodation assigned</p>
                        <p className="text-xs mt-1 text-gray-500">Accommodation will be arranged closer to the event date</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Drink Vouchers */}
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-900 mb-4">Drink Vouchers</h5>
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
                            <div className="text-gray-500 text-sm">QR Code not available</div>
                          )}
                          {voucherData.qr_token && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 font-mono">
                                Token: {voucherData.qr_token.slice(0, 8)}...
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                QR URL: <a href={`${process.env.NEXT_PUBLIC_BASE_URL}/public/qr/${voucherData.qr_token}`} target="_blank" rel="noopener noreferrer" className="underline">
                                  {process.env.NEXT_PUBLIC_BASE_URL}/public/qr/{voucherData.qr_token}
                                </a>
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span>Total Vouchers:</span>
                            <span className="font-medium">{voucherData.total_drinks || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Remaining:</span>
                            <span className="font-medium text-green-600">{voucherData.remaining_drinks || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Redeemed:</span>
                            <span className="font-medium text-red-600">{voucherData.redeemed_drinks || 0}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        <p>No drink vouchers assigned</p>
                        <p className="text-xs mt-1 text-gray-500">Vouchers will be available once event allocations are configured</p>
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        const filteredData = roleFilter
          ? data.filter((p: Participant) => p.role === roleFilter)
          : data.filter((p: Participant) => p.role !== "facilitator");

        setParticipants(filteredData);
        const countForCallback = roleFilter
          ? filteredData.length
          : data.filter((p: Participant) => p.role !== "facilitator").length;
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
      role: roleFilter || "attendee",
    };

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/event-registration/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      console.error("❌ Frontend: Network error adding participant:", error);
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      console.error("Failed to update participant status:", error);
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      console.error("Failed to resend invitation:", error);
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
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredParticipants = participants.filter(participant => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      participant.full_name.toLowerCase().includes(searchLower) ||
      participant.email.toLowerCase().includes(searchLower) ||
      (participant.oc && participant.oc.toLowerCase().includes(searchLower)) ||
      (participant.position && participant.position.toLowerCase().includes(searchLower)) ||
      (participant.country && participant.country.toLowerCase().includes(searchLower));
    
    return matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'OC', 'Position', 'Country', 'Contract Status', 'Contract Type', 'Gender Identity', 'Sex', 'Pronouns', 'Project', 'Personal Email', 'MSF Email', 'HRCO Email', 'Career Manager', 'Line Manager', 'Phone', 'Status'].join(','),
      ...filteredParticipants.map(p => [
        p.full_name,
        p.email,
        p.oc || '',
        p.position || '',
        p.country || '',
        p.contract_status || '',
        p.contract_type || '',
        p.gender_identity || '',
        p.sex || '',
        p.pronouns || '',
        p.project_of_work || '',
        p.personal_email || '',
        p.msf_email || '',
        p.hrco_email || '',
        p.career_manager_email || '',
        p.line_manager_email || '',
        p.phone_number || '',
        p.status
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      console.error("Failed to delete participant:", error);
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
    setSelectedParticipants(prev => 
      prev.includes(participantId) 
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleSelectAll = () => {
    if (selectedParticipants.length === currentParticipants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(currentParticipants.map(p => p.id));
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedParticipants.length === 0) return;
    
    setProcessingBulk(true);
    try {
      for (const participantId of selectedParticipants) {
        await handleStatusChange(participantId, bulkStatus);
        await new Promise(resolve => setTimeout(resolve, 100)); // Queue emails
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
              : "total"} • Page {currentPage} of {totalPages || 1}
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
              <SelectItem value="all" className="hover:bg-red-50 focus:bg-red-50">All Statuses</SelectItem>
              <SelectItem value="registered" className="hover:bg-red-50 focus:bg-red-50">Registered</SelectItem>
              <SelectItem value="selected" className="hover:bg-red-50 focus:bg-red-50">Selected</SelectItem>
              <SelectItem value="not_selected" className="hover:bg-red-50 focus:bg-red-50">Not Selected</SelectItem>
              <SelectItem value="waiting" className="hover:bg-red-50 focus:bg-red-50">Waiting</SelectItem>
              <SelectItem value="canceled" className="hover:bg-red-50 focus:bg-red-50">Canceled</SelectItem>
              <SelectItem value="attended" className="hover:bg-red-50 focus:bg-red-50">Attended</SelectItem>
            </SelectContent>
          </Select>
          {selectedParticipants.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border">
              <span className="text-sm text-blue-700">{selectedParticipants.length} selected</span>
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
                  checked={selectedParticipants.length === currentParticipants.length && currentParticipants.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OC</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                <td className="px-3 py-4 whitespace-nowrap cursor-pointer" onClick={() => setViewingParticipant(participant)}>
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
                  {participant.oc || '-'}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {participant.position || '-'}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {participant.country || '-'}
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
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-1">
                    {participant.status === "selected" &&
                      participant.email &&
                      participant.email.trim() && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvitation(participant.id)}
                          disabled={resendingId === participant.id || eventHasEnded}
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
              Showing {startIndex + 1} to {Math.min(endIndex, filteredParticipants.length)} of {filteredParticipants.length} participants
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
        />
      )}
    </div>
  );
}
