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
        <SelectTrigger className="w-32 h-8 bg-white">
          <SelectValue placeholder="Set status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="selected">Selected</SelectItem>
          <SelectItem value="not_selected">Not Selected</SelectItem>
          <SelectItem value="waiting">Waiting</SelectItem>
          <SelectItem value="canceled">Canceled</SelectItem>
          <SelectItem value="declined">Declined</SelectItem>
          <SelectItem value="attended">Attended</SelectItem>
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
        <SelectTrigger className="w-32 h-8 bg-white">
          <SelectValue placeholder="Set role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="visitor">Visitor</SelectItem>
          <SelectItem value="facilitator">Facilitator</SelectItem>
          <SelectItem value="organizer">Organizer</SelectItem>
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