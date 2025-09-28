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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import EventParticipants from "./EventParticipants";
import EventAttachments from "./EventAttachments";
import EventAllocations from "./EventAllocations";
import EventAgenda from "./EventAgenda";

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
  banner_image?: string;
  duration_days?: number;
  perdiem_rate?: number;
}

interface Participant {
  id: number;
  role: string;
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
}

export default function EventDetailsModal({
  event,
  isOpen,
  onClose,
  tenantSlug,
}: EventDetailsModalProps) {
  const { accessToken, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const [feedbackStats, setFeedbackStats] = useState<{
    total_responses: number;
    average_overall_rating: number;
    unread: number;
    urgent: number;
    average_content_rating?: number;
    average_organization_rating?: number;
    average_venue_rating?: number;
    recommendation_percentage?: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
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
        `http://localhost:8000/api/v1/events/${event.id}/participants/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
        // Set separate counts for participants and facilitators
        const actualParticipants = data.filter(
          (p: Participant) => p.role !== "facilitator"
        );
        const facilitators = data.filter((p: Participant) => p.role === "facilitator");
        setParticipantsCount(actualParticipants.length);
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
        `http://localhost:8000/api/v1/events/${event.id}/attachments/`,
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
        `http://localhost:8000/api/v1/events/${event.id}/agenda/`,
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
        `http://localhost:8000/api/v1/events/${event.id}/feedback/stats`,
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
        `http://localhost:8000/api/v1/events/${event.id}/feedback`,
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
        `http://localhost:8000/api/v1/events/${event.id}/status/suggestions`
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
          fetchAttachments()
        ]);
        setEditedEvent(event);
      };
      loadData();
    }
  }, [event, isOpen, fetchFeedbackStats, fetchFeedback, fetchStatusSuggestions, fetchParticipants, fetchAgenda, fetchAttachments]);

  const saveEventChanges = async () => {
    if (!event) return;

    setSaving(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/events/${event.id}`,
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
          `http://localhost:8000/api/v1/events/${event.id}/notify-update`,
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
        `http://localhost:8000/api/v1/events/${event.id}/status`,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] h-[90vh] sm:h-[85vh] max-w-[95vw] sm:max-w-[90vw] overflow-y-auto bg-white border shadow-xl p-0">
        <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-red-50 to-red-100">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">
                {event.title}
              </span>
            </div>
            <Badge
              className={`w-fit ${
                event.status === "Published"
                  ? "bg-green-100 text-green-800"
                  : event.status === "Draft"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {event.status}
            </Badge>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Event details and management interface for {event.title}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 bg-gradient-to-r from-red-50 to-red-100 p-1 sm:p-2 mx-4 sm:mx-6 mt-4 rounded-xl h-12 sm:h-14 border border-red-200 text-xs sm:text-sm">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="participants" className="text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Participants</span>
              <span className="sm:hidden">({participantsCount})</span>
              <span className="hidden sm:inline"> ({participantsCount})</span>
            </TabsTrigger>
            <TabsTrigger
              value="facilitators"
              className="text-xs sm:text-sm hidden sm:flex"
            >
              Facilitators ({facilitatorsCount})
            </TabsTrigger>
            <TabsTrigger value="attachments" className="text-xs sm:text-sm">
              <Paperclip className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Files</span>
              <span className="sm:hidden">({attachmentsCount})</span>
              <span className="hidden sm:inline"> ({attachmentsCount})</span>
            </TabsTrigger>
            <TabsTrigger
              value="allocations"
              className="text-xs sm:text-sm hidden sm:flex"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Allocations</span>
            </TabsTrigger>
            <TabsTrigger value="agenda" className="text-xs sm:text-sm">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger
              value="feedback"
              className="text-xs sm:text-sm hidden sm:flex"
            >
              <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="space-y-6 mt-4 bg-white mx-4 sm:mx-6 p-4 sm:p-6 rounded-lg border shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Event Overview
                </h3>
                <p className="text-sm text-gray-600">
                  Detailed information about this event
                </p>
              </div>
              {event.status === "Draft" && !editMode && (
                <Button
                  onClick={() => setEditMode(true)}
                  className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                  <h3 className="font-bold text-lg mb-4 text-red-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-red-200">
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="text-gray-900 font-semibold">
                        {event.event_type || "Not specified"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-red-200">
                      <span className="font-medium text-gray-700">
                        Start Date:
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {new Date(event.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-red-200">
                      <span className="font-medium text-gray-700">
                        End Date:
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {new Date(event.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-red-200">
                      <span className="font-medium text-gray-700">
                        Duration:
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {event.duration_days} days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <h3 className="font-bold text-lg mb-4 text-blue-800 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="font-medium text-gray-700">
                        Registered:
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {
                          participants.filter((p) => p.role !== "facilitator")
                            .length
                        }{" "}
                        visitors
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="font-medium text-gray-700">
                        Selected:
                      </span>
                      <span className="text-green-700 font-semibold">
                        {
                          participants.filter(
                            (p) =>
                              p.status === "selected" &&
                              p.role !== "facilitator"
                          ).length
                        }{" "}
                        visitors
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="font-medium text-gray-700">
                        Facilitators:
                      </span>
                      <span className="text-purple-700 font-semibold">
                        {
                          participants.filter((p) => p.role === "facilitator")
                            .length
                        }{" "}
                        facilitators
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="font-medium text-gray-700">
                        Waiting:
                      </span>
                      <span className="text-yellow-700 font-semibold">
                        {
                          participants.filter(
                            (p) =>
                              p.status === "waiting" && p.role !== "facilitator"
                          ).length
                        }{" "}
                        visitors
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">
                        Attended:
                      </span>
                      <span className="text-blue-700 font-semibold">
                        {
                          participants.filter(
                            (p) =>
                              p.status === "attended" &&
                              p.role !== "facilitator"
                          ).length
                        }{" "}
                        visitors
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
                          <span className="text-gray-700">{event.address}</span>
                        </div>
                      </div>
                    )}
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
                  <p className="text-gray-700 leading-relaxed">
                    {event.description}
                  </p>
                </div>
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
            />
          </TabsContent>

          <TabsContent
            value="facilitators"
            className="mt-4 bg-white mx-4 sm:mx-6 p-4 sm:p-6 rounded-lg border shadow-sm"
          >
            <EventParticipants
              eventId={event.id}
              tenantSlug={tenantSlug}
              roleFilter="facilitator"
              allowAdminAdd={true}
              onParticipantsChange={handleFacilitatorsChange}
            />
          </TabsContent>

          <TabsContent
            value="attachments"
            className="mt-4 bg-white mx-4 sm:mx-6 p-4 sm:p-6 rounded-lg border shadow-sm"
          >
            <EventAttachments
              eventId={event.id}
              tenantSlug={tenantSlug}
              onAttachmentsChange={setAttachmentsCount}
            />
          </TabsContent>

          <TabsContent
            value="agenda"
            className="mt-4 bg-white mx-4 sm:mx-6 p-4 sm:p-6 rounded-lg border shadow-sm"
          >
            <EventAgenda eventId={event.id} tenantSlug={tenantSlug} />
          </TabsContent>

          <TabsContent
            value="allocations"
            className="mt-4 bg-white mx-4 sm:mx-6 p-4 sm:p-6 rounded-lg border shadow-sm"
          >
            <EventAllocations eventId={event.id} tenantSlug={tenantSlug} />
          </TabsContent>

          <TabsContent
            value="feedback"
            className="mt-4 bg-white mx-4 sm:mx-6 p-4 sm:p-6 rounded-lg border shadow-sm"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  Event Feedback & Ratings
                </h3>
                {feedbackStats && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold">
                      {feedbackStats.average_overall_rating}/5
                    </span>
                    <span className="text-sm text-gray-600">
                      ({feedbackStats.total_responses} responses)
                    </span>
                  </div>
                )}
              </div>

              {feedbackStats ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Rating Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Overall Rating:</span>
                        <span className="font-medium">
                          {feedbackStats.average_overall_rating}/5
                        </span>
                      </div>
                      {feedbackStats.average_content_rating && (
                        <div className="flex justify-between">
                          <span>Content:</span>
                          <span className="font-medium">
                            {feedbackStats.average_content_rating}/5
                          </span>
                        </div>
                      )}
                      {feedbackStats.average_organization_rating && (
                        <div className="flex justify-between">
                          <span>Organization:</span>
                          <span className="font-medium">
                            {feedbackStats.average_organization_rating}/5
                          </span>
                        </div>
                      )}
                      {feedbackStats.average_venue_rating && (
                        <div className="flex justify-between">
                          <span>Venue:</span>
                          <span className="font-medium">
                            {feedbackStats.average_venue_rating}/5
                          </span>
                        </div>
                      )}
                      {feedbackStats.recommendation_percentage && (
                        <div className="flex justify-between">
                          <span>Would Recommend:</span>
                          <span className="font-medium">
                            {feedbackStats.recommendation_percentage}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Recent Feedback</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {feedback.slice(0, 5).map((fb, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">
                              {fb.participant_name}
                            </span>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm">
                                {fb.overall_rating}
                              </span>
                            </div>
                          </div>
                          {fb.feedback_text && (
                            <p className="text-sm text-gray-700">
                              {fb.feedback_text}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No feedback received yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 mt-6 border-t bg-gradient-to-r from-gray-50 to-red-50 px-4 sm:px-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
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
                className="flex items-center gap-1"
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

            {event.status === "Draft" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateEventStatus("Published");
                  }}
                  disabled={updatingStatus}
                  className="text-xs px-3 py-1 h-7 border-red-300 text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  {updatingStatus ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-3 w-3 mr-1" />
                      Publish Event
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 bg-white border-gray-300 hover:bg-gray-50 w-full sm:w-auto"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
