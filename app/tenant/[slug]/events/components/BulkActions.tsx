"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VettingMode {
  isVettingCommittee: boolean;
  isVettingApprover: boolean;
  canEdit: boolean;
  submissionStatus?: 'open' | 'pending_approval' | 'approved';
}

interface BulkActionsProps {
  selectedParticipants: number[];
  effectiveVettingMode?: VettingMode;
  onBulkStatusChange: (status: string) => void;
  onBulkRoleChange: (role: string) => void;
}

export function BulkActions({
  selectedParticipants,
  effectiveVettingMode,
  onBulkStatusChange,
  onBulkRoleChange,
}: BulkActionsProps) {
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkRole, setBulkRole] = useState<string>("");
  const [processingBulk, setProcessingBulk] = useState(false);
  const [processingBulkRole, setProcessingBulkRole] = useState(false);

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedParticipants.length === 0) return;
    setProcessingBulk(true);
    try {
      await onBulkStatusChange(bulkStatus);
      setBulkStatus("");
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleBulkRoleChange = async () => {
    if (!bulkRole || selectedParticipants.length === 0) return;
    setProcessingBulkRole(true);
    try {
      await onBulkRoleChange(bulkRole);
      setBulkRole("");
    } finally {
      setProcessingBulkRole(false);
    }
  };

  if (selectedParticipants.length === 0 || (effectiveVettingMode && !effectiveVettingMode.canEdit)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border">
      <span className="text-sm text-blue-700">
        {selectedParticipants.length} selected
      </span>
      <Select value={bulkStatus} onValueChange={setBulkStatus}>
        <SelectTrigger className="w-32 h-8 bg-white border border-gray-200 shadow-sm hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20">
          <SelectValue placeholder="Set status" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg p-1">
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
        </SelectContent>
      </Select>
      <Button
        onClick={handleBulkStatusChange}
        disabled={!bulkStatus || processingBulk}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white h-8"
      >
        {processingBulk ? "Processing..." : "Update"}
      </Button>
      <Select value={bulkRole} onValueChange={setBulkRole}>
        <SelectTrigger className="w-32 h-8 bg-white border border-gray-200 shadow-sm hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20">
          <SelectValue placeholder="Set role" />
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
      <Button
        onClick={handleBulkRoleChange}
        disabled={!bulkRole || processingBulkRole}
        size="sm"
        className="bg-purple-600 hover:bg-purple-700 text-white h-8"
      >
        {processingBulkRole ? "Processing..." : "Set Role"}
      </Button>
    </div>
  );
}