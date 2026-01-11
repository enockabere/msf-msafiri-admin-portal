"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail } from "lucide-react";
import { EmailTemplateEditor } from "@/components/ui/email-template-editor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface VettingMode {
  isVettingCommittee: boolean;
  isVettingApprover: boolean;
  canEdit: boolean;
  submissionStatus?: 'open' | 'pending_approval' | 'approved';
  onStatusChange?: (status: string) => void;
}

interface VettingControlsProps {
  eventId: number;
  vettingMode: VettingMode;
  effectiveVettingMode: VettingMode;
  filteredParticipants: any[];
  eventHasEnded: boolean;
  committeeStatus: string | null;
  vettingApproved: boolean;
  submittingVetting: boolean;
  emailSubject: string;
  emailBody: string;
  showEmailTemplate: boolean;
  savingTemplate: boolean;
  apiClient: any;
  setCommitteeStatus: (status: string) => void;
  setVettingApproved: (approved: boolean) => void;
  setSubmittingVetting: (submitting: boolean) => void;
  setEmailSubject: (subject: string) => void;
  setEmailBody: (body: string) => void;
  setShowEmailTemplate: (show: boolean) => void;
  setSavingTemplate: (saving: boolean) => void;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

export function VettingControls({
  eventId,
  vettingMode,
  effectiveVettingMode,
  filteredParticipants,
  eventHasEnded,
  committeeStatus,
  vettingApproved,
  submittingVetting,
  emailSubject,
  emailBody,
  showEmailTemplate,
  savingTemplate,
  apiClient,
  setCommitteeStatus,
  setVettingApproved,
  setSubmittingVetting,
  setEmailSubject,
  setEmailBody,
  setShowEmailTemplate,
  setSavingTemplate,
  showFeedback,
}: VettingControlsProps) {
  const getCommitteeStatusDisplay = (status: string) => {
    switch (status) {
      case 'open': return { text: 'Open', color: 'bg-blue-100 text-blue-800' };
      case 'pending_approval': return { text: 'Pending Approval', color: 'bg-orange-100 text-orange-800' };
      case 'approved': return { text: 'Approved', color: 'bg-green-100 text-green-800' };
      default: return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const saveEmailTemplate = async () => {
    setSavingTemplate(true);
    try {
      const pathParts = window.location.pathname.split('/');
      console.log('🛣️ Save Template - Path parts:', pathParts);
      
      // URL structure: /portal/tenant/[slug]/events/[eventId]/...
      // pathParts: ['', 'portal', 'tenant', 'slug', 'events', 'eventId', ...]
      const tenantSlug = pathParts[3]; // Changed from pathParts[2] to pathParts[3]
      
      console.log('🏢 Save Template - Tenant slug:', tenantSlug);
      
      if (!tenantSlug || tenantSlug === 'tenant' || tenantSlug === '') {
        console.log('❌ Save Template - Invalid tenant slug');
        toast.error('Invalid tenant context.');
        return;
      }
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/email-templates/tenant/${tenantSlug}/vetting-notification`;
      console.log('📡 Save Template - API URL:', apiUrl);
      console.log('📝 Save Template - Payload:', { subject: emailSubject, body: emailBody });
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: emailSubject,
          body: emailBody
        })
      });
      
      console.log('📥 Save Template - Response status:', response.status);
      
      if (response.ok) {
        console.log('✅ Save Template - Success');
        toast.success('Email template saved successfully!');
      } else {
        const errorText = await response.text();
        console.log('❌ Save Template - Error response:', errorText);
        toast.error('Failed to save email template.');
      }
    } catch (error) {
      console.error('❌ Save Template - Exception:', error);
      toast.error('Failed to save email template.');
    } finally {
      setSavingTemplate(false);
    }
  };

  if (!vettingMode || filteredParticipants.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Vetting Committee Submit Button */}
      {vettingMode.isVettingCommittee && (
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
            {effectiveVettingMode?.submissionStatus === 'open' ? (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                disabled={submittingVetting}
                onClick={async () => {
                  setSubmittingVetting(true);
                  try {
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
                      setCommitteeStatus('pending_approval');
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
            ) : (
              <div className="text-xs text-gray-500">
                Cannot submit - Status: {effectiveVettingMode?.submissionStatus || 'undefined'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vetting Approver Email Template Section */}
      {effectiveVettingMode.isVettingApprover && effectiveVettingMode.submissionStatus === 'pending_approval' && (
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
                    eventTitle={event?.title || ''}
                    placeholder="Write your email content here..."
                    height={300}
                    registrationUrl=""
                    key={emailBody} // Force re-render when emailBody changes
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
                Available variables: {'{{PARTICIPANT_NAME}}'}, {'{{PARTICIPANT_EMAIL}}'}, {'{{EVENT_TITLE}}'}, {'{{EVENT_LOCATION}}'}, {'{{EVENT_DATE_RANGE}}'}, {'{{REGISTRATION_LINK}}'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status Displays */}
      {vettingMode.isVettingCommittee && effectiveVettingMode?.submissionStatus === 'pending_approval' && (
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
                  const committeeResponse = await apiClient.request(`/vetting-committee/event/${eventId}`);
                  if (!committeeResponse?.id) {
                    throw new Error('Committee not found');
                  }
                  
                  await apiClient.request(`/vetting-committee/${committeeResponse.id}/cancel-submission`, {
                    method: 'POST'
                  });
                  
                  setCommitteeStatus('open');
                  
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

      {/* Vetting Approved Status */}
      {(effectiveVettingMode.submissionStatus === 'approved' || vettingApproved) && (
        <div className="mt-6 p-4 border-2 rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="text-sm font-semibold text-green-900">
                  Vetting Approved
                </h4>
                <p className="text-xs text-green-700">
                  {vettingMode.isVettingCommittee 
                    ? "Vetting has been approved and participant notifications have been sent."
                    : "Participant notifications have been sent successfully."
                  }
                </p>
              </div>
            </div>
            {effectiveVettingMode.isVettingApprover && !eventHasEnded && (
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
                      setCommitteeStatus('pending_approval');
                      if (vettingMode?.onStatusChange) {
                        vettingMode.onStatusChange('pending_approval');
                      }
                      setVettingApproved(false);
                      showFeedback('success', 'Vetting approval cancelled. You can now approve again.');
                    } else {
                      const errorData = await response.json().catch(() => ({}));
                      showFeedback('error', errorData.detail || 'Failed to cancel approval.');
                    }
                  } catch (error) {
                    showFeedback('error', 'Network error. Please try again.');
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
      {effectiveVettingMode.isVettingApprover && effectiveVettingMode.submissionStatus === 'pending_approval' && !vettingApproved && (
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
                    setCommitteeStatus('approved');
                    if (vettingMode?.onStatusChange) {
                      vettingMode.onStatusChange('approved');
                    }
                    setVettingApproved(true);
                    showFeedback('success', `Vetting approved! Notification emails sent to ${data.participants_notified || 0} participants.`);
                  } else {
                    const errorData = await response.json().catch(() => ({}));
                    showFeedback('error', errorData.detail || 'Failed to approve vetting. Please try again.');
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
    </div>
  );
}