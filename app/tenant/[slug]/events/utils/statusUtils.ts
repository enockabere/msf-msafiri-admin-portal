/**
 * Status Utility Functions
 * Functions for handling participant status display, colors, and normalization
 */

import type { StatusDisplay, CommitteeStatusDisplay } from '../types/participant.types';

/**
 * Get Tailwind CSS classes for status badge based on participant status
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'registered':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'selected':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'not_selected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'waiting':
    case 'waitlisted':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'canceled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'attended':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'invited':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'declined':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Normalize status string to handle different status formats
 */
export function normalizeStatus(status: string | undefined): string {
  if (status === 'pending') return 'pending_approval';
  return status || '';
}

/**
 * Get display information for committee status
 */
export function getCommitteeStatusDisplay(status: string): CommitteeStatusDisplay {
  switch (status.toLowerCase()) {
    case 'open':
      return {
        text: 'Open',
        color: 'bg-blue-100 text-blue-800',
        icon: 'circle'
      };
    case 'pending_approval':
      return {
        text: 'Pending Approval',
        color: 'bg-orange-100 text-orange-800',
        icon: 'clock'
      };
    case 'approved':
      return {
        text: 'Approved',
        color: 'bg-green-100 text-green-800',
        icon: 'check-circle'
      };
    default:
      return {
        text: status,
        color: 'bg-gray-100 text-gray-800',
        icon: 'info'
      };
  }
}

/**
 * Get user-friendly status text
 */
export function getStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'registered': 'Registered',
    'selected': 'Selected',
    'not_selected': 'Not Selected',
    'waiting': 'Waiting',
    'waitlisted': 'Waitlisted',
    'canceled': 'Canceled',
    'attended': 'Attended',
    'confirmed': 'Confirmed',
    'invited': 'Invited',
    'declined': 'Declined',
    'pending': 'Pending',
    'pending_approval': 'Pending Approval',
    'approved': 'Approved'
  };

  return statusMap[status.toLowerCase()] || status;
}

/**
 * Check if status is a "positive" status
 */
export function isPositiveStatus(status: string): boolean {
  const positiveStatuses = ['selected', 'registered', 'confirmed', 'attended', 'approved'];
  return positiveStatuses.includes(status.toLowerCase());
}

/**
 * Check if status is a "negative" status
 */
export function isNegativeStatus(status: string): boolean {
  const negativeStatuses = ['not_selected', 'declined', 'canceled'];
  return negativeStatuses.includes(status.toLowerCase());
}

/**
 * Check if status is a "pending" status
 */
export function isPendingStatus(status: string): boolean {
  const pendingStatuses = ['pending', 'waiting', 'waitlisted', 'invited', 'pending_approval'];
  return pendingStatuses.includes(status.toLowerCase());
}
