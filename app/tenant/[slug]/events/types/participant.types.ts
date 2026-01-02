/**
 * Type definitions for Event Participants
 * Centralized type definitions to ensure type safety across the participant management system
 */

// ==================== ENUMS ====================

export enum ParticipantStatus {
  PENDING = 'pending',
  SELECTED = 'selected',
  NOT_SELECTED = 'not_selected',
  REGISTERED = 'registered',
  CONFIRMED = 'confirmed',
  ATTENDED = 'attended',
  DECLINED = 'declined',
  WAITLISTED = 'waitlisted',
}

export enum ParticipantRole {
  PARTICIPANT = 'participant',
  FACILITATOR = 'facilitator',
  OBSERVER = 'observer',
  ORGANIZER = 'organizer',
}

export enum RegistrationType {
  INVITED = 'invited',
  SELF_REGISTERED = 'self_registered',
  ADMIN_ADDED = 'admin_added',
}

export enum AccommodationType {
  GUESTHOUSE = 'guesthouse',
  VENDOR = 'vendor',
}

export enum RoomType {
  SINGLE = 'single',
  DOUBLE = 'double',
}

export enum VettingSubmissionStatus {
  OPEN = 'open',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
}

// ==================== CORE INTERFACES ====================

export interface Participant {
  id: number;
  full_name: string;
  email: string;
  status: string;
  registration_type: string;
  registered_by: string;
  notes?: string;
  created_at: string;

  // Invitation fields
  invitation_sent?: boolean;
  invitation_sent_at?: string;
  invitation_accepted?: boolean;
  invitation_accepted_at?: string;

  // Role and organizational fields
  role?: string;
  participant_role?: string;
  oc?: string;
  position?: string;
  country?: string;
  country_of_work?: string;
  contract_status?: string;
  contract_type?: string;

  // Personal information
  gender_identity?: string;
  sex?: string;
  pronouns?: string;
  project_of_work?: string;

  // Contact information
  personal_email?: string;
  msf_email?: string;
  hrco_email?: string;
  career_manager_email?: string;
  line_manager_email?: string;
  phone_number?: string;

  // Certificate and badge fields
  certificate_name?: string;
  badge_name?: string;

  // Event-specific fields
  motivation_letter?: string;
  dietary_requirements?: string;
  accommodation_needs?: string;
  code_of_conduct_confirm?: string;
  travel_requirements_confirm?: string;
  daily_meals?: string;
  travelling_internationally?: string;
  travelling_from_country?: string;
  accommodation_type?: string;

  // Alternative field names from API (camelCase variants)
  certificateName?: string;
  badgeName?: string;
  motivationLetter?: string;
  dietaryRequirements?: string;
  accommodationNeeds?: string;
  codeOfConductConfirm?: string;
  travelRequirementsConfirm?: string;
  dailyMeals?: string;
  travellingInternationally?: string;
  accommodationType?: string;

  // Document upload fields
  passport_document?: string;
  ticket_document?: string;

  // Decline fields
  decline_reason?: string;
  declined_at?: string;

  // Proof of Accommodation
  proof_of_accommodation_url?: string;
  proof_generated_at?: string;

  // Vetting comments
  vetting_comments?: string;
}

export interface VettingMode {
  isVettingCommittee: boolean;
  isVettingApprover: boolean;
  canEdit: boolean;
  submissionStatus?: 'open' | 'pending_approval' | 'approved';
  onRegisteredCountChange?: (count: number) => void;
  onTotalCountChange?: (count: number) => void;
  onStatusChange?: (status: string) => void;
}

export interface AccommodationData {
  id: number;
  guest_name: string;
  guest_email: string;
  check_in_date: string;
  check_out_date: string;
  accommodation_type: 'guesthouse' | 'vendor';
  status: string;
  event_id?: number;
  event?: {
    id: number;
    title: string;
  };
  room_type?: 'single' | 'double';
  room?: {
    id: number;
    room_number: string;
    capacity: number;
    current_occupants: number;
    guesthouse: {
      id: number;
      name: string;
      location?: string;
    };
  };
  vendor_accommodation?: {
    id: number;
    vendor_name: string;
    location: string;
    roommate_name?: string;
  };
}

export interface TravelRequirement {
  id: number;
  country: string;
  visa_required: boolean;
  eta_required: boolean;
  passport_required: boolean;
  flight_ticket_required: boolean;
  additional_requirements?: {
    name: string;
    required: boolean;
    description?: string;
  }[];
}

export interface TenantData {
  id: number;
  name: string;
  slug: string;
}

export interface EventParticipantsProps {
  eventId: number;
  roleFilter?: string;
  allowAdminAdd?: boolean;
  onParticipantsChange?: (count: number) => void;
  eventHasEnded?: boolean;
  vettingMode?: VettingMode;
}

// ==================== DOCUMENT INTERFACES ====================

export interface LOITemplate {
  id: number;
  name: string;
  is_active: boolean;
  template_content: string;
  event_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BadgeTemplate {
  id: number;
  name?: string;
  badge_template_id: number;
  is_active?: boolean;
  template_content?: string;
  event_id?: number;
}

export interface CertificateData {
  id: number;
  event_certificate_id: number;
  participant_id: number;
  generated_at?: string;
}

// ==================== TRANSPORT & LOGISTICS ====================

export interface TransportBooking {
  id: number;
  participant_name: string;
  participant_email: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  transport_type: string;
  status: string;
  event_id?: number;
  notes?: string;
}

export interface FlightItinerary {
  id: number;
  participant_id: number;
  airline: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  booking_reference?: string;
  status?: string;
}

export interface VoucherData {
  id: number;
  participant_id: number;
  voucher_type: string;
  quantity: number;
  issued_date: string;
  status: string;
}

export interface LineManagerRecommendation {
  id: number;
  participant_id: number;
  line_manager_name: string;
  line_manager_email: string;
  recommendation_text: string;
  submitted_at: string;
  status: string;
}

export interface ChecklistProgress {
  participant_id: number;
  total_items: number;
  completed_items: number;
  checklist_items: Array<{
    id: number;
    title: string;
    completed: boolean;
    completed_at?: string;
  }>;
}

// ==================== UTILITY TYPES ====================

export interface NewParticipant {
  full_name: string;
  email: string;
  role?: string;
}

export interface FeedbackMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface ParticipantFilters {
  status?: string;
  role?: string;
  search?: string;
}

export interface ColumnConfiguration {
  [key: string]: string;
}

export interface ColumnVisibility {
  [key: string]: boolean;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

// ==================== API RESPONSE TYPES ====================

export interface ParticipantResponse {
  participants?: Participant[];
  total?: number;
  page?: number;
  per_page?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// ==================== STATUS & DISPLAY TYPES ====================

export interface StatusDisplay {
  text: string;
  color: string;
}

export interface CommitteeStatusDisplay {
  text: string;
  color: string;
  icon?: string;
}

// ==================== MODAL & UI TYPES ====================

export interface ParticipantDetailsModalProps {
  participant: Participant;
  eventId: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onUpdate?: () => void;
}

export interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onSave: () => Promise<void>;
  participantName: string;
}

export interface BulkOperationsPanelProps {
  selectedCount: number;
  bulkStatus: string;
  bulkRole: string;
  onBulkStatusChange: (status: string) => void;
  onBulkRoleChange: (role: string) => void;
  onApplyBulkStatus: () => Promise<void>;
  onApplyBulkRole: () => Promise<void>;
  onExportCSV: () => void;
  processingBulk: boolean;
  processingBulkRole: boolean;
  disabled?: boolean;
}

export interface ColumnSelectorProps {
  visibleColumns: ColumnVisibility;
  availableColumns: ColumnConfiguration;
  onToggleColumn: (columnKey: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export interface AddParticipantFormProps {
  onAdd: (participant: NewParticipant) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  disabled?: boolean;
}

export interface FeedbackMessageProps {
  type: FeedbackMessage['type'];
  message: string;
  onDismiss: () => void;
}
