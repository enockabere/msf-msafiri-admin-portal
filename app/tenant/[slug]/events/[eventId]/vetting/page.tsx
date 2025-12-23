"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Clock, AlertTriangle, Send } from "lucide-react";
import EventParticipants from "../../EventParticipants";
import EmailTemplateManager from "@/components/vetting/EmailTemplateManager";

interface Event {
  id: number;
  title: string;
  vetting_start_date?: string;
  vetting_end_date?: string;
  status: string;
}



interface Committee {
  id: number;
  event_id: number;
  status: string;
  approval_status: string;
}

export default function VettingPage() {
  const params = useParams();
  const { user } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [event, setEvent] = useState<Event | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  const [committee, setCommittee] = useState<Committee | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [totalParticipantCount, setTotalParticipantCount] = useState<number | null>(null);

  const eventId = parseInt(params.eventId as string);
  const tenantSlug = params.slug as string;

  const isVettingCommittee = userRoles.some(role => 
    ["VETTING_COMMITTEE", "vetting_committee"].includes(role)
  ) || user?.role === "vetting_committee" || user?.role === "VETTING_COMMITTEE";
  
  const isVettingApprover = userRoles.some(role => 
    ["VETTING_APPROVER", "vetting_approver"].includes(role)
  ) || user?.role === "vetting_approver" || user?.role === "VETTING_APPROVER";
  
  // Debug canEdit logic
  const approverCanEdit = canApproverEdit();
  const committeeCanEdit = canCommitteeEdit();
  const finalCanEdit = approverCanEdit || committeeCanEdit;
  
  console.log('=== VETTING DEBUG ===');
  console.log('user:', user);
  console.log('userRoles:', userRoles);
  console.log('isVettingCommittee:', isVettingCommittee);
  console.log('isVettingApprover:', isVettingApprover);
  console.log('committee:', committee);
  console.log('committee?.status:', committee?.status);
  console.log('canCommitteeEdit():', committeeCanEdit);
  console.log('canApproverEdit():', approverCanEdit);
  console.log('finalCanEdit:', finalCanEdit);
  
  console.log('Role checks:', { isVettingCommittee, isVettingApprover, vettingPeriod: isVettingPeriod() });
  


  const canVet = isVettingCommittee || isVettingApprover;

  const fetchEventAndRoles = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const roles = await apiClient.request<{role: string}[]>(`/user-roles/user/${user.id}`).catch(() => []);
      const roleNames = roles.map(r => r.role);
      if (user.role) roleNames.push(user.role);
      setUserRoles([...new Set(roleNames)]);

      const eventData = await apiClient.request<Event>(`/events/${eventId}`);
      setEvent(eventData);

      // Fetch committee data
      try {
        const committeeData = await apiClient.request<Committee>(`/vetting-committee/event/${eventId}`);
        setCommittee(committeeData);
      } catch (error) {
        console.log('No committee found for event');
        setCommittee(null);
      }



    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load vetting data");
    } finally {
      setLoading(false);
    }
  }, [user?.id, apiClient, eventId]);

  useEffect(() => {
    if (user?.id) {
      fetchEventAndRoles();
    }
  }, [user?.id, fetchEventAndRoles]);
  


  const isVettingPeriod = () => {
    if (!event?.vetting_start_date || !event?.vetting_end_date) return false;
    
    const now = new Date();
    const start = new Date(event.vetting_start_date);
    const end = new Date(event.vetting_end_date);
    
    return now >= start && now <= end;
  };

  const canSubmitForApproval = () => {
    // Need to track total participants separately from registered count
    // registeredCount = participants with "registered" status (should be 0 to submit)
    // But we also need to have some participants to submit
    return false; // Will be handled by the UI condition
  };

  const canApproveVetting = () => {
    return isVettingApprover &&
           committee?.status === 'pending_approval';
  };

  const canApproverEdit = () => {
    return isVettingApprover && committee?.status === 'pending_approval';
  };

  const canCommitteeEdit = () => {
    return isVettingCommittee && committee?.status === 'open';
  };

  const isApproved = () => {
    return committee?.status === 'approved';
  };

  const handleSubmitForApproval = async () => {
    if (!canSubmitForApproval() || !committee) return;

    setSubmitting(true);
    try {
      const response = await apiClient.request(`/vetting-committee/${committee.id}/submit-for-approval`, {
        method: 'POST'
      });
      
      // Update committee state immediately with response data
      setCommittee(response);
      toast.success("Submitted for approval successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit for approval");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveVetting = async () => {
    if (!canApproveVetting() || !committee) return;

    setSubmitting(true);
    try {
      const response = await apiClient.request(`/vetting-committee/${committee.id}/approve-final`, {
        method: 'POST'
      });
      
      // Update committee state immediately with response data
      setCommittee(response);
      toast.success("Vetting approved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to approve vetting");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelApproval = async () => {
    if (!committee || committee.status !== 'approved') return;

    setSubmitting(true);
    try {
      const response = await apiClient.request(`/vetting-committee/${committee.id}/cancel-approval`, {
        method: 'POST'
      });
      
      // Update committee state immediately with response data
      setCommittee(response);
      toast.success("Approval cancelled successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel approval");
    } finally {
      setSubmitting(false);
    }
  };

  const canCancelApproval = () => {
    return isVettingApprover && committee?.status === 'approved';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canVet) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access the vetting system.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event?.title}</h1>
              <p className="text-gray-600 mt-1">Vetting System</p>
            </div>
            
            <div className="flex items-center gap-4">
              {event?.vetting_start_date && event?.vetting_end_date && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Vetting Period</p>
                  <p className="text-sm font-medium">
                    {new Date(event.vetting_start_date).toLocaleDateString()} - {new Date(event.vetting_end_date).toLocaleDateString()}
                  </p>
                  <Badge className={isVettingPeriod() ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {isVettingPeriod() ? "Active" : "Inactive"}
                  </Badge>
                </div>
              )}

              {committee && totalParticipantCount !== null && totalParticipantCount > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Vetting Status</p>
                  <Badge className={
                    committee.status === 'approved' ? "bg-green-100 text-green-800" :
                    committee.status === 'pending_approval' ? "bg-yellow-100 text-yellow-800" :
                    "bg-blue-100 text-blue-800"
                  }>
                    {committee.status === 'open' ? 'OPEN' :
                     committee.status === 'pending_approval' ? 'PENDING APPROVAL' :
                     committee.status === 'approved' ? 'APPROVED' : committee.status.toUpperCase()}
                  </Badge>
                  {committee.submitted_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {new Date(committee.submitted_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {totalParticipantCount !== null && totalParticipantCount > 0 && (
            <div className="flex gap-3 mt-6">
              {canSubmitForApproval() && (
                <Button
                  onClick={handleSubmitForApproval}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Approval
                    </>
                  )}
                </Button>
              )}

              {canApproveVetting() && (
                <Button
                  onClick={handleApproveVetting}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Vetting
                    </>
                  )}
                </Button>
              )}

              {canCancelApproval() && (
                <Button
                  onClick={handleCancelApproval}
                  disabled={submitting}
                  variant="outline"
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Cancel Approval
                    </>
                  )}
                </Button>
              )}

              {isVettingApprover && isApproved() && !canCancelApproval() && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 px-4 py-2 rounded-md border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Approved on {committee?.approved_at ? new Date(committee.approved_at).toLocaleDateString() : 'N/A'} (View Only)</span>
                </div>
              )}
            </div>
          )}

          {totalParticipantCount !== null && totalParticipantCount > 0 && committee?.status === 'pending_approval' && isVettingCommittee && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800">Committee selections have been submitted for approval. You cannot make changes until the approver reviews them.</p>
              </div>
            </div>
          )}
          
          {totalParticipantCount !== null && totalParticipantCount > 0 && committee?.status === 'approved' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800">Committee selections have been approved. This is now read-only.</p>
              </div>
            </div>
          )}

          {registeredCount > 0 && isVettingCommittee && committee?.status === 'open' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">
                  Cannot submit for approval: {registeredCount} participants still have "Registered" status. 
                  All participants must be reviewed before submission.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Email Template Manager - only for approver when pending approval and there are participants */}
        {isVettingApprover && committee && event && committee.status === 'pending_approval' && totalParticipantCount !== null && totalParticipantCount > 0 && (
          <EmailTemplateManager
            committeeId={committee.id}
            eventTitle={event.title}
            isApprover={isVettingApprover}
          />
        )}

        {/* Show message when no participants exist */}
        {totalParticipantCount === 0 && (
          <div className="bg-white rounded-lg border p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No participants yet</h3>
            <p className="text-gray-600 mb-4">Participants need to register for this event before vetting can begin.</p>
            <p className="text-sm text-gray-500">Participants can only register themselves for published events</p>
          </div>
        )}

        <div className="bg-white rounded-lg border">
          {(() => {
            console.log('PASSING TO EventParticipants:', {
              committee_status: committee?.status,
              finalCanEdit,
              isVettingCommittee,
              isVettingApprover
            });
            return null;
          })()}
          <EventParticipants
            eventId={eventId}
            allowAdminAdd={false}
            onParticipantsChange={() => {}}
            eventHasEnded={false}
            vettingMode={{
              isVettingCommittee,
              isVettingApprover,
              canEdit: finalCanEdit,
              submissionStatus: committee?.status,
              onRegisteredCountChange: setRegisteredCount,
        onTotalCountChange: setTotalParticipantCount,
              onStatusChange: (status: string) => {
                setCommittee(prev => prev ? { ...prev, status } : null);
              }
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}