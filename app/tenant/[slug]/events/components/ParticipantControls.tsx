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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {roleFilter ? `Event ${roleFilter}s` : "Event Participants"}
            {effectiveVettingMode && (
              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm">
                {effectiveVettingMode.isVettingCommittee ? "Vetting Committee" : "Vetting Approver"}
              </Badge>
            )}
          </h3>
          <div className="text-sm text-gray-600 mt-2 flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900">{filteredParticipants.length}</span>
            <span>{roleFilter || "participants"}</span>
            {statusFilter && statusFilter !== "all" && (
              <>
                <span>•</span>
                <span className="text-gray-500">filtered by {statusFilter.replace("_", " ")}</span>
              </>
            )}
            <span>•</span>
            <span>Page {currentPage} of {totalPages || 1}</span>
            {effectiveVettingMode && !effectiveVettingMode.canEdit && (
              <>
                <span>•</span>
                <span className="text-orange-600 font-medium">Read-only mode</span>
              </>
            )}
            {committeeStatus && filteredParticipants.length > 0 && (
              <>
                <span>•</span>
                <span>Vetting Status:</span>
                <Badge className={`text-xs ${getCommitteeStatusDisplay(committeeStatus).color} border-0`}>
                  {getCommitteeStatusDisplay(committeeStatus).text}
                </Badge>
              </>
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
              className="pl-10 w-64 h-10 bg-white border border-gray-200 shadow-sm hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-10 bg-white border border-gray-200 shadow-sm hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg p-1">
              <SelectItem value="all" className="text-sm px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 rounded-md cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  All Statuses
                </div>
              </SelectItem>
              <SelectItem value="registered" className="text-sm px-3 py-2 hover:bg-purple-50 focus:bg-purple-50 rounded-md cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Registered
                </div>
              </SelectItem>
              <SelectItem value="selected" className="text-sm px-3 py-2 hover:bg-green-50 focus:bg-green-50 rounded-md cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Selected
                </div>
              </SelectItem>
              <SelectItem value="not_selected" className="text-sm px-3 py-2 hover:bg-red-50 focus:bg-red-50 rounded-md cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  Not Selected
                </div>
              </SelectItem>
              <SelectItem value="waiting" className="text-sm px-3 py-2 hover:bg-yellow-50 focus:bg-yellow-50 rounded-md cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  Waiting
                </div>
              </SelectItem>
              <SelectItem value="canceled" className="text-sm px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 rounded-md cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  Canceled
                </div>
              </SelectItem>
              <SelectItem value="attended" className="text-sm px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 rounded-md cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Attended
                </div>
              </SelectItem>
              <SelectItem value="declined" className="text-sm px-3 py-2 hover:bg-orange-50 focus:bg-orange-50 rounded-md cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  Declined
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onExport} variant="outline" className="h-10 px-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {allowAdminAdd && (
            <Button
              onClick={onAddParticipant}
              disabled={eventHasEnded}
              className="h-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 rounded-lg shadow-sm font-medium transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {roleFilter || "Participant"}
            </Button>
          )}
        </div>
      </div>
    </div>
}