/**
 * Participant Service
 * Centralized API service for all participant-related operations
 */

import type {
  Participant,
  NewParticipant,
  ParticipantResponse,
  ApiError,
  EmailTemplate,
} from '../types/participant.types';

export class ParticipantService {
  private baseUrl: string;
  private getToken: () => string | null;

  constructor(getToken: () => string | null) {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    this.getToken = getToken;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    };
  }

  /**
   * Fetch all participants for an event
   */
  async fetchParticipants(eventId: number, roleFilter?: string): Promise<Participant[]> {
    const url = roleFilter
      ? `${this.baseUrl}/api/v1/events/${eventId}/participants?role=${roleFilter}`
      : `${this.baseUrl}/api/v1/events/${eventId}/participants`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch participants: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Add a new participant to an event
   */
  async addParticipant(eventId: number, participant: NewParticipant): Promise<Participant> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/event-registration/register`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          event_id: eventId,
          user_email: participant.email,
          full_name: participant.full_name,
          role: participant.role || 'attendee',
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to add participant');
    }

    return await response.json();
  }

  /**
   * Update participant status
   */
  async updateParticipantStatus(
    participantId: number,
    status: string,
    comments?: string,
    suppressEmail?: boolean
  ): Promise<void> {
    const requestBody: Record<string, unknown> = { status };

    if (comments && comments.trim()) {
      requestBody.comments = comments.trim();
    }

    if (suppressEmail !== undefined) {
      requestBody.suppress_email = suppressEmail;
    }

    const response = await fetch(
      `${this.baseUrl}/api/v1/event-registration/participant/${participantId}/status`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || `HTTP ${response.status}` };
      }
      throw new Error(errorData.detail || errorData.message || 'Failed to update status');
    }
  }

  /**
   * Update participant role
   */
  async updateParticipantRole(
    eventId: number,
    participantId: number,
    role: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/events/${eventId}/participants/${participantId}/role`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ role }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update participant role');
    }
  }

  /**
   * Delete a participant
   */
  async deleteParticipant(participantId: number): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/event-registration/participant/${participantId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete participant');
    }
  }

  /**
   * Resend invitation to a participant
   */
  async resendInvitation(participantId: number): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/event-registration/participant/${participantId}/resend-invitation`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to resend invitation');
    }
  }

  /**
   * Update participant comments
   */
  async updateParticipantComments(
    participantId: number,
    currentStatus: string,
    comments: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/event-registration/participant/${participantId}/status`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          status: currentStatus,
          comments: comments.trim(),
          suppress_email: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to save comment');
    }
  }

  /**
   * Fetch vetting committee status
   */
  async fetchCommitteeStatus(eventId: number): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/vetting-committee/event/${eventId}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      return null;
    }
  }

  /**
   * Submit for vetting approval
   */
  async submitForApproval(eventId: number): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/vetting-committee/event/${eventId}/submit`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to submit for approval');
    }
  }

  /**
   * Approve vetting and send notifications
   */
  async approveVetting(eventId: number, emailTemplate: EmailTemplate): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/vetting-committee/event/${eventId}/approve`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          email_subject: emailTemplate.subject,
          email_body: emailTemplate.body,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to approve vetting');
    }
  }

  /**
   * Cancel vetting approval
   */
  async cancelApproval(eventId: number): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/vetting-committee/event/${eventId}/cancel`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to cancel approval');
    }
  }

  /**
   * Load email template
   */
  async loadEmailTemplate(eventId: number): Promise<EmailTemplate> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/vetting-committee/event/${eventId}/email-template`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to load email template');
    }

    const data = await response.json();
    return {
      subject: data.subject,
      body: data.body,
    };
  }

  /**
   * Save email template
   */
  async saveEmailTemplate(eventId: number, template: EmailTemplate): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/vetting-committee/event/${eventId}/email-template`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          subject: template.subject,
          body: template.body,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to save email template');
    }
  }

  /**
   * Fetch form responses for dynamic fields
   */
  async fetchFormResponses(eventId: number): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/form-fields/event/${eventId}/responses`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      return [];
    }

    return await response.json();
  }

  /**
   * Fetch accommodation data for a participant
   */
  async fetchAccommodationData(eventId: number, participantEmail: string): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/accommodation?event_id=${eventId}&guest_email=${encodeURIComponent(participantEmail)}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      return [];
    }

    return await response.json();
  }

  /**
   * Fetch transport bookings for a participant
   */
  async fetchTransportBookings(eventId: number, participantEmail: string): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/transport/bookings?event_id=${eventId}&participant_email=${encodeURIComponent(participantEmail)}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      return [];
    }

    return await response.json();
  }

  /**
   * Fetch vouchers for a participant
   */
  async fetchVouchers(participantId: number): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/vouchers/participant/${participantId}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      return [];
    }

    return await response.json();
  }

  /**
   * Fetch flight itineraries for a participant
   */
  async fetchFlightItineraries(participantId: number): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/flights/participant/${participantId}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      return [];
    }

    return await response.json();
  }

  /**
   * Fetch travel requirements for a country
   */
  async fetchTravelRequirements(country: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/travel-requirements/${encodeURIComponent(country)}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch line manager recommendation
   */
  async fetchLineManagerRecommendation(participantId: number): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/line-manager-recommendations/participant/${participantId}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch checklist progress for a participant
   */
  async fetchChecklistProgress(participantId: number): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/checklist/participant/${participantId}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }
}

/**
 * Create a participant service instance
 */
export function createParticipantService(getToken: () => string | null): ParticipantService {
  return new ParticipantService(getToken);
}
