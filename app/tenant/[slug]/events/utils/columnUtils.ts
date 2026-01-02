/**
 * Column Management Utilities
 * Functions for managing table column visibility and configuration
 */

import type { ColumnConfiguration, ColumnVisibility, Participant, VettingMode } from '../types/participant.types';

/**
 * Get default column configuration with user-friendly labels
 */
export function getDefaultColumns(): ColumnConfiguration {
  return {
    'full_name': 'Name',
    'email': 'Email',
    'status': 'Status',
    'role': 'Role',
    'oc': 'OC',
    'position': 'Position',
    'country_of_work': 'Country of Work',
    'country': 'Country',
    'contract_status': 'Contract Status',
    'contract_type': 'Contract Type',
    'project_of_work': 'Project',
    'badge_name': 'Badge Name',
    'certificate_name': 'Certificate Name',
    'motivation_letter': 'Motivation Letter',
    'dietary_requirements': 'Dietary Requirements',
    'accommodation_needs': 'Accommodation Needs',
    'actions': 'Actions'
  };
}

/**
 * Get default visibility configuration
 */
export function getDefaultVisibility(): ColumnVisibility {
  return {
    'full_name': true,
    'email': true,
    'status': true,
    'role': true,
    'oc': true,
    'position': true,
    'country_of_work': true,
    'actions': true,
    // All other columns hidden by default
    'country': false,
    'contract_status': false,
    'contract_type': false,
    'project_of_work': false,
    'badge_name': false,
    'certificate_name': false,
    'motivation_letter': false,
    'dietary_requirements': false,
    'accommodation_needs': false,
  };
}

/**
 * Build dynamic column configuration from participant data
 */
export function buildColumnConfiguration(
  participants: Participant[],
  vettingMode?: VettingMode | null
): { columns: ColumnConfiguration; visibility: ColumnVisibility } {
  if (participants.length === 0) {
    return {
      columns: getDefaultColumns(),
      visibility: getDefaultVisibility()
    };
  }

  // Collect all non-null fields from all participants
  const allFields = new Set<string>();
  participants.forEach((participant) => {
    Object.keys(participant).forEach(key => {
      const value = participant[key as keyof Participant];
      if (value !== null && value !== undefined && value !== '') {
        allFields.add(key);
      }
    });
  });

  const columnDefs: ColumnConfiguration = {};
  const defaultVisible: ColumnVisibility = {};

  // Core columns (always show by default)
  const coreColumns: ColumnConfiguration = {
    'full_name': 'Name',
    'email': 'Email',
    'status': 'Status',
    'role': 'Role',
    'oc': 'OC',
    'position': 'Position',
    'country_of_work': 'Country of Work'
  };

  // Add vetting comments to core columns when in vetting mode
  if (vettingMode && (vettingMode.isVettingCommittee || vettingMode.isVettingApprover)) {
    coreColumns['vetting_comments'] = 'Vetting Comments';
    allFields.add('vetting_comments');
  }

  // Add core columns first
  Object.entries(coreColumns).forEach(([key, label]) => {
    if (allFields.has(key)) {
      columnDefs[key] = label;
      defaultVisible[key] = true;
    }
  });

  // Remove participant_role from allFields to prevent duplicate role columns
  allFields.delete('participant_role');
  allFields.delete('id');
  allFields.delete('created_at');
  allFields.delete('updated_at');

  // Add other fields with formatted labels
  allFields.forEach(field => {
    if (!columnDefs[field]) {
      const label = formatFieldLabel(field);
      columnDefs[field] = label;
      defaultVisible[field] = false; // Hidden by default for non-core fields
    }
  });

  // Always show actions column
  columnDefs['actions'] = 'Actions';
  defaultVisible['actions'] = true;

  return {
    columns: columnDefs,
    visibility: defaultVisible
  };
}

/**
 * Format field name into user-friendly label
 */
export function formatFieldLabel(fieldName: string): string {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Save column preferences to localStorage
 */
export function saveColumnPreferences(
  eventId: number,
  visibleColumns: ColumnVisibility
): void {
  try {
    const key = `event-${eventId}-column-prefs`;
    localStorage.setItem(key, JSON.stringify(visibleColumns));
  } catch (error) {
    console.error('Failed to save column preferences:', error);
  }
}

/**
 * Load column preferences from localStorage
 */
export function loadColumnPreferences(eventId: number): ColumnVisibility | null {
  try {
    const key = `event-${eventId}-column-prefs`;
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  } catch (error) {
    console.error('Failed to load column preferences:', error);
    return null;
  }
}

/**
 * Clear column preferences from localStorage
 */
export function clearColumnPreferences(eventId: number): void {
  try {
    const key = `event-${eventId}-column-prefs`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear column preferences:', error);
  }
}

/**
 * Get visible column keys
 */
export function getVisibleColumnKeys(visibleColumns: ColumnVisibility): string[] {
  return Object.entries(visibleColumns)
    .filter(([_, visible]) => visible)
    .map(([key]) => key);
}

/**
 * Toggle column visibility
 */
export function toggleColumnVisibility(
  visibleColumns: ColumnVisibility,
  columnKey: string
): ColumnVisibility {
  return {
    ...visibleColumns,
    [columnKey]: !visibleColumns[columnKey]
  };
}

/**
 * Show all columns
 */
export function showAllColumns(availableColumns: ColumnConfiguration): ColumnVisibility {
  const visibility: ColumnVisibility = {};
  Object.keys(availableColumns).forEach(key => {
    visibility[key] = true;
  });
  return visibility;
}

/**
 * Hide all columns except core columns
 */
export function showOnlyCoreColumns(): ColumnVisibility {
  return getDefaultVisibility();
}
