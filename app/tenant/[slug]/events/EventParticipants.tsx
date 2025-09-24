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
import { Mail, Plus, Send } from "lucide-react";

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
}

interface EventParticipantsProps {
  eventId: number;
  tenantSlug: string;
  roleFilter?: string;
  allowAdminAdd?: boolean;
  onParticipantsChange?: (count: number) => void;
}

export default function EventParticipants({
  eventId,
  roleFilter,
  allowAdminAdd = false,
  onParticipantsChange,
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

  const fetchParticipants = useCallback(async () => {
    try {
      setFetchLoading(true);
      const url = new URL(
        `http://localhost:8000/api/v1/event-registration/event/${eventId}/registrations`
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
        // Only count non-facilitators for the main participants count
        const countForCallback = roleFilter
          ? filteredData.length
          : data.filter((p: Participant) => p.role !== "facilitator").length;
        onParticipantsChange?.(countForCallback);
      }
    } catch (error) {
      console.error("Failed to fetch participants:", error);
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
        `http://localhost:8000/api/v1/event-registration/register`,
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
        await fetchParticipants();
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
        `http://localhost:8000/api/v1/event-registration/participant/${participantId}/status`,
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
        await fetchParticipants(); // Refresh the list
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
        `http://localhost:8000/api/v1/event-registration/participant/${participantId}/resend-invitation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        await fetchParticipants(); // Refresh the list
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
        return "bg-purple-100 text-purple-800 border-purple-200"; // registered
    }
  };

  const filteredParticipants = participants;

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
              : "total"}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            </SelectContent>
          </Select>
          {allowAdminAdd && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
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

      <div className="space-y-2 max-h-[60vh] overflow-y-auto border rounded-lg bg-gray-50 p-2">
        {filteredParticipants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                {participant.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 truncate">
                    {participant.full_name}
                  </span>
                  <Badge
                    className={`text-xs px-2 py-0.5 ${getStatusColor(
                      participant.status
                    )} flex-shrink-0`}
                  >
                    {participant.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Mail className="h-3 w-3 text-red-500 flex-shrink-0" />
                  <span className="truncate">{participant.email}</span>
                </div>
                {participant.status === "selected" && (
                  <div className="flex items-center gap-2 text-xs mt-1">
                    {participant.email && participant.email.trim() ? (
                      participant.invitation_sent ? (
                        <span className="text-green-600">
                          ✓ Invitation sent
                        </span>
                      ) : (
                        <span className="text-orange-600">
                          ⚠ Invitation pending
                        </span>
                      )
                    ) : (
                      <span className="text-red-600">✗ No email address</span>
                    )}
                    {participant.invitation_accepted && (
                      <span className="text-blue-600">• Accepted</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Select
                value={participant.status}
                onValueChange={(value) =>
                  handleStatusChange(participant.id, value)
                }
              >
                <SelectTrigger className="w-28 h-7 text-xs bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                  <SelectItem
                    value="registered"
                    className="hover:bg-red-50 focus:bg-red-50 text-xs"
                  >
                    Registered
                  </SelectItem>
                  <SelectItem
                    value="selected"
                    className="hover:bg-red-50 focus:bg-red-50 text-xs"
                  >
                    Selected
                  </SelectItem>
                  <SelectItem
                    value="not_selected"
                    className="hover:bg-red-50 focus:bg-red-50 text-xs"
                  >
                    Not Selected
                  </SelectItem>
                  <SelectItem
                    value="waiting"
                    className="hover:bg-red-50 focus:bg-red-50 text-xs"
                  >
                    Waiting
                  </SelectItem>
                  <SelectItem
                    value="canceled"
                    className="hover:bg-red-50 focus:bg-red-50 text-xs"
                  >
                    Canceled
                  </SelectItem>
                  <SelectItem
                    value="attended"
                    className="hover:bg-red-50 focus:bg-red-50 text-xs"
                  >
                    Attended
                  </SelectItem>
                </SelectContent>
              </Select>
              {participant.status === "selected" &&
                participant.email &&
                participant.email.trim() && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResendInvitation(participant.id)}
                    disabled={resendingId === participant.id}
                    className="h-7 px-2 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    {resendingId === participant.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-700 mr-1"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-1" />
                        Resend
                      </>
                    )}
                  </Button>
                )}
            </div>
          </div>
        ))}

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
    </div>
  );
}
