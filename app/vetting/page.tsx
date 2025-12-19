"use client";

import { useState, useEffect } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Users, Send, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

interface Participant {
  id: number;
  full_name: string;
  email: string;
  position: string;
  country: string;
  project: string;
  motivation_letter?: string;
}

interface ParticipantSelection {
  participant_id: number;
  selection_status: "approved" | "rejected" | "pending";
  selection_notes?: string;
}

interface Committee {
  id: number;
  committee_name: string;
  event_title: string;
  status: string;
  selection_start_date: string;
  selection_end_date: string;
  participants: Array<{
    participant: Participant;
    selection: ParticipantSelection | null;
  }>;
}

export default function VettingDashboard() {
  const { apiClient } = useAuthenticatedApi();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<number, ParticipantSelection>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCommittees();
  }, []);

  const loadCommittees = async () => {
    try {
      const response = await apiClient.request<Committee[]>("/vetting-committee/my-committees");
      setCommittees(response);
      
      // Initialize selections
      const initialSelections: Record<number, ParticipantSelection> = {};
      response.forEach(committee => {
        committee.participants.forEach(({ participant, selection }) => {
          if (selection) {
            initialSelections[participant.id] = selection;
          } else {
            initialSelections[participant.id] = {
              participant_id: participant.id,
              selection_status: "pending",
              selection_notes: ""
            };
          }
        });
      });
      setSelections(initialSelections);
    } catch (error) {
      toast.error("Failed to load committees");
    } finally {
      setLoading(false);
    }
  };

  const updateSelection = (participantId: number, status: "approved" | "rejected", notes?: string) => {
    setSelections(prev => ({
      ...prev,
      [participantId]: {
        participant_id: participantId,
        selection_status: status,
        selection_notes: notes || ""
      }
    }));
  };

  const isDeadlineApproaching = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    return deadlineDate <= twoDaysFromNow && deadlineDate > now;
  };

  const isDeadlinePassed = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return now > deadlineDate;
  };

  const submitSelections = async (committeeId: number) => {
    const committee = committees.find(c => c.id === committeeId);
    if (!committee) return;

    // Check if deadline passed
    if (isDeadlinePassed(committee.selection_end_date)) {
      toast.error("Cannot submit: Deadline has passed");
      return;
    }

    // Check if already submitted
    if (committee.status === "submitted_for_approval") {
      toast.error("Selections already submitted");
      return;
    }

    const committeeSelections = committee.participants
      .map(({ participant }) => selections[participant.id])
      .filter(Boolean) || [];

    setSubmitting(true);
    try {
      await apiClient.request(`/vetting-committee/${committeeId}/submit`, {
        method: "POST",
        body: JSON.stringify({
          selections: committeeSelections
        })
      });

      toast.success("Selections submitted successfully");
      loadCommittees();
    } catch (error) {
      toast.error("Failed to submit selections");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Loading your committees...</p>
        </div>
      </div>
    );
  }

  if (committees.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Committees Assigned</h2>
            <p className="text-gray-600">You are not currently assigned to any vetting committees.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Vetting Committee Dashboard</h1>
          <p className="text-gray-600 mt-1">Review and select participants for your assigned events</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {committees.map((committee) => (
          <Card key={committee.id} className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{committee.committee_name}</CardTitle>
                  <p className="text-gray-600 mt-1">{committee.event_title}</p>
                </div>
                <Badge variant={committee.status === "submitted" ? "default" : "secondary"}>
                  {committee.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Deadline warnings */}
              {committee.selection_end_date && (
                <div className="mb-4 space-y-2">
                  {isDeadlineApproaching(committee.selection_end_date) && !isDeadlinePassed(committee.selection_end_date) && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="text-yellow-800 font-medium">
                          Deadline approaching: {new Date(committee.selection_end_date).toLocaleDateString()} at {new Date(committee.selection_end_date).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {isDeadlinePassed(committee.selection_end_date) && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <X className="w-5 h-5 text-red-600" />
                        <span className="text-red-800 font-medium">
                          Deadline passed. You no longer have access to edit selections.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-6">
                {committee.participants.map(({ participant }) => (
                  <div key={participant.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{participant.full_name}</h3>
                        <p className="text-gray-600">{participant.email}</p>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Position:</span> {participant.position}</p>
                          <p><span className="font-medium">Country:</span> {participant.country}</p>
                          {participant.project && (
                            <p><span className="font-medium">Project:</span> {participant.project}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant={selections[participant.id]?.selection_status === "approved" ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateSelection(participant.id, "approved")}
                          disabled={committee.status === "submitted"}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant={selections[participant.id]?.selection_status === "rejected" ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => updateSelection(participant.id, "rejected")}
                          disabled={committee.status === "submitted"}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>

                    {participant.motivation_letter && (
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <h4 className="font-medium text-sm mb-2">Motivation Letter:</h4>
                        <p className="text-sm text-gray-700">{participant.motivation_letter}</p>
                      </div>
                    )}

                    <div className="mt-3">
                      <textarea
                        placeholder="Add selection notes (optional)..."
                        className="w-full p-2 border rounded text-sm"
                        rows={2}
                        value={selections[participant.id]?.selection_notes || ""}
                        onChange={(e) => updateSelection(
                          participant.id,
                          selections[participant.id]?.selection_status || "pending",
                          e.target.value
                        )}
                        disabled={committee.status === "submitted"}
                      />
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm">
                        {selections[participant.id]?.selection_status === "approved" && (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-700">Approved</span>
                          </>
                        )}
                        {selections[participant.id]?.selection_status === "rejected" && (
                          <>
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-700">Rejected</span>
                          </>
                        )}
                        {selections[participant.id]?.selection_status === "pending" && (
                          <>
                            <Clock className="w-4 h-4 text-yellow-500" />
                            <span className="text-yellow-700">Pending Review</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {committee.status !== "submitted" && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => submitSelections(committee.id)}
                      disabled={submitting}
                      className="w-full"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {submitting ? "Submitting..." : "Submit Selections for Approval"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}