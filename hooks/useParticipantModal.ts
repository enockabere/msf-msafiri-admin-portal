/**
 * useParticipantModal Hook
 * Manages participant details modal state and navigation
 */

import { useState, useCallback } from 'react';
import type { Participant } from '@/app/tenant/[slug]/events/types/participant.types';

interface UseParticipantModalReturn {
  viewingParticipant: Participant | null;
  viewingParticipantIndex: number;
  handleViewParticipant: (participant: Participant, participants: Participant[]) => void;
  handleNextParticipant: (participants: Participant[]) => void;
  handlePreviousParticipant: (participants: Participant[]) => void;
  closeModal: () => void;
  hasNext: (participants: Participant[]) => boolean;
  hasPrevious: () => boolean;
}

export function useParticipantModal(): UseParticipantModalReturn {
  const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);
  const [viewingParticipantIndex, setViewingParticipantIndex] = useState(0);

  const handleViewParticipant = useCallback(
    (participant: Participant, participants: Participant[]) => {
      const index = participants.findIndex((p) => p.id === participant.id);
      setViewingParticipantIndex(index);
      setViewingParticipant(participant);
    },
    []
  );

  const handleNextParticipant = useCallback(
    (participants: Participant[]) => {
      const nextIndex = viewingParticipantIndex + 1;
      if (nextIndex < participants.length) {
        setViewingParticipantIndex(nextIndex);
        setViewingParticipant(participants[nextIndex]);
      }
    },
    [viewingParticipantIndex]
  );

  const handlePreviousParticipant = useCallback(
    (participants: Participant[]) => {
      const prevIndex = viewingParticipantIndex - 1;
      if (prevIndex >= 0) {
        setViewingParticipantIndex(prevIndex);
        setViewingParticipant(participants[prevIndex]);
      }
    },
    [viewingParticipantIndex]
  );

  const closeModal = useCallback(() => {
    setViewingParticipant(null);
    setViewingParticipantIndex(0);
  }, []);

  const hasNext = useCallback(
    (participants: Participant[]) => {
      return viewingParticipantIndex + 1 < participants.length;
    },
    [viewingParticipantIndex]
  );

  const hasPrevious = useCallback(() => {
    return viewingParticipantIndex > 0;
  }, [viewingParticipantIndex]);

  return {
    viewingParticipant,
    viewingParticipantIndex,
    handleViewParticipant,
    handleNextParticipant,
    handlePreviousParticipant,
    closeModal,
    hasNext,
    hasPrevious,
  };
}
