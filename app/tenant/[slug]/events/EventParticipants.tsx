"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { toast } from "sonner";
import ParticipantAnalytics from "@/components/events/ParticipantAnalytics";
import { FeedbackMessage } from "./components/FeedbackMessage";
import { ParticipantControls } from "./components/ParticipantControls";
import { ParticipantDetailsModal } from "./components/ParticipantDetailsModal";
import { VettingControls } from "./components/VettingControls";
import { ParticipantTable } from "./components/ParticipantTable";
import { AddParticipantForm } from "./components/AddParticipantForm";
import { BulkActions } from "./components/BulkActions";
import { ColumnSelector } from "./components/ColumnSelector";

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
  country_of_work?: string;
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
  [key: string]: any;
}

interface VettingMode {
  isVettingCommittee: boolean;
  isVettingApprover: boolean;
  canEdit: boolean;
  submissionStatus?: 'open' | 'pending_approval' | 'approved';
  onRegisteredCountChange?: (count: number) => void;
  onTotalCountChange?: (count: number) => void;
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
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);
  const [viewingParticipantIndex, setViewingParticipantIndex] = useState(0);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [availableColumns, setAvailableColumns] = useState<Record<string, string>>({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [vettingApproved, setVettingApproved] = useState(false);
  const [committeeStatus, setCommitteeStatus] = useState<string | null>(null);
  const [participantComments, setParticipantComments] = useState<Record<number, string>>({});
  const [submittingVetting, setSubmittingVetting] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Event Selection Results - {{EVENT_TITLE}}');
  const [emailBody, setEmailBody] = useState('');
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const normalizeStatus = (status: string | undefined) => {
    // No normalization needed - status is already in correct format
    return status;
  };
  
  const actualStatus = committeeStatus || vettingMode?.submissionStatus;
  
  const effectiveVettingMode = vettingMode ? {
    ...vettingMode,
    canEdit: vettingMode.isVettingCommittee 
      ? actualStatus === 'open'
      : vettingMode.isVettingApprover 
      ? actualStatus === 'pending_approval'
      : vettingMode.canEdit,
    submissionStatus: actualStatus as 'open' | 'pending_approval' | 'approved'
  } : undefined;

  // Fetch email template when vetting mode changes
  useEffect(() => {
    const fetchEmailTemplate = async () => {
      console.log('🔍 fetchEmailTemplate called with:', {
        isVettingApprover: effectiveVettingMode?.isVettingApprover,
        currentEmailBody: emailBody,
        emailBodyLength: emailBody?.length || 0
      });
      
      if (!effectiveVettingMode?.isVettingApprover) {
        console.log('❌ Not vetting approver, setting default template');
        // Set default template even if not vetting approver for display purposes
        if (!emailBody || emailBody === '') {
          console.log('✅ Setting default template because emailBody is empty');
          setEmailBody(`<p><strong>Event Selection Results - {{EVENT_TITLE}}</strong></p>
<p>Dear {{PARTICIPANT_NAME}},</p>
<p>We have completed the selection process for {{EVENT_TITLE}}.</p>

{{#if_selected}}
<p>🎉 <strong>Congratulations! You have been selected to participate.</strong></p>
<p><strong>Event Details:</strong><br>
• Event: {{EVENT_TITLE}}<br>
• Location: {{EVENT_LOCATION}}<br>
• Date: {{EVENT_DATE_RANGE}}</p>
<p><strong>Next Steps:</strong><br>
1. Download the Msafiri mobile app<br>
2. Login using your work email<br>
3. Accept the invitation from the app notifications<br>
4. Submit required documents through the mobile app</p>
<p><strong>Important:</strong> Please use the Msafiri mobile application to accept your invitation and access all event details.</p>
<p>We look forward to your participation!</p>
{{/if_selected}}

{{#if_not_selected}}
<p>Thank you for your interest in participating in {{EVENT_TITLE}}.</p>
<p>After careful consideration, we regret to inform you that you have not been selected for this event. Due to limited capacity and specific requirements, we were unable to accommodate all applicants.</p>
<p>We encourage you to apply for future events and appreciate your continued engagement with our programs.</p>
{{/if_not_selected}}

<p>Best regards,<br>
The Event Organization Team</p>`);
        } else {
          console.log('⚠️ EmailBody already has content, not overriding');
        }
        return;
      }
      
      console.log('🔄 Fetching email template from API...');
      try {
        const pathParts = window.location.pathname.split('/');
        console.log('🛣️ Path parts:', pathParts);
        
        // URL structure: /portal/tenant/[slug]/events/[eventId]/...
        // pathParts: ['', 'portal', 'tenant', 'slug', 'events', 'eventId', ...]
        const tenantSlug = pathParts[3]; // Changed from pathParts[2] to pathParts[3]
        
        console.log('🏢 Tenant slug:', tenantSlug);
        
        if (!tenantSlug || tenantSlug === 'tenant' || tenantSlug === '') {
          console.log('❌ Invalid tenant slug, trying alternative method');
          
          // Try to get tenant slug from params or other source
          const urlParams = new URLSearchParams(window.location.search);
          const paramTenant = urlParams.get('tenant');
          
          if (paramTenant) {
            console.log('✅ Found tenant in URL params:', paramTenant);
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/email-templates/tenant/${paramTenant}/vetting-notification`;
            console.log('📡 API URL (from params):', apiUrl);
            
            const response = await fetch(apiUrl, {
              headers: {
                'Authorization': `Bearer ${apiClient.getToken()}`
              }
            });
            
            console.log('📥 API Response status:', response.status);
            
            if (response.ok) {
              const template = await response.json();
              console.log('✅ Template fetched successfully:', {
                hasSubject: !!template.subject,
                hasBody: !!template.body,
                subjectLength: template.subject?.length || 0,
                bodyLength: template.body?.length || 0
              });
              
              if (template.subject) {
                console.log('📝 Setting email subject:', template.subject);
                setEmailSubject(template.subject);
              }
              if (template.body) {
                console.log('📝 Setting email body from API');
                setEmailBody(template.body);
                return; // Exit early if we got the template
              }
            }
          }
          
          console.log('⚠️ Setting default template due to invalid tenant slug');
          setEmailBody(`<p><strong>Event Selection Results - {{EVENT_TITLE}}</strong></p>
<p>Dear {{PARTICIPANT_NAME}},</p>
<p>We have completed the selection process for {{EVENT_TITLE}}.</p>

{{#if_selected}}
<p>🎉 <strong>Congratulations! You have been selected to participate.</strong></p>
<p><strong>Event Details:</strong><br>
• Event: {{EVENT_TITLE}}<br>
• Location: {{EVENT_LOCATION}}<br>
• Date: {{EVENT_DATE_RANGE}}</p>
<p><strong>Next Steps:</strong><br>
1. Download the Msafiri mobile app<br>
2. Login using your work email<br>
3. Accept the invitation from the app notifications<br>
4. Submit required documents through the mobile app</p>
<p><strong>Important:</strong> Please use the Msafiri mobile application to accept your invitation and access all event details.</p>
<p>We look forward to your participation!</p>
{{/if_selected}}

{{#if_not_selected}}
<p>Thank you for your interest in participating in {{EVENT_TITLE}}.</p>
<p>After careful consideration, we regret to inform you that you have not been selected for this event. Due to limited capacity and specific requirements, we were unable to accommodate all applicants.</p>
<p>We encourage you to apply for future events and appreciate your continued engagement with our programs.</p>
{{/if_not_selected}}

<p>Best regards,<br>
The Event Organization Team</p>`);
          return;
        }
        
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/email-templates/tenant/${tenantSlug}/vetting-notification`;
        console.log('📡 API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${apiClient.getToken()}`
          }
        });
        
        console.log('📥 API Response status:', response.status);
        
        if (response.ok) {
          const template = await response.json();
          console.log('✅ Template fetched successfully:', {
            hasSubject: !!template.subject,
            hasBody: !!template.body,
            subjectLength: template.subject?.length || 0,
            bodyLength: template.body?.length || 0
          });
          
          if (template.subject) {
            console.log('📝 Setting email subject:', template.subject);
            setEmailSubject(template.subject);
          }
          if (template.body) {
            console.log('📝 Setting email body from API');
            setEmailBody(template.body);
          }
        } else if (!emailBody || emailBody === '') {
          console.log('⚠️ API failed, setting default template because emailBody is empty');
          setEmailBody(`<p><strong>Event Selection Results - {{EVENT_TITLE}}</strong></p>
<p>Dear {{PARTICIPANT_NAME}},</p>
<p>We have completed the selection process for {{EVENT_TITLE}}.</p>

{{#if_selected}}
<p>🎉 <strong>Congratulations! You have been selected to participate.</strong></p>
<p><strong>Event Details:</strong><br>
• Event: {{EVENT_TITLE}}<br>
• Location: {{EVENT_LOCATION}}<br>
• Date: {{EVENT_DATE_RANGE}}</p>
<p><strong>Next Steps:</strong><br>
1. Download the Msafiri mobile app<br>
2. Login using your work email<br>
3. Accept the invitation from the app notifications<br>
4. Submit required documents through the mobile app</p>
<p><strong>Important:</strong> Please use the Msafiri mobile application to accept your invitation and access all event details.</p>
<p>We look forward to your participation!</p>
{{/if_selected}}

{{#if_not_selected}}
<p>Thank you for your interest in participating in {{EVENT_TITLE}}.</p>
<p>After careful consideration, we regret to inform you that you have not been selected for this event. Due to limited capacity and specific requirements, we were unable to accommodate all applicants.</p>
<p>We encourage you to apply for future events and appreciate your continued engagement with our programs.</p>
{{/if_not_selected}}

<p>Best regards,<br>
The Event Organization Team</p>`);
        } else {
          console.log('⚠️ API failed but emailBody already has content, not overriding');
        }
      } catch (error) {
        console.error('❌ Error fetching email template:', error);
        // Set comprehensive default template on error only if emailBody is empty
        if (!emailBody || emailBody === '') {
          console.log('🔧 Setting default template due to error and empty emailBody');
          setEmailBody(`<p><strong>Event Selection Results - {{EVENT_TITLE}}</strong></p>
<p>Dear {{PARTICIPANT_NAME}},</p>
<p>We have completed the selection process for {{EVENT_TITLE}}.</p>

{{#if_selected}}
<p>🎉 <strong>Congratulations! You have been selected to participate.</strong></p>
<p><strong>Event Details:</strong><br>
• Event: {{EVENT_TITLE}}<br>
• Location: {{EVENT_LOCATION}}<br>
• Date: {{EVENT_DATE_RANGE}}</p>
<p><strong>Next Steps:</strong><br>
1. Download the Msafiri mobile app<br>
2. Login using your work email<br>
3. Accept the invitation from the app notifications<br>
4. Submit required documents through the mobile app</p>
<p><strong>Important:</strong> Please use the Msafiri mobile application to accept your invitation and access all event details.</p>
<p>We look forward to your participation!</p>
{{/if_selected}}

{{#if_not_selected}}
<p>Thank you for your interest in participating in {{EVENT_TITLE}}.</p>
<p>After careful consideration, we regret to inform you that you have not been selected for this event. Due to limited capacity and specific requirements, we were unable to accommodate all applicants.</p>
<p>We encourage you to apply for future events and appreciate your continued engagement with our programs.</p>
{{/if_not_selected}}

<p>Best regards,<br>
The Event Organization Team</p>`);
        } else {
          console.log('⚠️ Error occurred but emailBody already has content, not overriding');
        }
      }
    };
    
    console.log('🚀 Starting fetchEmailTemplate useEffect');
    fetchEmailTemplate();
  }, [effectiveVettingMode?.isVettingApprover, apiClient]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedbackMessage({ type, message });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

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
          ? data.filter((p: Participant) => (p.participant_role || p.role) === roleFilter)
          : data;

        setParticipants(filteredData);
        
        if (data.length > 0) {
          const coreColumns = {
            'full_name': 'Name',
            'email': 'Email',
            'status': 'Status',
            'role': 'Role',
            'oc': 'OC',
            'position': 'Position',
            'country': 'Nationality',
            'country_of_work': 'Country of Work',
            'contract_status': 'Contract Status',
            'contract_type': 'Contract Type',
            'gender_identity': 'Gender Identity',
            'phone_number': 'Phone',
            'travelling_internationally': 'International Travel',
            'accommodation_preference': 'Accommodation Preference',
            'has_dietary_requirements': 'Has Dietary Requirements',
            'dietary_requirements': 'Dietary Requirements',
            'has_accommodation_needs': 'Has Accommodation Needs',
            'accommodation_needs': 'Accommodation Needs',
            'certificate_name': 'Certificate Name',
            'badge_name': 'Badge Name',
            'personal_email': 'Personal Email',
            'msf_email': 'MSF Email',
            'line_manager_email': 'Line Manager Email',
            'vetting_comments': 'Vetting Comments',
            'actions': 'Actions'
          };

          const columnDefs: Record<string, string> = {};
          const defaultVisible: Record<string, boolean> = {};
          
          Object.entries(coreColumns).forEach(([key, label]) => {
            columnDefs[key] = label;
            // Show core columns by default, hide detailed ones
            defaultVisible[key] = ['full_name', 'email', 'status', 'role', 'oc', 'position', 'country', 'country_of_work', 'vetting_comments', 'actions'].includes(key);
          });

          setAvailableColumns(columnDefs);
          setVisibleColumns(prev => Object.keys(prev).length === 0 ? defaultVisible : prev);
        }
        
        onParticipantsChange?.(filteredData.length);
        
        if (vettingMode?.onTotalCountChange) {
          vettingMode.onTotalCountChange(data.length);
        }
        
        if (vettingMode?.onRegisteredCountChange) {
          const registeredCount = data.filter((p: Participant) => p.status === 'registered').length;
          vettingMode.onRegisteredCountChange(registeredCount);
        }
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setFetchLoading(false);
    }
  }, [eventId, statusFilter, roleFilter, apiClient, onParticipantsChange, vettingMode]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

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
      (participant.position && participant.position.toLowerCase().includes(searchLower)) ||
      (participant.country && participant.country.toLowerCase().includes(searchLower));

    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParticipants = filteredParticipants.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleStatusChange = async (participantId: number, newStatus: string) => {
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
        setParticipants(prev => prev.map(p => 
          p.id === participantId ? { ...p, status: newStatus } : p
        ));
        showFeedback('success', `Participant status updated to ${newStatus}.`);
      } else {
        showFeedback('error', 'Failed to update participant status.');
      }
    } catch (error) {
      showFeedback('error', 'Network error. Please try again.');
    }
  };

  const handleRoleChange = async (participantId: number, newRole: string) => {
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
        showFeedback('success', `Participant role updated to ${newRole}.`);
      } else {
        showFeedback('error', 'Failed to update participant role.');
      }
    } catch (error) {
      showFeedback('error', 'Failed to update participant role.');
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      const promises = selectedParticipants.map(participantId =>
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/event-registration/participant/${participantId}/status`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${apiClient.getToken()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: newStatus }),
          }
        )
      );

      const responses = await Promise.all(promises);
      const successCount = responses.filter(r => r.ok).length;
      
      if (successCount === selectedParticipants.length) {
        await fetchParticipants();
        setSelectedParticipants([]);
        const message = `${successCount} participant(s) status updated to ${newStatus}.`;
        showFeedback('success', message);
        toast.success(message);
      } else {
        await fetchParticipants();
        const message = `Only ${successCount} of ${selectedParticipants.length} participants were updated.`;
        showFeedback('error', message);
        toast.error(message);
      }
    } catch (error) {
      const message = 'Failed to update participant statuses.';
      showFeedback('error', message);
      toast.error(message);
    }
  };

  const handleBulkRoleChange = async (newRole: string) => {
    try {
      const promises = selectedParticipants.map(participantId =>
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/participants/${participantId}/role`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${apiClient.getToken()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: newRole }),
          }
        )
      );

      const responses = await Promise.all(promises);
      const successCount = responses.filter(r => r.ok).length;
      
      if (successCount === selectedParticipants.length) {
        await fetchParticipants();
        setSelectedParticipants([]);
        const message = `${successCount} participant(s) role updated to ${newRole}.`;
        showFeedback('success', message);
        toast.success(message);
      } else {
        await fetchParticipants();
        const message = `Only ${successCount} of ${selectedParticipants.length} participants were updated.`;
        showFeedback('error', message);
        toast.error(message);
      }
    } catch (error) {
      const message = 'Failed to update participant roles.';
      showFeedback('error', message);
      toast.error(message);
    }
  };

  const handleViewParticipant = (participant: Participant) => {
    const index = filteredParticipants.findIndex(p => p.id === participant.id);
    setViewingParticipantIndex(index);
    setViewingParticipant(participant);
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

  return (
    <div className="space-y-4">
      {feedbackMessage && (
        <FeedbackMessage 
          message={feedbackMessage}
          onClose={() => setFeedbackMessage(null)}
        />
      )}

      {participants.length > 0 && (
        <ParticipantAnalytics 
          participants={participants} 
          onExpandedChange={setAnalyticsExpanded}
        />
      )}

      {!analyticsExpanded && (
        <div className="space-y-6">
          <ParticipantControls
            roleFilter={roleFilter}
            effectiveVettingMode={effectiveVettingMode}
            filteredParticipants={filteredParticipants}
            currentPage={currentPage}
            totalPages={totalPages}
            committeeStatus={committeeStatus}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selectedParticipants={selectedParticipants}
            allowAdminAdd={allowAdminAdd}
            eventHasEnded={eventHasEnded}
            onExport={() => {}}
            onAddParticipant={() => setShowAddForm(true)}
          />

          <div className="flex items-center justify-between mb-4">
            <BulkActions
              selectedParticipants={selectedParticipants}
              effectiveVettingMode={effectiveVettingMode}
              onBulkStatusChange={handleBulkStatusChange}
              onBulkRoleChange={handleBulkRoleChange}
            />
            
            <ColumnSelector
              availableColumns={availableColumns}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              showColumnSelector={showColumnSelector}
              setShowColumnSelector={setShowColumnSelector}
            />
          </div>

          <AddParticipantForm
            showAddForm={showAddForm}
            setShowAddForm={setShowAddForm}
            roleFilter={roleFilter}
            loading={loading}
            onAddParticipant={() => {}}
            allowAdminAdd={allowAdminAdd}
          />

          <ParticipantTable
            participants={participants}
            filteredParticipants={filteredParticipants}
            currentParticipants={currentParticipants}
            selectedParticipants={selectedParticipants}
            visibleColumns={visibleColumns}
            availableColumns={availableColumns}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
            effectiveVettingMode={effectiveVettingMode}
            eventHasEnded={eventHasEnded}
            vettingApproved={vettingApproved}
            resendingId={null}
            deletingId={null}
            updatingRoleId={null}
            participantComments={participantComments}
            getStatusColor={getStatusColor}
            handleSelectParticipant={(id) => {
              setSelectedParticipants(prev => 
                prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
              );
            }}
            handleSelectAll={() => {
              if (selectedParticipants.length === currentParticipants.length) {
                setSelectedParticipants([]);
              } else {
                setSelectedParticipants(currentParticipants.map(p => p.id));
              }
            }}
            handleStatusChange={handleStatusChange}
            handleRoleChange={handleRoleChange}
            handleResendInvitation={async () => {}}
            handleDeleteParticipant={async () => {}}
            handleViewParticipant={handleViewParticipant}
            handleCommentChange={async () => {}}
            setParticipantComments={setParticipantComments}
            goToPage={goToPage}
            fetchLoading={fetchLoading}
          />

          {vettingMode && (
            <VettingControls
              eventId={eventId}
              vettingMode={vettingMode}
              effectiveVettingMode={effectiveVettingMode!}
              filteredParticipants={filteredParticipants}
              eventHasEnded={eventHasEnded}
              committeeStatus={committeeStatus}
              vettingApproved={vettingApproved}
              submittingVetting={submittingVetting}
              emailSubject={emailSubject}
              emailBody={emailBody}
              showEmailTemplate={showEmailTemplate}
              savingTemplate={savingTemplate}
              apiClient={apiClient}
              setCommitteeStatus={setCommitteeStatus}
              setVettingApproved={setVettingApproved}
              setSubmittingVetting={setSubmittingVetting}
              setEmailSubject={setEmailSubject}
              setEmailBody={setEmailBody}
              setShowEmailTemplate={setShowEmailTemplate}
              setSavingTemplate={setSavingTemplate}
              showFeedback={showFeedback}
            />
          )}
        </div>
      )}

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
          effectiveVettingMode={effectiveVettingMode}
          feedbackMessage={feedbackMessage}
          setFeedbackMessage={setFeedbackMessage}
        />
      )}
    </div>
  );
}