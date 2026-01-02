"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Plus } from "lucide-react";

interface ParticipantControlsProps {
  roleFilter?: string;
  effectiveVettingMode?: any;
  filteredParticipants: any[];
  currentPage: number;
  totalPages: number;
  committeeStatus: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  selectedParticipants: number[];
  allowAdminAdd: boolean;
  eventHasEnded: boolean;
  onExport: () => void;
  onAddParticipant: () => void;
}

export function ParticipantControls({
  roleFilter,
  effectiveVettingMode,
  filteredParticipants,
  currentPage,
  totalPages,
  committeeStatus,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  selectedParticipants,
  allowAdminAdd,
  eventHasEnded,
  onExport,
  onAddParticipant,
}: ParticipantControlsProps) {
  const getCommitteeStatusDisplay = (status: string) => {
    switch (status) {
      case 'open': return { text: 'Open', color: 'bg-blue-100 text-blue-800' };
      case 'pending_approval': return { text: 'Pending Approval', color: 'bg-orange-100 text-orange-800' };
      case 'approved': return { text: 'Approved', color: 'bg-green-100 text-green-800' };
      default: return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900">
          {roleFilter ? `Event ${roleFilter}s` : "Event Participants"}
          {effectiveVettingMode && (
            <Badge className="ml-2 bg-blue-100 text-blue-800">
              {effectiveVettingMode.isVettingCommittee ? "Vetting Committee" : "Vetting Approver"}
            </Badge>
          )}
        </h3>
        <div className="text-sm text-gray-600 mt-1">
          {filteredParticipants.length} {roleFilter || "participants"}{" "}
          {statusFilter && statusFilter !== "all"
            ? `(${statusFilter.replace("_", " ")})`
            : "total"}{" "}
          • Page {currentPage} of {totalPages || 1}
          {effectiveVettingMode && !effectiveVettingMode.canEdit && (
            <span className="text-orange-600 font-medium"> • Read-only mode</span>
          )}
          {committeeStatus && filteredParticipants.length > 0 && (
            <span className="ml-2">
              • Vetting Status:
              <Badge className={`ml-1 text-xs ${getCommitteeStatusDisplay(committeeStatus).color}`}>
                {getCommitteeStatusDisplay(committeeStatus).text}
              </Badge>
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search participants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64 border-gray-300 focus:border-red-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white border-gray-300">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="selected">Selected</SelectItem>
            <SelectItem value="not_selected">Not Selected</SelectItem>
            <SelectItem value="waiting">Waiting</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="attended">Attended</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onExport} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        {allowAdminAdd && (
          <Button
            onClick={onAddParticipant}
            disabled={eventHasEnded}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {roleFilter || "Participant"}
          </Button>
        )}
      </div>
    </div>
  );
}