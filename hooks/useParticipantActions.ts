/**
 * useParticipantActions Hook
 * Manages participant CRUD operations, status/role changes, and bulk operations
 */

import { useState } from 'react';
import type {
  Participant,
  NewParticipant,
  VettingMode,
} from '@/app/tenant/[slug]/events/types/participant.types';
import { createParticipantService } from '@/app/tenant/[slug]/events/services/participantService';

interface UseParticipantActionsProps {
  eventId: number;
  apiClient: any;
  effectiveVettingMode?: VettingMode | null;
  participantComments: Record<number, string>;
  setParticipantComments: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onParticipantsUpdated: () => Promise<void>;
  onFeedback: (type: 'success' | 'error', message: string) => void;
}

interface UseParticipantActionsReturn {
  loading: boolean;
  resendingId: number | null;
  deletingId: number | null;
  updatingRoleId: number | null;
  processingBulk: boolean;
  processingBulkRole: boolean;
  handleStatusChange: (participantId: number, newStatus: string) => Promise<void>;
  handleRoleChange: (participantId: number, newRole: string) => Promise<void>;
  handleBulkStatusChange: (
    selectedParticipants: number[],
    bulkStatus: string,
    onComplete: () => void
  ) => Promise<void>;
  handleBulkRoleChange: (
    selectedParticipants: number[],
    bulkRole: string,
    onComplete: () => void
  ) => Promise<void>;
  handleResendInvitation: (participantId: number) => Promise<void>;
  handleDeleteParticipant: (participantId: number) => Promise<void>;
  addParticipant: (participant: NewParticipant) => Promise<void>;
}

export function useParticipantActions({
  eventId,
  apiClient,
  effectiveVettingMode,
  participantComments,
  setParticipantComments,
  onParticipantsUpdated,
  onFeedback,
}: UseParticipantActionsProps): UseParticipantActionsReturn {
  const [loading, setLoading] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
  const [processingBulk, setProcessingBulk] = useState(false);
  const [processingBulkRole, setProcessingBulkRole] = useState(false);

  const service = createParticipantService(() => apiClient.getToken());

  const handleStatusChange = async (participantId: number, newStatus: string) => {
    // Check if user can edit during vetting
    if (effectiveVettingMode && !effectiveVettingMode.canEdit) {
      onFeedback('error', 'Cannot edit participants during this vetting phase');
      return;
    }

    try {
      const comments = participantComments[participantId];
      const suppressEmail =
        effectiveVettingMode &&
        effectiveVettingMode.submissionStatus !== 'approved';

      await service.updateParticipantStatus(
        participantId,
        newStatus,
        comments,
        suppressEmail
      );

      // Clear comments after successful update
      if (comments && comments.trim()) {
        setParticipantComments((prev) => ({ ...prev, [participantId]: '' }));
      }

      await onParticipantsUpdated();

      const emailNote =
        effectiveVettingMode && effectiveVettingMode.submissionStatus !== 'approved'
          ? ' (No email sent - awaiting vetting approval)'
          : newStatus === 'selected'
          ? ' Invitation email sent.'
          : '';
      const message = `Participant status updated to ${newStatus}.${emailNote}`;
      onFeedback('success', message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      onFeedback('error', `Failed to update participant status: ${errorMessage}`);
    }
  };

  const handleRoleChange = async (participantId: number, newRole: string) => {
    setUpdatingRoleId(participantId);

    // Check if user can edit during vetting
    if (effectiveVettingMode && !effectiveVettingMode.canEdit) {
      onFeedback('error', 'Cannot edit participants during this vetting phase');
      setUpdatingRoleId(null);
      return;
    }

    try {
      await service.updateParticipantRole(eventId, participantId, newRole);
      await onParticipantsUpdated();
      onFeedback(
        'success',
        `Participant role updated to ${newRole}. Accommodation will be reallocated automatically.`
      );
    } catch (error) {
      onFeedback('error', 'Failed to update participant role.');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleBulkStatusChange = async (
    selectedParticipants: number[],
    bulkStatus: string,
    onComplete: () => void
  ) => {
    if (!bulkStatus || selectedParticipants.length === 0) return;

    setProcessingBulk(true);

    const count = selectedParticipants.length;
    let successCount = 0;

    try {
      for (const participantId of selectedParticipants) {
        try {
          await handleStatusChange(participantId, bulkStatus);
          successCount++;
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          // Continue with next participant
        }
      }

      await onParticipantsUpdated();
      onComplete();

      if (successCount === count) {
        onFeedback('success', `Updated ${count} participants to ${bulkStatus}`);
      } else {
        onFeedback(
          'error',
          `Updated ${successCount} of ${count} participants. Some updates failed.`
        );
      }
    } catch {
      onFeedback('error', 'Failed to update participants');
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleBulkRoleChange = async (
    selectedParticipants: number[],
    bulkRole: string,
    onComplete: () => void
  ) => {
    if (!bulkRole || selectedParticipants.length === 0) return;

    setProcessingBulkRole(true);

    const count = selectedParticipants.length;
    try {
      for (const participantId of selectedParticipants) {
        await handleRoleChange(participantId, bulkRole);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      onComplete();
      onFeedback('success', `Updated ${count} participants to ${bulkRole} role`);
    } catch {
      onFeedback('error', 'Failed to update some participant roles');
    } finally {
      setProcessingBulkRole(false);
    }
  };

  const handleResendInvitation = async (participantId: number) => {
    setResendingId(participantId);
    try {
      await service.resendInvitation(participantId);

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Success!',
        description: 'Invitation has been resent to the participant.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Error!',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleDeleteParticipant = async (participantId: number) => {
    setDeletingId(participantId);
    try {
      await service.deleteParticipant(participantId);
      await onParticipantsUpdated();

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Success!',
        description: 'Participant has been removed.',
      });
    } catch (error) {
      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Error!',
        description: 'Failed to delete participant.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const addParticipant = async (participant: NewParticipant) => {
    setLoading(true);
    try {
      await service.addParticipant(eventId, participant);
      await onParticipantsUpdated();

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Success!',
        description: `${participant.full_name} has been added.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add participant';

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Error!',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    resendingId,
    deletingId,
    updatingRoleId,
    processingBulk,
    processingBulkRole,
    handleStatusChange,
    handleRoleChange,
    handleBulkStatusChange,
    handleBulkRoleChange,
    handleResendInvitation,
    handleDeleteParticipant,
    addParticipant,
  };
}
