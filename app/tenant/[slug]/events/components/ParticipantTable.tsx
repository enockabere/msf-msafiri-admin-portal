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
          <SelectTrigger className="w-32 h-8 text-xs bg-white border border-gray-200 shadow-sm hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg p-1">
            <SelectItem value="registered" className="text-xs px-3 py-2 hover:bg-purple-50 focus:bg-purple-50 rounded-md cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                Registered
              </div>
            </SelectItem>
            <SelectItem value="selected" className="text-xs px-3 py-2 hover:bg-green-50 focus:bg-green-50 rounded-md cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Selected
              </div>
            </SelectItem>
            <SelectItem value="not_selected" className="text-xs px-3 py-2 hover:bg-red-50 focus:bg-red-50 rounded-md cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Not Selected
              </div>
            </SelectItem>
            <SelectItem value="waiting" className="text-xs px-3 py-2 hover:bg-yellow-50 focus:bg-yellow-50 rounded-md cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                Waiting
              </div>
            </SelectItem>
            <SelectItem value="canceled" className="text-xs px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 rounded-md cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                Canceled
              </div>
            </SelectItem>
            <SelectItem value="declined" className="text-xs px-3 py-2 hover:bg-orange-50 focus:bg-orange-50 rounded-md cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                Declined
              </div>
            </SelectItem>
            <SelectItem value="attended" className="text-xs px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 rounded-md cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Attended
              </div>
            </SelectItem>
            <SelectItem value="confirmed" className="text-xs px-3 py-2 hover:bg-emerald-50 focus:bg-emerald-50 rounded-md cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Confirmed
              </div>
            </SelectItem>
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
          <SelectTrigger className="w-32 h-8 text-xs bg-white border border-gray-200 shadow-sm hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20">
            {updatingRoleId === participant.id ? (
              <div className="flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                <span className="text-xs">Updating...</span>
              </div>
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg p-1">
            <SelectItem value="visitor" className="text-xs px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 rounded-md cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Visitor
              </div>
            </SelectItem>
            <SelectItem value="facilitator" className="text-xs px-3 py-2 hover:bg-purple-50 focus:bg-purple-50 rounded-md cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                Facilitator
              </div>
            </SelectItem>
            <SelectItem value="organizer" className="text-xs px-3 py-2 hover:bg-green-50 focus:bg-green-50 rounded-md cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Organizer
              </div>
            </SelectItem>
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
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-4 py-4 text-left">
              <input
                type="checkbox"
                checked={
                  selectedParticipants.length === currentParticipants.length &&
                  currentParticipants.length > 0
                }
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500 focus:ring-2"
              />
            </th>
            {Object.entries(availableColumns).map(([key, label]) => 
              visibleColumns[key] && (
                <th key={key} className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {label}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {currentParticipants.map((participant, index) => (
            <tr key={participant.id} className={`hover:bg-gray-50/50 transition-colors ${
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
            }`}>
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedParticipants.includes(participant.id)}
                  onChange={() => handleSelectParticipant(participant.id)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500 focus:ring-2"
                />
              </td>
              {Object.entries(availableColumns).map(([key]) => 
                visibleColumns[key] && (
                  <td key={key} className="px-4 py-4">
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
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 rounded-b-xl">
          <div className="text-sm text-gray-600 font-medium">
            Showing <span className="text-gray-900 font-semibold">{startIndex + 1}</span> to{" "}
            <span className="text-gray-900 font-semibold">{Math.min(endIndex, filteredParticipants.length)}</span> of{" "}
            <span className="text-gray-900 font-semibold">{filteredParticipants.length}</span> participants
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 px-4 text-xs bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">Page</span>
              <span className="text-sm font-semibold text-gray-900 bg-white px-3 py-1 rounded-md border border-gray-300">
                {currentPage}
              </span>
              <span className="text-sm text-gray-600">of {totalPages}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-9 px-4 text-xs bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}