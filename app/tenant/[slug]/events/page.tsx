"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Navbar from "@/components/layout/navbar";
import { SuperAdminFooter } from "@/components/layout/SuperAdminFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


import EventFormModal from "./components/EventFormModal";
import {
  Calendar,
  Plus,
  Clock,
  Play,
  CheckCircle,
  Grid3X3,
  List,
  Search,
  Download,
} from "lucide-react";
import EventDetailsModal from "./EventDetailsModal";
import { EventCard } from "./components/EventCard";
import { EventTable } from "./components/EventTable";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/ui/loading";

interface Event {
  id: number;
  title: string;
  description?: string;
  event_type?: string;
  status: string;
  start_date: string;
  end_date: string;
  location?: string;
  address?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  banner_image?: string;
  duration_days?: number;
  perdiem_rate?: number;
  perdiem_currency?: string;
  registration_deadline?: string;
  vendor_accommodation_id?: number;
  tenant_id?: number;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  participant_count?: number;
  selected_count?: number;
  tenant_name?: string;
  checked_in_count?: number;
  event_status?: 'upcoming' | 'ongoing' | 'ended';
  days_until_start?: number;
}

interface EventStats {
  total_registered: number;
  selected_count: number;
  checked_in_count: number;
}

interface UserRole {
  role: string;
}

// Helper function to get timezone from country
const getTimezoneFromCountry = (country: string): string => {
  const timezoneMap: Record<string, string> = {
    'Kenya': 'EAT (UTC+3)',
    'Uganda': 'EAT (UTC+3)',
    'Tanzania': 'EAT (UTC+3)',
    'Rwanda': 'CAT (UTC+2)',
    'Ethiopia': 'EAT (UTC+3)',
    'South Africa': 'SAST (UTC+2)',
    'Nigeria': 'WAT (UTC+1)',
    'Ghana': 'GMT (UTC+0)',
    'Egypt': 'EET (UTC+2)',
    'Morocco': 'WET (UTC+0)',
    'United States': 'EST/PST (UTC-5/-8)',
    'United Kingdom': 'GMT/BST (UTC+0/+1)',
    'France': 'CET (UTC+1)',
    'Germany': 'CET (UTC+1)',
    'India': 'IST (UTC+5:30)',
    'China': 'CST (UTC+8)',
    'Japan': 'JST (UTC+9)',
    'Australia': 'AEST (UTC+10)',
    'Brazil': 'BRT (UTC-3)',
    'Canada': 'EST/PST (UTC-5/-8)',
  };
  return timezoneMap[country] || 'Local Time';
};

export default function TenantEventsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [events, setEvents] = useState<Event[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  const [tenantData, setTenantData] = useState<{ country?: string; timezone?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'ended'>('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 8;
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Event | string>('start_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [submitting, setSubmitting] = useState(false);
  const [vendorHotels, setVendorHotels] = useState<{id: number, vendor_name: string, location: string, latitude?: string, longitude?: string}[]>([]);
  const [, setAccommodationSetups] = useState<{id: number, event_name: string, single_rooms: number, double_rooms: number}[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "",
    status: "Draft",
    start_date: "",
    end_date: "",
    vendor_accommodation_id: "",
    expected_participants: "",
    single_rooms: "",
    double_rooms: "",
    location: "",
    country: "",
    latitude: "",
    longitude: "",
    banner_image: "",
    duration_days: "",
    perdiem_rate: "",
    perdiem_currency: "",
    registration_deadline: "",
  });

  const tenantSlug = params.slug as string;

  const fetchVendorHotels = useCallback(async () => {
    try {
      const hotels = await apiClient.request<{id: number, vendor_name: string, location: string, latitude?: string, longitude?: string}[]>(
        `/accommodation/vendor-accommodations`
      );
      setVendorHotels(hotels);
    } catch (error) {
      console.error("Fetch vendor hotels error:", error);
    }
  }, [apiClient]);

  const fetchAccommodationSetups = useCallback(async (vendorId: string) => {
    if (!vendorId) {
      setAccommodationSetups([]);
      return;
    }
    
    try {
      const setups = await apiClient.request<any[]>(
        `/accommodation/vendor-event-setups/${vendorId}`
      );
      
      // Filter out setups for events that have already ended
      const availableSetups = setups.filter(setup => {
        if (!setup.event_id) return true; // Unlinked setups are available
        
        const now = new Date();
        if (setup.event?.end_date) {
          const endDate = new Date(setup.event.end_date);
          return now <= endDate; // Include ongoing and upcoming events
        }
        return true;
      }).map(setup => ({
        id: setup.id,
        event_name: setup.event_name || 'Custom Setup',
        single_rooms: setup.single_rooms || 0,
        double_rooms: setup.double_rooms || 0
      }));
      
      setAccommodationSetups(availableSetups);
    } catch (error) {
      console.error(`Error fetching setups for vendor ${vendorId}:`, error);
      setAccommodationSetups([]);
    }
  }, [apiClient]);

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) {
      const diffTime = start.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { status: 'upcoming' as const, days_until_start: diffDays };
    } else if (now >= start && now <= end) {
      return { status: 'ongoing' as const, days_until_start: 0 };
    } else {
      return { status: 'ended' as const, days_until_start: 0 };
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      // Check if user is vetting-only using all_roles from user object
      const adminRoles = ['SUPER_ADMIN', 'MT_ADMIN', 'HR_ADMIN', 'EVENT_ADMIN'];
      const vettingRoles = ['VETTING_COMMITTEE', 'VETTING_APPROVER'];
      
      const hasAdminRole = adminRoles.includes(user?.role || '') ||
        (user?.all_roles && user.all_roles.some(role => adminRoles.includes(role)));
      const hasVettingRole = vettingRoles.includes(user?.role || '') ||
        (user?.all_roles && user.all_roles.some(role => vettingRoles.includes(role)));
      
      const isVettingOnlyUser = hasVettingRole && !hasAdminRole && !isTenantAdmin;
      
      let eventsData;
      
      if (isVettingOnlyUser) {
        // For vetting-only users, try to fetch assigned events, fallback to all events
        try {
          eventsData = await apiClient.request<Event[]>(
            `/vetting/user-assigned-events?tenant=${tenantSlug}`
          );
        } catch {
          console.warn('Vetting assigned events endpoint not available, falling back to all events');
          // Fallback to all events if vetting endpoint doesn't exist
          eventsData = await apiClient.request<Event[]>(
            `/events/?tenant=${tenantSlug}`
          );
        }
      } else {
        // For admins, fetch all events
        eventsData = await apiClient.request<Event[]>(
          `/events/?tenant=${tenantSlug}`
        );
      }

      const eventsWithCounts = await Promise.all(
        eventsData.map(async (event) => {
          try {
            const stats = await apiClient.request<EventStats>(
              `/event-registration/event/${event.id}/stats`
            );
            const eventStatusInfo = getEventStatus(event.start_date, event.end_date);
            return {
              ...event,
              participant_count: stats.total_registered,
              selected_count: stats.selected_count,
              checked_in_count: stats.checked_in_count || 0,
              tenant_name: tenantSlug,
              event_status: eventStatusInfo.status,
              days_until_start: eventStatusInfo.days_until_start,
            };
          } catch (error) {
            console.error(`Error fetching stats for event ${event.id}:`, error);
            const eventStatusInfo = getEventStatus(event.start_date, event.end_date);
            return {
              ...event,
              participant_count: 0,
              selected_count: 0,
              checked_in_count: 0,
              tenant_name: tenantSlug,
              event_status: eventStatusInfo.status,
              days_until_start: eventStatusInfo.days_until_start,
            };
          }
        })
      );
      setEvents(eventsWithCounts);
    } catch (error) {
      console.error("Fetch events error:", error);
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, [apiClient, tenantSlug, isTenantAdmin, user?.role, user?.all_roles]);

  const checkAccess = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const roles = await apiClient
        .request<UserRole[]>(`/user-roles/user/${user.id}`)
        .catch(() => []);
      const roleNames = roles.map((r) => r.role);
      if (user.role) {
        roleNames.push(user.role);
      }
      setUserRoles([...new Set(roleNames)]);

      // Check if user is tenant admin (owner) and get tenant data
      try {
        const tenant = await apiClient.request<{ admin_email: string; country?: string }>(`/tenants/slug/${tenantSlug}`);
        setIsTenantAdmin(tenant.admin_email === user.email);

        // Get timezone from country
        const timezone = getTimezoneFromCountry(tenant.country || '');
        setTenantData({ country: tenant.country, timezone });
      } catch {
        setIsTenantAdmin(false);
        setTenantData(null);
      }

      await fetchEvents();
      
      // Only fetch vendor hotels for users who can manage events
      if (isTenantAdmin || roleNames.some(role => 
        ["SUPER_ADMIN", "super_admin", "MT_ADMIN", "mt_admin", "HR_ADMIN", "hr_admin", "EVENT_ADMIN", "event_admin"].includes(role)
      )) {
        await fetchVendorHotels();
      }
    } catch (error) {
      console.error("Access check error:", error);
      toast.error("Failed to load events");
    }
  }, [user?.id, user?.email, user?.role, apiClient, fetchEvents, tenantSlug, fetchVendorHotels, isTenantAdmin]);

  useEffect(() => {
    if (!authLoading && user?.email) {
      checkAccess();
    }
  }, [user?.email, authLoading, checkAccess]);

  useEffect(() => {
    if (selectedVendorId) {
      fetchAccommodationSetups(selectedVendorId);
    }
  }, [selectedVendorId, fetchAccommodationSetups]);

  const canManageEvents = () => {
    return isTenantAdmin || userRoles.some((role) =>
      [
        "SUPER_ADMIN", "super_admin",
        "MT_ADMIN", "mt_admin", 
        "HR_ADMIN", "hr_admin",
        "EVENT_ADMIN", "event_admin"
      ].includes(role)
    );
  };
  
  const isVettingOnly = () => {
    return userRoles.length > 0 && 
      userRoles.every(role => ['vetting_committee', 'VETTING_COMMITTEE', 'vetting_approver', 'VETTING_APPROVER'].includes(role)) &&
      !isTenantAdmin;
  };

  // Layout for vetting-only users (topbar and footer, no sidebar)
  const VettingOnlyLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col min-h-screen">
      <Navbar showLogo={true} />
      <main className="flex-1 bg-gray-50 p-6">
        {children}
      </main>
      <SuperAdminFooter tenantName={tenantSlug} />
    </div>
  );

  const calculateDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return "";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays.toString();
  };

  const handleDateChange = (
    field: string,
    value: string
  ) => {
    const newFormData = { ...formData, [field]: value };
    if (field === "start_date" || field === "end_date") {
      newFormData.duration_days = calculateDuration(
        newFormData.start_date,
        newFormData.end_date
      );
      // Reset registration deadline if it's past the new start date
      if (field === "start_date" && newFormData.registration_deadline && new Date(newFormData.registration_deadline) > new Date(`${value}T23:59:59`)) {
        newFormData.registration_deadline = "";
      }
    }
    setFormData(newFormData);
  };

  const handleCreateEvent = async () => {
    if (
      !formData.title.trim() ||
      !formData.event_type.trim() ||
      !formData.start_date ||
      !formData.end_date ||
      !formData.registration_deadline ||
      !formData.vendor_accommodation_id ||
      !formData.expected_participants ||
      !formData.single_rooms ||
      !formData.double_rooms
    ) {
      toast.error("All fields including registration deadline and accommodation details are required");
      return;
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const registrationDeadline = formData.registration_deadline ? new Date(formData.registration_deadline) : null;

    if (startDate < today) {
      toast.error("Start date cannot be in the past");
      return;
    }

    if (endDate < startDate) {
      toast.error("End date cannot be before start date");
      return;
    }

    if (registrationDeadline && registrationDeadline > new Date(`${formData.start_date}T23:59:59`)) {
      toast.error("Registration deadline cannot be after the event start date");
      return;
    }

    try {
      setSubmitting(true);
      const eventData = {
        ...formData,
        duration_days: formData.duration_days
          ? parseInt(formData.duration_days)
          : null,
        perdiem_rate: formData.perdiem_rate
          ? parseFloat(formData.perdiem_rate)
          : null,
        latitude: formData.latitude?.trim() ? parseFloat(formData.latitude.trim()) : null,
        longitude: formData.longitude?.trim() ? parseFloat(formData.longitude.trim()) : null,
        registration_deadline: formData.registration_deadline ? `${formData.registration_deadline}:00` : null,
      };

      const newEvent = await apiClient.request<Event>(
        `/events/?tenant=${tenantSlug}`,
        {
          method: "POST",
          body: JSON.stringify(eventData),
        }
      );

      setShowCreateModal(false);
      setSelectedVendorId("");
      setAccommodationSetups([]);
      setFormData({
        title: "",
        description: "",
        event_type: "",
        status: "Draft",
        start_date: "",
        end_date: "",
        vendor_accommodation_id: "",
        expected_participants: "",
        single_rooms: "",
        double_rooms: "",
        location: "",
        country: "",
        latitude: "",
        longitude: "",
        banner_image: "",
        duration_days: "",
        perdiem_rate: "",
        perdiem_currency: "",
        registration_deadline: "",
      });

      await fetchEvents();

      // Show success toast and open modal
      toast.success("Event created successfully!");
      setDetailsEvent(newEvent);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Create event error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create event";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEvent = async () => {
    if (
      !selectedEvent ||
      !formData.title.trim() ||
      !formData.event_type.trim() ||
      !formData.vendor_accommodation_id ||
      !formData.expected_participants ||
      !formData.single_rooms ||
      !formData.double_rooms
    ) {
      toast.error("All fields including accommodation details are required");
      return;
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const registrationDeadline = formData.registration_deadline ? new Date(formData.registration_deadline) : null;

    if (startDate < today) {
      toast.error("Start date cannot be in the past");
      return;
    }

    if (endDate < startDate) {
      toast.error("End date cannot be before start date");
      return;
    }

    if (registrationDeadline && registrationDeadline > new Date(`${formData.start_date}T23:59:59`)) {
      toast.error("Registration deadline cannot be after the event start date");
      return;
    }

    try {
      setSubmitting(true);
      const eventData = {
        ...formData,
        duration_days: formData.duration_days
          ? parseInt(formData.duration_days)
          : null,
        perdiem_rate: formData.perdiem_rate
          ? parseFloat(formData.perdiem_rate)
          : null,
        latitude: formData.latitude?.trim() ? parseFloat(formData.latitude.trim()) : null,
        longitude: formData.longitude?.trim() ? parseFloat(formData.longitude.trim()) : null,
        registration_deadline: formData.registration_deadline || null,
      };

      // Send datetime with proper format for API
      const apiEventData = {
        ...eventData,
        registration_deadline: eventData.registration_deadline ? `${eventData.registration_deadline}:00` : null,
      };

    

      await apiClient.request(
        `/events/${selectedEvent.id}?tenant=${tenantSlug}`,
        {
          method: "PUT",
          body: JSON.stringify(apiEventData),
        }
      );

      setShowEditModal(false);
      setSelectedEvent(null);
      await fetchEvents();

      toast.success("Event updated successfully");
    } catch (updateError: any) {
     
      
      // Try to extract meaningful error message
      let errorMessage = "Failed to update event";
      
      try {
        if (updateError instanceof Error) {
          errorMessage = updateError.message;
        } else if (typeof updateError === 'string') {
          errorMessage = updateError;
        } else if (updateError && typeof updateError === 'object') {
          // Try different properties that might contain the error message
          if ('detail' in updateError) {
            errorMessage = typeof updateError.detail === 'string' ? updateError.detail : JSON.stringify(updateError.detail);
          } else if ('message' in updateError) {
            errorMessage = typeof updateError.message === 'string' ? updateError.message : JSON.stringify(updateError.message);
          } else if ('error' in updateError) {
            errorMessage = typeof updateError.error === 'string' ? updateError.error : JSON.stringify(updateError.error);
          } else {
            // Last resort: stringify the entire error object
            errorMessage = JSON.stringify(updateError, null, 2);
          }
        }
      } catch (stringifyError) {
        console.error("🔴 Error stringifying error:", stringifyError);
        errorMessage = "An unknown error occurred while updating the event";
      }
      
      console.error("🔴 Final error message:", errorMessage);
      toast.error(errorMessage.length > 200 ? errorMessage.substring(0, 200) + '...' : errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnpublishEvent = async (event: Event) => {
    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Unpublish Event?",
      text: `This will change "${event.title}" status back to Draft so you can delete it.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, unpublish it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);

      await apiClient.request(`/events/${event.id}?tenant=${tenantSlug}`, {
        method: "PUT",
        body: JSON.stringify({ ...event, status: "Draft" }),
      });

      await fetchEvents();

      toast.success("Event unpublished successfully");
    } catch (error) {
      console.error("Unpublish event error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to unpublish event";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Delete Event?",
      text: `This will delete "${event.title}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);

      await apiClient.request(`/events/${event.id}?tenant=${tenantSlug}`, {
        method: "DELETE",
      });

      await fetchEvents();

      toast.success("Event deleted successfully");
    } catch (error) {
      console.error("Delete event error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete event";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    const duration = calculateDuration(event.start_date, event.end_date);
    const vendorId = (event as any).vendor_accommodation_id?.toString() || "";
    
    setSelectedVendorId(vendorId);
    
    setFormData({
      title: event.title || "",
      description: event.description || "",
      event_type: event.event_type || "",
      status: event.status || "Draft",
      start_date: event.start_date || "",
      end_date: event.end_date || "",
      vendor_accommodation_id: vendorId,
      expected_participants: (event as any).expected_participants?.toString() || "",
      single_rooms: (event as any).single_rooms?.toString() || "",
      double_rooms: (event as any).double_rooms?.toString() || "",
      location: event.location || "",
      country: event.country || "",
      latitude: event.latitude?.toString() || "",
      longitude: event.longitude?.toString() || "",
      banner_image: event.banner_image || "",
      duration_days: duration,
      perdiem_rate: event.perdiem_rate?.toString() || "",
      perdiem_currency: event.perdiem_currency || "",
      registration_deadline: event.registration_deadline ? (
        event.registration_deadline.includes('T') 
          ? event.registration_deadline.substring(0, 16)
          : `${event.registration_deadline}T09:00`
      ) : "",
    });
    setShowEditModal(true);
  };

  const handleRegistrationForm = (event: Event) => {
    router.push(`/tenant/${tenantSlug}/events/${event.id}/registration-form`);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedEvent(null);
    setSelectedVendorId("");
    setAccommodationSetups([]);
    setFormData({
      title: "",
      description: "",
      event_type: "",
      status: "Draft",
      start_date: "",
      end_date: "",
      vendor_accommodation_id: "",
      expected_participants: "",
      single_rooms: "",
      double_rooms: "",
      location: "",
      country: "",
      latitude: "",
      longitude: "",
      banner_image: "",
      duration_days: "",
      perdiem_rate: "",
      perdiem_currency: "",
      registration_deadline: "",
    });
  };

  const exportEventsToCSV = (events: Event[]) => {
    const headers = [
      "Title",
      "Type",
      "Status",
      "Event Status",
      "Start Date",
      "End Date",
      "Duration",
      "Location",
      "Registered",
      "Selected",
      "Checked In",
      "Created By",
      "Created At"
    ];
    
    const csvData = [
      headers.join(","),
      ...events.map(event => [
        `"${event.title}"`,
        `"${event.event_type || ''}"`,
        `"${event.status}"`,
        `"${event.event_status || ''}"`,
        `"${new Date(event.start_date).toLocaleDateString()}"`,
        `"${new Date(event.end_date).toLocaleDateString()}"`,
        `"${event.duration_days || ''} days"`,
        `"${event.location || ''}"`,
        event.participant_count || 0,
        event.selected_count || 0,
        event.checked_in_count || 0,
        `"${event.created_by}"`,
        `"${event.created_at ? new Date(event.created_at).toLocaleDateString() : 'N/A'}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "events.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading || authLoading) {
    return <LoadingScreen message="Loading events..." />;
  }

  const getFilteredAndSortedEvents = () => {
    let filtered = events.filter(event => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        event.title.toLowerCase().includes(searchLower) ||
        (event.description && event.description.toLowerCase().includes(searchLower)) ||
        (event.event_type && event.event_type.toLowerCase().includes(searchLower)) ||
        (event.location && event.location.toLowerCase().includes(searchLower))
      );
    });
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.event_status === statusFilter);
    }
    
    return filtered.sort((a, b) => {
      const aValue = (a as unknown as Record<string, unknown>)[sortField];
      const bValue = (b as unknown as Record<string, unknown>)[sortField];
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;
      
      if (sortField === 'start_date' || sortField === 'end_date' || sortField === 'created_at') {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredEvents = getFilteredAndSortedEvents();
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage);

  // Use different layout based on user type
  const Layout = isVettingOnly() ? VettingOnlyLayout : DashboardLayout;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Events Management</h1>
                <p className="text-sm text-gray-600">Manage events for your organization</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className={viewMode === 'card' ? 'h-7 px-2 bg-white shadow-sm text-xs' : 'h-7 px-2 hover:bg-gray-200 text-xs'}
                >
                  <Grid3X3 className="w-3 h-3" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'h-7 px-2 bg-white shadow-sm text-xs' : 'h-7 px-2 hover:bg-gray-200 text-xs'}
                >
                  <List className="w-3 h-3" />
                </Button>
              </div>
              {canManageEvents() && !isVettingOnly() && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-8 px-4 text-xs"
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Create Event
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setStatusFilter('upcoming'); setCurrentPage(1); }}
            className={statusFilter === 'upcoming' ? 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-blue-100 text-blue-900' : 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100'}
          >
            <Clock className="w-3 h-3" />
            <span className="text-xs font-medium">
              Upcoming: {events.filter(e => e.event_status === 'upcoming').length}
            </span>
          </button>
          <button
            onClick={() => { setStatusFilter('ongoing'); setCurrentPage(1); }}
            className={statusFilter === 'ongoing' ? 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-green-100 text-green-900' : 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-green-50 text-green-700 hover:bg-green-100'}
          >
            <Play className="w-3 h-3" />
            <span className="text-xs font-medium">
              Ongoing: {events.filter(e => e.event_status === 'ongoing').length}
            </span>
          </button>
          <button
            onClick={() => { setStatusFilter('ended'); setCurrentPage(1); }}
            className={statusFilter === 'ended' ? 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-gray-100 text-gray-900' : 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-gray-50 text-gray-700 hover:bg-gray-100'}
          >
            <CheckCircle className="w-3 h-3" />
            <span className="text-xs font-medium">
              Ended: {events.filter(e => e.event_status === 'ended').length}
            </span>
          </button>
          <button
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
            className={statusFilter === 'all' ? 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-red-100 text-red-900' : 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-gray-50 text-gray-700 hover:bg-gray-100'}
          >
            <Calendar className="w-3 h-3" />
            <span className="text-xs font-medium">
              All: {events.length}
            </span>
          </button>
        </div>

        {viewMode === 'list' && (
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-xs border-gray-200"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportEventsToCSV(filteredEvents)} 
              className="h-8 px-3 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Export CSV
            </Button>
          </div>
        )}

        {filteredEvents.length > 0 ? (
          <>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {paginatedEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    canManageEvents={canManageEvents()} 
                    isVettingCommitteeOnly={userRoles.some(role => ['vetting_committee', 'VETTING_COMMITTEE'].includes(role)) && isVettingOnly()}
                    isApproverOnly={userRoles.some(role => ['vetting_approver', 'VETTING_APPROVER'].includes(role)) && isVettingOnly()}
                    onEdit={(e) => openEditModal(e)} 
                    onDelete={(e) => handleDeleteEvent(e)} 
                    onUnpublish={canManageEvents() ? (e) => handleUnpublishEvent(e) : undefined}
                    onViewDetails={(e) => { setDetailsEvent(e); setShowDetailsModal(true); }} 
                    onRegistrationForm={(e) => handleRegistrationForm(e)}
                  />
                ))}
              </div>
            ) : (
              <EventTable
                data={paginatedEvents}
                canManageEvents={canManageEvents()}
                onEdit={(e) => openEditModal(e)}
                onDelete={(e) => handleDeleteEvent(e)}
                onUnpublish={canManageEvents() ? (e) => handleUnpublishEvent(e) : undefined}
                onViewDetails={(e) => { setDetailsEvent(e); setShowDetailsModal(true); }}
                onRegistrationForm={canManageEvents() && !isVettingOnly() ? (e) => handleRegistrationForm(e) : undefined}
                sortField={sortField as any}
                sortDirection={sortDirection}
                onSort={(field) => {
                  if (sortField === field) {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField(field as keyof Event | string);
                    setSortDirection('desc');
                  }
                }}
              />
            )}
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-xs font-medium text-gray-900 mb-1">
              No {statusFilter === 'all' ? '' : statusFilter} events found
            </h3>
            <p className="text-xs text-gray-600">
              {statusFilter === 'all' 
                ? canManageEvents() ? "Get started by creating your first event" : "No events have been created yet"
                : "No " + statusFilter + " events at the moment"
              }
            </p>
          </div>
        )}
      </div>

      <EventFormModal
        isOpen={showCreateModal}
        onClose={closeModals}
        onSubmit={handleCreateEvent}
        formData={formData}
        setFormData={setFormData}
        vendorHotels={vendorHotels}
        setSelectedVendorId={setSelectedVendorId}
        handleDateChange={handleDateChange}
        submitting={submitting}
        tenantData={tenantData}
        isEdit={false}
      />

      <EventFormModal
        isOpen={showEditModal}
        onClose={closeModals}
        onSubmit={handleEditEvent}
        formData={formData}
        setFormData={setFormData}
        vendorHotels={vendorHotels}
        setSelectedVendorId={setSelectedVendorId}
        handleDateChange={handleDateChange}
        submitting={submitting}
        tenantData={tenantData}
        isEdit={true}
      />

      <EventDetailsModal
        event={detailsEvent}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setDetailsEvent(null);
        }}
        tenantSlug={tenantSlug}
        canManageEvents={canManageEvents()}
      />
    </Layout>
  );
}