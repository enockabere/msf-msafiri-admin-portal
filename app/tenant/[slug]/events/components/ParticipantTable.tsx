"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Send, Trash2 } from "lucide-react";

interface Participant {
  id: number;
  full_name: string;
  email: string;
  status: string;
  registration_type: string;
  registered_by: string;
  created_at: string;
  participant_role?: string;
  role?: string;
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
}

interface ParticipantTableProps {
  participants: Participant[];
  filteredParticipants: Participant[];
  currentParticipants: Participant[];
  selectedParticipants: number[];
  visibleColumns: Record<string, boolean>;
  availableColumns: Record<string, string>;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  effectiveVettingMode?: VettingMode;
  eventHasEnded: boolean;
  vettingApproved: boolean;
  resendingId: number | null;
  deletingId: number | null;
  updatingRoleId: number | null;
  participantComments: Record<number, string>;
  fetchLoading: boolean;
  getStatusColor: (status: string) => string;
  handleSelectParticipant: (id: number) => void;
  handleSelectAll: () => void;
  handleStatusChange: (id: number, status: string) => Promise<void>;
  handleRoleChange: (id: number, role: string) => Promise<void>;
  handleResendInvitation: (id: number) => Promise<void>;
  handleDeleteParticipant: (id: number) => Promise<void>;
  handleViewParticipant: (participant: Participant) => void;
  handleCommentChange: (id: number, comment: string) => Promise<void>;
  setParticipantComments: (comments: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  goToPage: (page: number) => void;
}

export function ParticipantTable({
  participants,
  filteredParticipants,
  currentParticipants,
  selectedParticipants,
  visibleColumns,
  availableColumns,
  currentPage,
  totalPages,
  itemsPerPage,
  startIndex,
  endIndex,
  effectiveVettingMode,
  eventHasEnded,
  vettingApproved,
  resendingId,
  deletingId,
  updatingRoleId,
  participantComments,
  fetchLoading,
  getStatusColor,
  handleSelectParticipant,
  handleSelectAll,
  handleStatusChange,
  handleRoleChange,
  handleResendInvitation,
  handleDeleteParticipant,
  handleViewParticipant,
  handleCommentChange,
  setParticipantComments,
  goToPage,
}: ParticipantTableProps) {
  const renderCellContent = (participant: Participant, key: string) => {
    const value = participant[key];
    
    if (key === 'full_name') {
      return (
        <div className="flex items-center cursor-pointer" onClick={() => handleViewParticipant(participant)}>
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 mr-3">
            {participant.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="text-sm font-medium text-blue-600 hover:text-blue-800 underline">
            {participant.full_name}
          </div>
        </div>
      );
    }
    
    if (key === 'status') {
      return effectiveVettingMode && !effectiveVettingMode.canEdit ? (
        <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(participant.status)}`}>
          {participant.status.replace("_", " ").toUpperCase()}
        </Badge>
      ) : (
        <Select
          value={participant.status}
          onValueChange={(value) => handleStatusChange(participant.id, value)}
          disabled={eventHasEnded}
        >
          <SelectTrigger className="w-24 h-7 text-xs">
            <SelectValue />
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
      );
    }
    
    if (key === 'role') {
      const roleValue = participant.participant_role || participant.role || "visitor";
      return effectiveVettingMode && !effectiveVettingMode.canEdit ? (
        <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700">
          {roleValue.toUpperCase()}
        </Badge>
      ) : (
        <Select
          value={roleValue}
          onValueChange={(value) => handleRoleChange(participant.id, value)}
          disabled={eventHasEnded || updatingRoleId === participant.id}
        >
          <SelectTrigger className="w-24 h-7 text-xs">
            {updatingRoleId === participant.id ? (
              <div className="flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                <span className="text-xs">Updating...</span>
              </div>
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="visitor">Visitor</SelectItem>
            <SelectItem value="facilitator">Facilitator</SelectItem>
            <SelectItem value="organizer">Organizer</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    if (key === 'vetting_comments') {
      return effectiveVettingMode && effectiveVettingMode.canEdit && 
       (participant.status === 'declined' || participant.status === 'canceled') ? (
        <Select
          value={participantComments[participant.id] || participant.vetting_comments || ''}
          onValueChange={(value) => {
            setParticipantComments(prev => ({ 
              ...prev, 
              [participant.id]: value 
            }));
            handleCommentChange(participant.id, value);
          }}
        >
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Select reason" />
          </SelectTrigger>
          <SelectContent>
            {participant.status === 'declined' ? (
              <>
                <SelectItem value="Declined - Operational / Work Reasons">Declined - Operational / Work Reasons</SelectItem>
                <SelectItem value="Declined - Personal Reasons">Declined - Personal Reasons</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="Cancelled - Operational Reasons">Cancelled - Operational Reasons</SelectItem>
                <SelectItem value="Cancelled - Personal Reasons">Cancelled - Personal Reasons</SelectItem>
                <SelectItem value="Cancelled - Prioritising Other Training">Cancelled - Prioritising Other Training</SelectItem>
                <SelectItem value="Cancelled - Visa Rejected">Cancelled - Visa Rejected</SelectItem>
                <SelectItem value="Cancelled - Visa Appointment Not Available">Cancelled - Visa Appointment Not Available</SelectItem>
                <SelectItem value="Cancelled - Visa Issuing Took Too Long">Cancelled - Visa Issuing Took Too Long</SelectItem>
                <SelectItem value="Cancelled - Visa Process Unfeasible">Cancelled - Visa Process Unfeasible</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      ) : effectiveVettingMode && effectiveVettingMode.canEdit ? (
        <textarea
          value={participantComments[participant.id] || ''}
          onChange={(e) => setParticipantComments(prev => ({
            ...prev,
            [participant.id]: e.target.value
          }))}
          onBlur={(e) => {
            const comment = e.target.value.trim();
            if (comment && comment !== participant.vetting_comments) {
              handleCommentChange(participant.id, comment);
            }
          }}
          placeholder="Add comments..."
          className="w-full h-16 text-xs border border-gray-300 rounded px-2 py-1 resize-none focus:border-blue-500 focus:outline-none"
          maxLength={500}
        />
      ) : participant.vetting_comments ? (
        <div className="text-xs text-gray-700 max-w-40 truncate" title={participant.vetting_comments}>
          {participant.vetting_comments}
        </div>
      ) : (
        <span className="text-xs text-gray-400">-</span>
      );
    }
    
    if (key === 'actions') {
      return (
        <div className="flex items-center gap-1">
          {(!effectiveVettingMode || effectiveVettingMode.isVettingApprover) &&
            participant.status === "selected" &&
            participant.email &&
            participant.email.trim() &&
            !vettingApproved && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResendInvitation(participant.id)}
                disabled={resendingId === participant.id || eventHasEnded}
                className="h-7 px-2 text-xs border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendingId === participant.id ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-700"></div>
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>
            )}
          {!effectiveVettingMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteParticipant(participant.id)}
              disabled={deletingId === participant.id || eventHasEnded}
              className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingId === participant.id ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700"></div>
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      );
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return (
        <span className="text-xs text-gray-700">
          {value.join(', ') || '-'}
        </span>
      );
    }
    
    // Handle boolean values
    if (typeof value === 'boolean') {
      return (
        <span className={`text-xs font-medium ${
          value ? 'text-green-700' : 'text-red-700'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }
    
    // Handle dates
    if (key.includes('date') || key.includes('_at')) {
      return (
        <span className="text-xs text-gray-700">
          {value ? new Date(value as string).toLocaleDateString() : '-'}
        </span>
      );
    }
    
    // Default text rendering
    const textValue = String(value || '-');
    return (
      <span 
        className="text-xs text-gray-700 max-w-32 truncate block" 
        title={textValue.length > 20 ? textValue : undefined}
      >
        {textValue}
      </span>
    );
  };

  if (fetchLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading participants...</p>
      </div>
    );
  }

  if (filteredParticipants.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <span className="h-8 w-8 text-gray-400">+</span>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No participants yet
          </h4>
          <p className="text-gray-500 mb-4">
            Get started by adding your first participant
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={
                  selectedParticipants.length === currentParticipants.length &&
                  currentParticipants.length > 0
                }
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
            </th>
            {Object.entries(availableColumns).map(([key, label]) => 
              visibleColumns[key] && (
                <th key={key} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {label}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentParticipants.map((participant) => (
            <tr key={participant.id} className="hover:bg-gray-50">
              <td className="px-3 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedParticipants.includes(participant.id)}
                  onChange={() => handleSelectParticipant(participant.id)}
                  className="rounded border-gray-300"
                />
              </td>
              {Object.entries(availableColumns).map(([key]) => 
                visibleColumns[key] && (
                  <td key={key} className="px-3 py-4 whitespace-nowrap">
                    {renderCellContent(participant, key)}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredParticipants.length)} of{" "}
            {filteredParticipants.length} participants
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 px-3 text-xs"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 px-3 text-xs"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}