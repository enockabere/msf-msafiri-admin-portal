/**
 * useVettingWorkflow Hook
 * Manages vetting committee workflow, approval process, and email templates
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  VettingMode,
  EmailTemplate,
  Participant,
} from '@/app/tenant/[slug]/events/types/participant.types';
import { normalizeStatus } from '@/app/tenant/[slug]/events/utils/statusUtils';
import { createParticipantService } from '@/app/tenant/[slug]/events/services/participantService';

interface UseVettingWorkflowProps {
  eventId: number;
  vettingMode?: VettingMode;
  apiClient: any;
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
}

interface UseVettingWorkflowReturn {
  submittingVetting: boolean;
  vettingApproved: boolean;
  committeeStatus: string | null;
  participantComments: Record<number, string>;
  setParticipantComments: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  emailSubject: string;
  setEmailSubject: (value: string) => void;
  emailBody: string;
  setEmailBody: (value: string) => void;
  effectiveVettingMode: VettingMode | null;
  loadEmailTemplate: () => Promise<void>;
  saveEmailTemplate: () => Promise<void>;
  submitForApproval: () => Promise<void>;
  approveVetting: () => Promise<void>;
  cancelApproval: () => Promise<void>;
  handleCommentChange: (participantId: number, comment: string) => Promise<void>;
  fetchCommitteeStatus: () => Promise<void>;
}

const DEFAULT_EMAIL_SUBJECT = 'Event Selection Results - {{EVENT_TITLE}}';
const DEFAULT_EMAIL_BODY = `Dear {{PARTICIPANT_NAME}},



We have completed the selection process for {{EVENT_TITLE}}.

{{#if_selected}}
🎉 <strong>Congratulations! You have been selected to participate.</strong>

Event Details:
• Event: {{EVENT_TITLE}}
• Location: {{EVENT_LOCATION}}
• Date: {{EVENT_DATE_RANGE}}

Next Steps:
1. Complete your travel and accommodation details: {{REGISTRATION_LINK}}
2. Download the Msafiri mobile app
3. Login using your work email ({{PARTICIPANT_EMAIL}})
4. Accept the invitation from the app notifications
5. Submit required documents through the mobile app

Important: Please complete your registration using the link above and use the Msafiri mobile application to accept your invitation and access all event details.

We look forward to your participation!
{{/if_selected}}

{{#if_not_selected}}
Thank you for your interest in participating in {{EVENT_TITLE}}.

After careful consideration, we regret to inform you that you have not been selected for this event. Due to limited capacity and specific requirements, we were unable to accommodate all applicants.

We encourage you to apply for future events and appreciate your continued engagement with our programs.
{{/if_not_selected}}

Best regards,
The Event Organization Team`;

export function useVettingWorkflow({
  eventId,
  vettingMode,
  apiClient,
  participants,
  setParticipants,
}: UseVettingWorkflowProps): UseVettingWorkflowReturn {
  const [submittingVetting, setSubmittingVetting] = useState(false);
  const [vettingApproved, setVettingApproved] = useState(false);
  const [committeeStatus, setCommitteeStatus] = useState<string | null>(null);
  const [participantComments, setParticipantComments] = useState<Record<number, string>>({});
  const [emailSubject, setEmailSubject] = useState(DEFAULT_EMAIL_SUBJECT);
  const [emailBody, setEmailBody] = useState(DEFAULT_EMAIL_BODY);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const service = createParticipantService(() => apiClient.getToken());

  // Calculate effective vetting mode
  const actualStatus = normalizeStatus(committeeStatus || vettingMode?.submissionStatus);

  const effectiveVettingMode = vettingMode
    ? {
        ...vettingMode,
        canEdit: vettingMode.isVettingCommittee
          ? actualStatus === 'open'
          : vettingMode.isVettingApprover
          ? actualStatus === 'pending_approval'
          : vettingMode.canEdit,
        submissionStatus: actualStatus as 'open' | 'pending_approval' | 'approved',
      }
    : null;

  const fetchCommitteeStatus = useCallback(async () => {
    try {
      const status = await service.fetchCommitteeStatus(eventId);
      setCommitteeStatus(status);
    } catch (error) {
      setCommitteeStatus(null);
    }
  }, [eventId, service]);

  useEffect(() => {
    if (vettingMode && (vettingMode.isVettingCommittee || vettingMode.isVettingApprover)) {
      fetchCommitteeStatus();
    }
  }, [vettingMode, fetchCommitteeStatus]);

  // Load existing comments from participants
  useEffect(() => {
    const comments: Record<number, string> = {};
    participants.forEach((p: Participant) => {
      if (p.vetting_comments) {
        comments[p.id] = p.vetting_comments;
      }
    });
    setParticipantComments(comments);
  }, [participants]);

  const loadEmailTemplate = async () => {
    if (!vettingMode?.isVettingApprover) return;

    try {
      const template = await service.loadEmailTemplate(eventId);
      setEmailSubject(template.subject);
      setEmailBody(template.body);
    } catch (error) {
      // Use defaults if no template exists
      setEmailSubject(DEFAULT_EMAIL_SUBJECT);
      setEmailBody(DEFAULT_EMAIL_BODY);
    }
  };

  const saveEmailTemplate = async () => {
    if (!vettingMode?.isVettingApprover) return;

    setSavingTemplate(true);
    try {
      await service.saveEmailTemplate(eventId, {
        subject: emailSubject,
        body: emailBody,
      });

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Success!',
        description: 'Email template saved successfully.',
      });
    } catch (error) {
      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Error!',
        description: 'Failed to save email template.',
        variant: 'destructive',
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const submitForApproval = async () => {
    if (!vettingMode?.isVettingCommittee) return;

    setSubmittingVetting(true);
    try {
      await service.submitForApproval(eventId);
      await fetchCommitteeStatus();

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Success!',
        description: 'Submitted for approval successfully.',
      });

      if (vettingMode.onStatusChange) {
        vettingMode.onStatusChange('pending_approval');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit';

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Error!',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmittingVetting(false);
    }
  };

  const approveVetting = async () => {
    if (!vettingMode?.isVettingApprover) return;

    setSubmittingVetting(true);
    try {
      await service.approveVetting(eventId, {
        subject: emailSubject,
        body: emailBody,
      });

      setVettingApproved(true);
      await fetchCommitteeStatus();

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Success!',
        description: 'Vetting approved and notifications sent successfully.',
      });

      if (vettingMode.onStatusChange) {
        vettingMode.onStatusChange('approved');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve';

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Error!',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmittingVetting(false);
    }
  };

  const cancelApproval = async () => {
    setSubmittingVetting(true);
    try {
      await service.cancelApproval(eventId);
      setVettingApproved(false);
      await fetchCommitteeStatus();

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Success!',
        description: 'Approval cancelled successfully.',
      });

      if (vettingMode?.onStatusChange) {
        vettingMode.onStatusChange('open');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel';

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Error!',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmittingVetting(false);
    }
  };

  const handleCommentChange = async (participantId: number, comment: string) => {
    if (!comment || !comment.trim()) return;

    try {
      const currentParticipant = participants.find((p) => p.id === participantId);
      if (!currentParticipant) return;

      await service.updateParticipantComments(
        participantId,
        currentParticipant.status,
        comment
      );

      // Update participant comments in state
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, vetting_comments: comment.trim() } : p
        )
      );

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Success!',
        description: 'Comment saved successfully.',
      });
    } catch (error) {
      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Error!',
        description: 'Failed to save comment.',
        variant: 'destructive',
      });
    }
  };

  // Load email template on mount for approvers
  useEffect(() => {
    if (vettingMode?.isVettingApprover) {
      loadEmailTemplate();
    }
  }, [vettingMode?.isVettingApprover]);

  return {
    submittingVetting,
    vettingApproved,
    committeeStatus,
    participantComments,
    setParticipantComments,
    emailSubject,
    setEmailSubject,
    emailBody,
    setEmailBody,
    effectiveVettingMode,
    loadEmailTemplate,
    saveEmailTemplate,
    submitForApproval,
    approveVetting,
    cancelApproval,
    handleCommentChange,
    fetchCommitteeStatus,
  };
}
