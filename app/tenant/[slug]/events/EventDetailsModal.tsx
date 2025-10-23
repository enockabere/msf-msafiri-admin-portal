"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  Paperclip,
  Settings,
  Star,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  Edit3,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import EventParticipants from "./EventParticipants";
import EventAttachments from "./EventAttachments";
import EventAllocations from "./EventAllocations";
import EventAgenda from "./EventAgenda";
import EventFood from "./EventFood";
import SessionFeedback from "@/components/events/SessionFeedback";
import { LazyImage } from "@/components/ui/lazy-image";
import { GoogleMap } from "@/components/ui/google-map";

interface Event {
  id: number;
  title: string;
  description?: string;
  event_type?: string;
  status: string;
  start_date: string;
  end_date: string;
  location?: string;
  address?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  banner_image?: string;
  duration_days?: number;
  perdiem_rate?: number;
  perdiem_currency?: string;
  registration_deadline?: string;
}

interface Participant {
  id: number;
  role: string;
  participant_role?: string;
  status: string;
  participant_name?: string;
}

interface Feedback {
  participant_name: string;
  overall_rating: number;
  feedback_text?: string;
}

interface StatusSuggestions {
  suggestions: string[];
}

interface AgendaItem {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
}

interface EventDetailsModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  canManageEvents?: boolean;
}

export default function EventDetailsModal({
  event,
  isOpen,
  onClose,
  tenantSlug,
  canManageEvents = true,
}: EventDetailsModalProps) {
  const { accessToken, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [tabLoading, setTabLoading] = useState(false);

  const [, setFeedbackStats] = useState<{
    total_responses: number;
    average_overall_rating: number;
    unread: number;
    urgent: number;
    average_content_rating?: number;
    average_organization_rating?: number;
    average_venue_rating?: number;
    recommendation_percentage?: number;
  } | null>(null);
  const [, setFeedback] = useState<Feedback[]>([]);
  const [, setStatusSuggestions] = useState<StatusSuggestions | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [facilitatorsCount, setFacilitatorsCount] = useState(0);
  const [attachmentsCount, setAttachmentsCount] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Partial<Event>>({});
  const [saving, setSaving] = useState(false);
  const [, setAgenda] = useState<AgendaItem[]>([]);

  const handleParticipantsChange = useCallback((count: number) => {
    setParticipantsCount(count);
  }, []);

  const handleFacilitatorsChange = useCallback((count: number) => {
    setFacilitatorsCount(count);
  }, []);

  const fetchParticipants = useCallback(async () => {
    if (!event || !accessToken) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${event.id}/participants/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
        // Set counts for all participants (no filtering needed since we removed facilitator tab)
        setParticipantsCount(data.length);
        
        // Count facilitators for overview display
        const facilitators = data.filter(
          (p: Participant) => (p.participant_role || p.role) === "facilitator"
        );
        setFacilitatorsCount(facilitators.length);
      }
    } catch {
      console.error("Error fetching participants");
    }
  }, [event, accessToken]);

  const fetchAttachments = useCallback(async () => {
    if (!event || !accessToken) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${event.id}/attachments/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAttachmentsCount(data.length);
      }
    } catch {
      setAttachmentsCount(0);
    }
  }, [event, accessToken]);

  const fetchAgenda = useCallback(async () => {
    if (!event || !accessToken) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${event.id}/agenda/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAgenda(data);
      }
    } catch {
      setAgenda([]);
    }
  }, [event, accessToken, setAgenda]);

  const fetchFeedbackStats = useCallback(async () => {
    if (!event) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${event.id}/feedback/stats`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFeedbackStats(data);
      }
    } catch {
      // Silently fail - feedback feature is optional
      setFeedbackStats({
        total_responses: 0,
        average_overall_rating: 0,
        unread: 0,
        urgent: 0,
      });
    }
  }, [event, accessToken]);

  const fetchFeedback = useCallback(async () => {
    if (!event) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${event.id}/feedback`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      }
    } catch {
      // Silently fail - feedback feature is optional
      setFeedback([]);
    }
  }, [event, accessToken]);

  const fetchStatusSuggestions = useCallback(async () => {
    if (!event) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${event.id}/status/suggestions`
      );

      if (response.ok) {
        const data = await response.json();
        setStatusSuggestions(data);
      } else {
        console.error(
          "Failed to fetch status suggestions:",
          response.status,
          response.statusText
        );
        setStatusSuggestions({ suggestions: [] });
      }
    } catch (error) {
      console.error("Error fetching status suggestions:", error);
      setStatusSuggestions({ suggestions: [] });
    }
  }, [event, setStatusSuggestions]);

  useEffect(() => {
    if (event && isOpen) {
      const loadData = async () => {
        await Promise.all([
          fetchFeedbackStats(),
          fetchFeedback(),
          fetchStatusSuggestions(),
          fetchParticipants(),
          fetchAgenda(),
          fetchAttachments(),
        ]);
        setEditedEvent(event);
      };
      loadData();
    }
  }, [
    event,
    isOpen,
    fetchFeedbackStats,
    fetchFeedback,
    fetchStatusSuggestions,
    fetchParticipants,
    fetchAgenda,
    fetchAttachments,
  ]);

  const saveEventChanges = async () => {
    if (!event) return;

    setSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${event.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedEvent),
        }
      );

      if (response.ok) {
        setEditMode(false);

        // Send notifications
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${event.id}/notify-update`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Success!",
          description: "Event updated and notifications sent to participants.",
        });

        window.location.reload();
      } else {
        const errorText = await response.text();
        console.error("Failed to update event:", errorText);

        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: "Failed to update event. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating event:", error);

      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateEventStatus = async (newStatus: string) => {
    if (!event) return;

    setUpdatingStatus(true);

    try {
      if (!accessToken || !isAuthenticated) {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Authentication Error!",
          description: "Please log in again.",
          variant: "destructive",
        });
        setUpdatingStatus(false);
        return;
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${event.id}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (response.ok) {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Success!",
          description: `Event status updated to ${newStatus}.`,
        });
        onClose(); // Close modal first
        setTimeout(() => window.location.reload(), 500); // Then reload
      } else if (response.status === 401) {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Authentication Error!",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        window.location.href = "/login";
      } else {
        const errorText = await response.text();
        console.error("Failed to update status:", response.status, errorText);

        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: `Failed to update event status: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);

      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Network error. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!event) return null;

  // Check if event has ended or started
  const eventHasEnded = new Date() > new Date(event.end_date);
  const eventHasStarted = new Date() >= new Date(event.start_date);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] sm:w-[95vw] lg:w-[90vw] xl:w-[85vw] h-[95vh] sm:h-[90vh] max-w-[98vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] overflow-hidden bg-white border-0 shadow-2xl p-0 rounded-2xl">
        {/* Enhanced Header with Gradient Background */}
        <DialogHeader className="px-4 sm:px-6 lg:px-8 py-6 border-b-2 border-gray-100 bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 rounded-t-2xl relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-200/30 to-pink-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-orange-200/30 to-yellow-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {event.title}
                </h2>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location || "Location not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <Badge
                className={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${
                  event.status === "Published"
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                    : event.status === "Draft"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    : "bg-gradient-to-r from-gray-500 to-slate-500 text-white"
                }`}
              >
                {event.status}
              </Badge>
              {canManageEvents && !eventHasStarted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                  className="text-gray-700 border-gray-300 hover:bg-white hover:border-red-300 hover:text-red-600"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Event details and management interface for {event.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setTabLoading(true);
              setTimeout(() => {
                setActiveTab(value);
                setTabLoading(false);
              }, 150);
            }}
            className="h-full flex flex-col"
          >
            <TabsList className="inline-flex w-auto gap-2 bg-transparent border-b-0 p-0 mx-4 sm:mx-6 lg:mx-8 mt-4 h-auto overflow-x-auto">
              <TabsTrigger
                value="overview"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="participants"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 hover:bg-gray-50"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Participants</span>
                <span className="sm:hidden">P</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  {participantsCount}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="attachments"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 hover:bg-gray-50"
              >
                <Paperclip className="h-4 w-4" />
                <span className="hidden sm:inline">Files</span>
                <span className="sm:hidden">F</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  {attachmentsCount}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="allocations"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 hover:bg-gray-50 hidden sm:inline-flex"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden lg:inline">Allocations</span>
                <span className="lg:hidden">Alloc</span>
              </TabsTrigger>
              <TabsTrigger
                value="agenda"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Agenda</span>
                <span className="sm:hidden">A</span>
              </TabsTrigger>
              <TabsTrigger
                value="food"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 hover:bg-gray-50"
              >
                <UtensilsCrossed className="h-4 w-4" />
                <span className="hidden sm:inline">Food</span>
                <span className="sm:hidden">F</span>
              </TabsTrigger>
              <TabsTrigger
                value="feedback"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 hover:bg-gray-50"
              >
                <Star className="h-4 w-4" />
                <span className="whitespace-nowrap">Feedback</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto relative">
              {tabLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                    <span className="text-sm text-gray-600">Loading...</span>
                  </div>
                </div>
              )}
              <TabsContent
                value="overview"
                className="space-y-4 sm:space-y-6 mt-0 bg-gray-50 mx-3 sm:mx-4 lg:mx-6 p-3 sm:p-4 lg:p-6 rounded-lg border-0 shadow-none h-full overflow-y-auto"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      Event Overview
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Detailed information about this event
                    </p>
                  </div>
                  {event.status === "Draft" && !editMode && canManageEvents && !eventHasStarted && (
                    <Button
                      onClick={() => setEditMode(true)}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto text-xs px-3 py-2 h-8"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit Event
                    </Button>
                  )}
                </div>

                {editMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Event Title
                        </label>
                        <input
                          type="text"
                          value={editedEvent.title || ""}
                          onChange={(e) =>
                            setEditedEvent({
                              ...editedEvent,
                              title: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Event Type
                        </label>
                        <input
                          type="text"
                          value={editedEvent.event_type || ""}
                          onChange={(e) =>
                            setEditedEvent({
                              ...editedEvent,
                              event_type: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        value={editedEvent.description || ""}
                        onChange={(e) =>
                          setEditedEvent({
                            ...editedEvent,
                            description: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded-lg h-24"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={editedEvent.location || ""}
                          onChange={(e) =>
                            setEditedEvent({
                              ...editedEvent,
                              location: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          value={editedEvent.address || ""}
                          onChange={(e) =>
                            setEditedEvent({
                              ...editedEvent,
                              address: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={saveEventChanges}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditMode(false);
                          setEditedEvent(event);
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-white p-5 sm:p-6 rounded-xl border-2 border-red-100 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-base sm:text-lg mb-4 text-red-800 flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 shadow-sm">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        Event Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-normal text-gray-600">Type:</span>
                          <span className="text-sm text-gray-900 font-medium">{event.event_type || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-normal text-gray-600">Start Date:</span>
                          <span className="text-sm text-gray-900 font-medium">
                            {new Date(event.start_date).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-normal text-gray-600">End Date:</span>
                          <span className="text-sm text-gray-900 font-medium">
                            {new Date(event.end_date).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-normal text-gray-600">Duration:</span>
                          <span className="text-sm text-red-600 font-semibold">
                            {Math.floor(Math.abs(new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 p-5 sm:p-6 rounded-xl border-2 border-red-100 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-base sm:text-lg mb-4 text-red-800 flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 shadow-sm">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        Participants
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-red-200">
                          <span className="font-medium text-gray-700">
                            Registered:
                          </span>
                          <span className="text-gray-900 font-semibold">
                            {participants.length} participants
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-red-200">
                          <span className="font-medium text-gray-700">
                            Selected:
                          </span>
                          <span className="text-green-700 font-semibold">
                            {
                              participants.filter(
                                (p) =>
                                  p.status === "selected" &&
                                  (p.participant_role || p.role) !== "facilitator"
                              ).length
                            }{" "}
                            visitors
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-red-200">
                          <span className="font-medium text-gray-700">
                            Facilitators:
                          </span>
                          <span className="text-purple-700 font-semibold">
                            {(() => {
                              console.log('All participants:', participants);
                              console.log('Participant roles:', participants.map(p => ({ id: p.id, role: p.role, participant_role: p.participant_role, name: p.participant_name })));
                              const facilitators = participants.filter(
                                (p) => (p.participant_role || p.role) === "facilitator"
                              );
                              console.log('Filtered facilitators:', facilitators);
                              return facilitators.length;
                            })()}{" "}
                            facilitators
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-red-200">
                          <span className="font-medium text-gray-700">
                            Organizers:
                          </span>
                          <span className="text-blue-700 font-semibold">
                            {(() => {
                              const organizers = participants.filter(
                                (p) => (p.participant_role || p.role) === "organizer"
                              );
                              console.log('Filtered organizers:', organizers);
                              return organizers.length;
                            })()}{" "}
                            organizers
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-red-200">
                          <span className="font-medium text-gray-700">
                            Waiting:
                          </span>
                          <span className="text-yellow-700 font-semibold">
                            {
                              participants.filter(
                                (p) =>
                                  p.status === "waiting" &&
                                  (p.participant_role || p.role) !== "facilitator"
                              ).length
                            }{" "}
                            visitors
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-red-200">
                          <span className="font-medium text-gray-700">
                            Attended:
                          </span>
                          <span className="text-red-700 font-semibold">
                            {
                              participants.filter(
                                (p) =>
                                  p.status === "attended" &&
                                  (p.participant_role || p.role) !== "facilitator"
                              ).length
                            }{" "}
                            visitors
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="font-medium text-gray-700">
                            Declined:
                          </span>
                          <span className="text-orange-700 font-semibold">
                            {
                              participants.filter(
                                (p) => p.status === "declined"
                              ).length
                            }{" "}
                            participants
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                      <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Location & Venue
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <span className="font-medium text-gray-700 block mb-2">
                            Venue:
                          </span>
                          <div className="bg-white p-3 rounded-lg border">
                            <span className="text-gray-900 font-semibold">
                              {event.location || "Not specified"}
                            </span>
                          </div>
                        </div>
                        {event.address && (
                          <div>
                            <span className="font-medium text-gray-700 block mb-2">
                              Address:
                            </span>
                            <div className="bg-white p-3 rounded-lg border">
                              <span className="text-gray-700">
                                {event.address}
                              </span>
                            </div>
                          </div>
                        )}
                        {(() => {
                          const lat = typeof event.latitude === 'string' ? parseFloat(event.latitude) : event.latitude;
                          const lng = typeof event.longitude === 'string' ? parseFloat(event.longitude) : event.longitude;
                          
                          const hasValidCoords = lat && lng && 
                            typeof lat === 'number' && typeof lng === 'number' &&
                            isFinite(lat) && isFinite(lng) &&
                            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
                            
                          return hasValidCoords ? { lat, lng } : null;
                        })() && (() => {
                          const lat = typeof event.latitude === 'string' ? parseFloat(event.latitude) : event.latitude;
                          const lng = typeof event.longitude === 'string' ? parseFloat(event.longitude) : event.longitude;
                          
                          return (
                            <div>
                              <span className="font-medium text-gray-700 block mb-2">
                                Map:
                              </span>
                              <GoogleMap
                                latitude={lat}
                                longitude={lng}
                                markerTitle={event.location || "Event Location"}
                                className="h-48 rounded-lg border"
                              />
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {!editMode && event.description && (
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">
                      Description
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                        {event.description}
                      </p>
                    </div>
                  </div>
                )}

                {!editMode && event.banner_image && event.banner_image.trim() && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">
                      Event Banner
                    </h3>
                    <LazyImage
                      src={event.banner_image}
                      alt={`${event.title} banner`}
                      className="w-full h-64 rounded-lg border"
                      placeholder={
                        <div className="flex items-center justify-center h-full">
                          <div className="text-gray-400">Loading banner...</div>
                        </div>
                      }
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="participants"
                className="mt-4 bg-white mx-4 sm:mx-6 p-4 sm:p-6 rounded-lg border shadow-sm"
              >
                <EventParticipants
                  eventId={event.id}
                  tenantSlug={tenantSlug}
                  onParticipantsChange={handleParticipantsChange}
                  eventHasEnded={eventHasEnded}
                  canManageEvents={canManageEvents}
                />
              </TabsContent>



              <TabsContent
                value="attachments"
                className="mt-0 bg-gray-50 mx-3 sm:mx-4 lg:mx-6 p-3 sm:p-4 lg:p-6 rounded-lg border-0 shadow-none h-full overflow-y-auto"
              >
                <EventAttachments
                  eventId={event.id}
                  tenantSlug={tenantSlug}
                  onAttachmentsChange={setAttachmentsCount}
                  eventHasEnded={eventHasEnded}
                />
              </TabsContent>

              <TabsContent
                value="agenda"
                className="mt-0 bg-gray-50 mx-3 sm:mx-4 lg:mx-6 p-3 sm:p-4 lg:p-6 rounded-lg border-0 shadow-none h-full overflow-y-auto"
              >
                <EventAgenda
                  eventId={event.id}
                  tenantSlug={tenantSlug}
                  eventHasEnded={eventHasEnded}
                />
              </TabsContent>

              <TabsContent
                value="allocations"
                className="mt-0 bg-gray-50 mx-3 sm:mx-4 lg:mx-6 p-3 sm:p-4 lg:p-6 rounded-lg border-0 shadow-none h-full overflow-y-auto"
              >
                <EventAllocations
                  eventId={event.id}
                  tenantSlug={tenantSlug}
                  eventHasEnded={eventHasEnded}
                />
              </TabsContent>

              <TabsContent
                value="food"
                className="mt-0 bg-gray-50 mx-3 sm:mx-4 lg:mx-6 p-3 sm:p-4 lg:p-6 rounded-lg border-0 shadow-none h-full overflow-y-auto"
              >
                <EventFood
                  eventId={event.id}
                  tenantSlug={tenantSlug}
                  eventHasEnded={eventHasEnded}
                  eventDays={Math.floor(Math.abs(new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                />
              </TabsContent>

              <TabsContent
                value="feedback"
                className="mt-0 bg-gray-50 mx-3 sm:mx-4 lg:mx-6 p-3 sm:p-4 lg:p-6 rounded-lg border-0 shadow-none h-full overflow-y-auto"
              >
                <SessionFeedback eventId={event.id} tenantSlug={tenantSlug} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 pt-3 border-t bg-white px-3 sm:px-4 lg:px-6 pb-3 rounded-b-xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600">
                Status:
              </span>
              <Badge
                variant={
                  event.status === "Published"
                    ? "default"
                    : event.status === "Completed"
                    ? "secondary"
                    : event.status === "Cancelled"
                    ? "destructive"
                    : "outline"
                }
                className="flex items-center gap-1 text-xs px-2 py-1"
              >
                {event.status === "Published" && (
                  <CheckCircle className="h-3 w-3" />
                )}
                {event.status === "Ongoing" && (
                  <PlayCircle className="h-3 w-3" />
                )}
                {event.status === "Completed" && (
                  <CheckCircle className="h-3 w-3" />
                )}
                {event.status === "Cancelled" && (
                  <XCircle className="h-3 w-3" />
                )}
                {event.status === "Draft" && (
                  <PauseCircle className="h-3 w-3" />
                )}
                {event.status}
              </Badge>
            </div>

            {event.status === "Draft" && canManageEvents && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateEventStatus("Published");
                }}
                disabled={updatingStatus}
                className="text-xs px-3 py-1 h-7 bg-red-600 hover:bg-red-700 text-white"
              >
                {updatingStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Edit3 className="h-3 w-3 mr-1" />
                    Publish Event
                  </>
                )}
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={onClose}
            size="sm"
            className="px-4 py-2 bg-white border-gray-300 hover:bg-gray-50 w-full sm:w-auto text-xs"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
