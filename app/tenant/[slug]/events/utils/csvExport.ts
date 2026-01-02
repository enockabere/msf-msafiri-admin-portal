/**
 * CSV Export Utility
 * Functions for exporting participant data to CSV format
 */

import type { Participant, ColumnVisibility, ColumnConfiguration } from '../types/participant.types';

/**
 * Export participants to CSV file
 */
export function exportParticipantsToCSV(
  participants: Participant[],
  visibleColumns: ColumnVisibility,
  availableColumns: ColumnConfiguration,
  eventId: number
): void {
  // Define the columns to include in export
  const exportColumns = [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'oc', label: 'OC' },
    { key: 'position', label: 'Position' },
    { key: 'country', label: 'Country' },
    { key: 'country_of_work', label: 'Country of Work' },
    { key: 'contract_status', label: 'Contract Status' },
    { key: 'contract_type', label: 'Contract Type' },
    { key: 'project_of_work', label: 'Project' },
    { key: 'badge_name', label: 'Badge Name' },
    { key: 'status', label: 'Status' },
    { key: 'role', label: 'Role' },
    { key: 'participant_role', label: 'Participant Role' },
  ];

  // Create CSV header
  const headers = exportColumns.map(col => col.label);

  // Create CSV rows
  const rows = participants.map(participant => {
    return exportColumns.map(col => {
      const value = participant[col.key as keyof Participant];
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      // Escape commas and quotes in values
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `event-${eventId}-participants-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export custom column selection to CSV
 */
export function exportCustomColumnsToCSV(
  participants: Participant[],
  columns: string[],
  columnLabels: Record<string, string>,
  eventId: number
): void {
  // Create CSV header with custom columns
  const headers = columns.map(col => columnLabels[col] || col);

  // Create CSV rows
  const rows = participants.map(participant => {
    return columns.map(col => {
      const value = participant[col as keyof Participant];
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `event-${eventId}-participants-custom-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Convert participant data to CSV string
 */
export function participantsToCSVString(participants: Participant[]): string {
  if (participants.length === 0) {
    return '';
  }

  // Get all unique keys from all participants
  const allKeys = new Set<string>();
  participants.forEach(participant => {
    Object.keys(participant).forEach(key => allKeys.add(key));
  });

  const columns = Array.from(allKeys);

  // Create CSV header
  const headers = columns.join(',');

  // Create CSV rows
  const rows = participants.map(participant => {
    return columns.map(col => {
      const value = participant[col as keyof Participant];
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}
