/**
 * useParticipantData Hook
 * Manages participant data fetching, filtering, pagination, and column configuration
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  Participant,
  ColumnConfiguration,
  ColumnVisibility,
  VettingMode,
} from '@/app/tenant/[slug]/events/types/participant.types';
import { buildColumnConfiguration } from '@/app/tenant/[slug]/events/utils/columnUtils';

interface UseParticipantDataProps {
  eventId: number;
  roleFilter?: string;
  vettingMode?: VettingMode;
  apiClient: any;
}

interface UseParticipantDataReturn {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  fetchLoading: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  currentPage: number;
  setCurrentPage: (value: number) => void;
  itemsPerPage: number;
  filteredParticipants: Participant[];
  paginatedParticipants: Participant[];
  totalPages: number;
  visibleColumns: ColumnVisibility;
  setVisibleColumns: React.Dispatch<React.SetStateAction<ColumnVisibility>>;
  availableColumns: ColumnConfiguration;
  fetchParticipants: () => Promise<void>;
}

export function useParticipantData({
  eventId,
  roleFilter,
  vettingMode,
  apiClient,
}: UseParticipantDataProps): UseParticipantDataReturn {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>({});
  const [availableColumns, setAvailableColumns] = useState<ColumnConfiguration>({});

  const fetchParticipants = useCallback(async () => {
    setFetchLoading(true);
    try {
      const url = roleFilter
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/participants?role=${roleFilter}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/participants`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
        },
      });

      if (response.ok) {
        const data: Participant[] = await response.json();
        let filteredData = data;

        if (roleFilter) {
          filteredData = data.filter(
            (p) => p.participant_role === roleFilter || p.role === roleFilter
          );
        }

        setParticipants(filteredData);

        // Build column configuration from participant data
        if (filteredData.length > 0) {
          const { columns, visibility } = buildColumnConfiguration(filteredData, vettingMode);
          setAvailableColumns(columns);

          // Only update visible columns if not already set
          setVisibleColumns((prev) => {
            if (Object.keys(prev).length === 0) {
              return visibility;
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    } finally {
      setFetchLoading(false);
    }
  }, [eventId, roleFilter, vettingMode, apiClient]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Filter participants based on search term and status
  const filteredParticipants = participants.filter((participant) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      participant.full_name.toLowerCase().includes(searchLower) ||
      participant.email.toLowerCase().includes(searchLower) ||
      (participant.oc && participant.oc.toLowerCase().includes(searchLower)) ||
      (participant.position && participant.position.toLowerCase().includes(searchLower)) ||
      (participant.country && participant.country.toLowerCase().includes(searchLower));

    const matchesStatus =
      statusFilter === 'all' || participant.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Paginate filtered participants
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParticipants = filteredParticipants.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return {
    participants,
    setParticipants,
    fetchLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    filteredParticipants,
    paginatedParticipants,
    totalPages,
    visibleColumns,
    setVisibleColumns,
    availableColumns,
    fetchParticipants,
  };
}
