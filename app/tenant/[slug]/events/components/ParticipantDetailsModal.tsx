"use client";

import { useState, useEffect } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle, X } from "lucide-react";

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
  passport_document?: string;
  ticket_document?: string;
  decline_reason?: string;
  declined_at?: string;
  proof_of_accommodation_url?: string;
  proof_generated_at?: string;
  vetting_comments?: string;
}

interface VettingMode {
  isVettingCommittee: boolean;
  isVettingApprover: boolean;
  canEdit: boolean;
  submissionStatus?: 'open' | 'pending_approval' | 'approved';
}

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
  effectiveVettingMode?: VettingMode;
  feedbackMessage?: { type: 'success' | 'error', message: string } | null;
  setFeedbackMessage?: (message: { type: 'success' | 'error', message: string } | null) => void;
}

export function ParticipantDetailsModal({
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
  effectiveVettingMode,
  feedbackMessage,
  setFeedbackMessage,
}: ParticipantDetailsModalProps) {
  const { apiClient } = useAuthenticatedApi();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for services
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [participant.id]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl modal-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
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
                onClick={() => setFeedbackMessage?.(null)}
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
                  <span className="font-medium text-gray-700">Personal Email:</span>
                  <br />
                  <span className="text-gray-900">{participant.personal_email || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">MSF Email:</span>
                  <br />
                  <span className="text-gray-900">{participant.msf_email || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <br />
                  <span className="text-gray-900">{participant.phone_number || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Gender Identity:</span>
                  <br />
                  <span className="text-gray-900">{participant.gender_identity || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Sex:</span>
                  <br />
                  <span className="text-gray-900">{participant.sex || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Pronouns:</span>
                  <br />
                  <span className="text-gray-900">{participant.pronouns || "-"}</span>
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
                  <span className="text-gray-900">{participant.oc || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Position:</span>
                  <br />
                  <span className="text-gray-900">{participant.position || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Country:</span>
                  <br />
                  <span className="text-gray-900">{participant.country || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Project:</span>
                  <br />
                  <span className="text-gray-900">{participant.project_of_work || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Contract Status:</span>
                  <br />
                  <span className="text-gray-900">{participant.contract_status || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Contract Type:</span>
                  <br />
                  <span className="text-gray-900">{participant.contract_type || "-"}</span>
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
                  <span className="font-medium text-gray-700">HRCO Email:</span>
                  <br />
                  <span className="text-gray-900">{participant.hrco_email || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Career Manager:</span>
                  <br />
                  <span className="text-gray-900">{participant.career_manager_email || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Line Manager:</span>
                  <br />
                  <span className="text-gray-900">{participant.line_manager_email || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Registered:</span>
                  <br />
                  <span className="text-gray-900">
                    {new Date(participant.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* LOI & Documents */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-purple-200 pb-2">
                Documents
              </h4>
              <div className="space-y-3 text-sm">
                {/* LOI Document */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">LOI Document</div>
                      <div className="text-xs text-gray-500">Generated from template</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                        const loiUrl = `${apiUrl}/api/v1/loi/events/${eventId}/participant/${participant.id}/generate`;
                        window.open(loiUrl, '_blank');
                      }}
                      className="px-3 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/public/loi/${participant.id}-${eventId}`)}`;
                        const qrWindow = window.open('', '_blank', 'width=300,height=350');
                        qrWindow?.document.write(`
                          <html>
                            <head><title>LOI QR Code</title></head>
                            <body style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
                              <h3>LOI QR Code</h3>
                              <img src="${qrUrl}" alt="QR Code" style="border: 1px solid #ccc; padding: 10px;" />
                              <p style="font-size: 12px; color: #666; margin-top: 10px;">Scan to view LOI document</p>
                            </body>
                          </html>
                        `);
                      }}
                      className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition-colors"
                    >
                      QR
                    </button>
                  </div>
                </div>
                
                {/* Certificate Document - Only show for confirmed participants */}
                {participant.status === 'confirmed' && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Certificate</div>
                        <div className="text-xs text-gray-500">Event completion certificate</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                          const certUrl = `${apiUrl}/api/v1/certificates/events/${eventId}/participant/${participant.id}/generate`;
                          window.open(certUrl, '_blank');
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                          const certUrl = `${apiUrl}/api/v1/certificates/events/${eventId}/participant/${participant.id}/download`;
                          const link = document.createElement('a');
                          link.href = certUrl;
                          link.download = `certificate-${participant.full_name.replace(/\s+/g, '-')}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Badge Document */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Event Badge</div>
                      <div className="text-xs text-gray-500">{participant.badge_name || participant.badgeName || 'Event Badge'}</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                        const badgeUrl = `${apiUrl}/api/v1/events/${eventId}/participant/${participant.id}/badge/generate`;
                        window.open(badgeUrl, '_blank');
                      }}
                      className="px-3 py-1 bg-orange-600 text-white text-xs rounded-md hover:bg-orange-700 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                        const badgeUrl = `${apiUrl}/api/v1/events/${eventId}/participant/${participant.id}/badge/generate`;
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(badgeUrl)}`;
                        const qrWindow = window.open('', '_blank', 'width=300,height=350');
                        qrWindow?.document.write(`
                          <html>
                            <head><title>Badge QR Code</title></head>
                            <body style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
                              <h3>Badge QR Code</h3>
                              <img src="${qrUrl}" alt="QR Code" style="border: 1px solid #ccc; padding: 10px;" />
                              <p style="font-size: 12px; color: #666; margin-top: 10px;">Scan to view badge</p>
                            </body>
                          </html>
                        `);
                      }}
                      className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition-colors"
                    >
                      QR
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                  <strong>Note:</strong> Documents are generated using active templates. {participant.status === 'confirmed' ? 'Certificate available for confirmed participants.' : 'Certificate will be available once participant is confirmed.'}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-yellow-50 p-6 rounded-lg col-span-1 lg:col-span-4 mt-6">
            <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-yellow-200 pb-2">
              Registration Details
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Certificate Name:</span>
                  <br />
                  <span className="text-gray-900">
                    {participant.certificate_name || participant.certificateName || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Badge Name:</span>
                  <br />
                  <span className="text-gray-900">
                    {participant.badge_name || participant.badgeName || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Travelling Internationally:</span>
                  <br />
                  <span className="text-gray-900">
                    {participant.travelling_internationally || participant.travellingInternationally || "-"}
                  </span>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                {participant.travelling_from_country && (
                  <div>
                    <span className="font-medium text-gray-700">Travelling From Country:</span>
                    <br />
                    <span className="text-gray-900">{participant.travelling_from_country}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Accommodation Type:</span>
                  <br />
                  <span className="text-gray-900">
                    {participant.accommodation_type || participant.accommodationType || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Daily Meals:</span>
                  <br />
                  <span className="text-gray-900">
                    {participant.daily_meals || participant.dailyMeals || "-"}
                  </span>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Motivation Letter:</span>
                  <div className="bg-white p-3 rounded-lg border max-h-32 overflow-y-auto mt-2">
                    <div
                      className="text-gray-900 text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: participant.motivation_letter || participant.motivationLetter || "No motivation letter provided"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vetting Comments */}
          {participant.vetting_comments && (
            <div className="bg-orange-50 p-6 rounded-lg col-span-1 lg:col-span-4 mt-6">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-orange-200 pb-2">
                Vetting Comments
              </h4>
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
  );
}