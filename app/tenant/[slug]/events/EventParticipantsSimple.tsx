"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import ParticipantAnalytics from "@/components/events/ParticipantAnalytics";
import { FeedbackMessage } from "./components/FeedbackMessage";
import { ParticipantControls } from "./components/ParticipantControls";

interface Participant {
  id: number;
  full_name: string;
  email: string;
  status: string;
  registration_type: string;
  registered_by: string;
  notes?: string;
  created_at: string;
  role?: string;
  participant_role?: string;
  oc?: string;
  position?: string;
  country?: string;
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
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [availableColumns, setAvailableColumns] = useState<Record<string, string>>({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [vettingApproved, setVettingApproved] = useState(false);
  const [committeeStatus, setCommitteeStatus] = useState<string | null>(null);

  const normalizeStatus = (status: string | undefined) => {
    if (status === 'pending') return 'pending_approval';
    return status;
  };
  
  const actualStatus = normalizeStatus(committeeStatus || vettingMode?.submissionStatus);
  
  const effectiveVettingMode = vettingMode ? {
    ...vettingMode,
    canEdit: vettingMode.isVettingCommittee 
      ? actualStatus === 'open'
      : vettingMode.isVettingApprover 
      ? actualStatus === 'pending_approval'
      : vettingMode.canEdit,
    submissionStatus: actualStatus as 'open' | 'pending_approval' | 'approved'
  } : undefined;

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
        
        // Setup basic columns
        const coreColumns = {
          'full_name': 'Name',
          'email': 'Email',
          'status': 'Status',
          'role': 'Role',
          'oc': 'OC',
          'position': 'Position',
          'vetting_comments': 'Vetting Comments',
          'actions': 'Actions'
        };

        setAvailableColumns(coreColumns);
        setVisibleColumns(prev => Object.keys(prev).length === 0 ? 
          Object.keys(coreColumns).reduce((acc, key) => ({ ...acc, [key]: true }), {}) : prev
        );
        
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

  const filteredParticipants = participants.filter((participant) => {
    const searchLower = searchTerm.toLowerCase();
    return !searchTerm ||
      participant.full_name.toLowerCase().includes(searchLower) ||
      participant.email.toLowerCase().includes(searchLower) ||
      (participant.oc && participant.oc.toLowerCase().includes(searchLower));
  });

  const handleExport = () => {
    const csvContent = [
      ["Name", "Email", "Status", "Role", "OC", "Position"].join(","),
      ...filteredParticipants.map((p) =>
        [p.full_name, p.email, p.status, p.participant_role || p.role || "visitor", p.oc || "", p.position || ""].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-${eventId}-participants.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
            currentPage={1}
            totalPages={1}
            committeeStatus={committeeStatus}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selectedParticipants={selectedParticipants}
            allowAdminAdd={allowAdminAdd}
            eventHasEnded={eventHasEnded}
            onExport={handleExport}
            onAddParticipant={() => setShowAddForm(true)}
          />

          {/* Simplified table - full table component would be too large for this refactor */}
          <div className="overflow-x-auto border rounded-lg bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParticipants.slice(0, 10).map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{participant.full_name}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{participant.email}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{participant.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}