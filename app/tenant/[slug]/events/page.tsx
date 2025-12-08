"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";

// Dynamically import CKEditor with SSR disabled
const CKEditor = dynamic(() => import("@ckeditor/ckeditor5-react").then(mod => ({ default: mod.CKEditor })), { ssr: false });
import {
  Calendar,
  Plus,
  Loader2,
  Clock,
  Play,
  CheckCircle,
  Grid3X3,
  List,
  Search,
  Download,
  Save,
  X,
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
  const [editorLoaded, setEditorLoaded] = useState(false);
  const editorRef = useRef<any>(null);
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
  const [submitting, setSubmitting] = useState(false);
  const [vendorHotels, setVendorHotels] = useState<{id: number, vendor_name: string, location: string, latitude?: string, longitude?: string}[]>([]);
  const [, setAccommodationSetups] = useState<{id: number, event_name: string, single_rooms: number, double_rooms: number}[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");

  const tenantSlug = params.slug as string;

  // Load CKEditor on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@ckeditor/ckeditor5-build-classic')
        .then((module) => {
          editorRef.current = module.default;
          setEditorLoaded(true);
        })
        .catch((error) => {
          console.error('Error loading CKEditor:', error);
        });
    }
  }, []);

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
      const eventsData = await apiClient.request<Event[]>(
        `/events/?tenant=${tenantSlug}`
      );

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
  }, [apiClient, tenantSlug]);

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

      await Promise.all([fetchEvents(), fetchVendorHotels()]);
    } catch (error) {
      console.error("Access check error:", error);
      toast.error("Failed to load events");
    }
  }, [user?.id, user?.role, user?.email, apiClient, fetchEvents, tenantSlug]);

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
    // Tenant admins can only view, not manage
    if (isTenantAdmin && !userRoles.some(role => ["SUPER_ADMIN", "super_admin"].includes(role))) {
      return false;
    }
    return userRoles.some((role) =>
      [
        "SUPER_ADMIN",
        "super_admin",
        "MT_ADMIN",
        "mt_admin",
        "HR_ADMIN",
        "hr_admin",
        "EVENT_ADMIN",
        "event_admin",
      ].includes(role)
    );
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return "";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays.toString();
  };

  const handleDateChange = (
    field: "start_date" | "end_date" | "registration_deadline",
    value: string
  ) => {
    const newFormData = { ...formData, [field]: value };
    if (field === "start_date" || field === "end_date") {
      newFormData.duration_days = calculateDuration(
        newFormData.start_date,
        newFormData.end_date
      );
      // Reset registration deadline if it's past the new start date
      if (field === "start_date" && newFormData.registration_deadline && new Date(newFormData.registration_deadline) > new Date(value)) {
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

    if (registrationDeadline && registrationDeadline > startDate) {
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
        latitude: formData.latitude && formData.latitude.trim()
          ? parseFloat(formData.latitude)
          : null,
        longitude: formData.longitude && formData.longitude.trim()
          ? parseFloat(formData.longitude)
          : null,
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

    if (startDate < today) {
      toast.error("Start date cannot be in the past");
      return;
    }

    if (endDate < startDate) {
      toast.error("End date cannot be before start date");
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
        latitude: formData.latitude && formData.latitude.trim() 
          ? parseFloat(formData.latitude) 
          : null,
        longitude: formData.longitude && formData.longitude.trim() 
          ? parseFloat(formData.longitude) 
          : null,
      };

      await apiClient.request(
        `/events/${selectedEvent.id}?tenant=${tenantSlug}`,
        {
          method: "PUT",
          body: JSON.stringify(eventData),
        }
      );

      setShowEditModal(false);
      setSelectedEvent(null);
      await fetchEvents();

      toast.success("Event updated successfully");
    } catch (error) {
      console.error("Update event error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update event";
      toast.error(errorMessage);
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
      registration_deadline: event.registration_deadline || "",
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-sm font-medium text-gray-900 mb-1">Events Management</h1>
              <p className="text-xs text-gray-600">
                Manage events for your organization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className={viewMode === 'card' ? 'h-8 px-3 bg-white shadow-sm text-xs' : 'h-8 px-3 hover:bg-gray-200 text-xs'}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'h-8 px-3 bg-white shadow-sm text-xs' : 'h-8 px-3 hover:bg-gray-200 text-xs'}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              {canManageEvents() && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white h-9 px-4 text-xs font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create Event
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => { setStatusFilter('upcoming'); setCurrentPage(1); }}
              className={statusFilter === 'upcoming' ? 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-blue-100 text-blue-900' : 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100'}
            >
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">
                Upcoming: {events.filter(e => e.event_status === 'upcoming').length}
              </span>
            </button>
            <button
              onClick={() => { setStatusFilter('ongoing'); setCurrentPage(1); }}
              className={statusFilter === 'ongoing' ? 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-green-100 text-green-900' : 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-green-50 text-green-700 hover:bg-green-100'}
            >
              <Play className="w-4 h-4" />
              <span className="text-xs font-medium">
                Ongoing: {events.filter(e => e.event_status === 'ongoing').length}
              </span>
            </button>
            <button
              onClick={() => { setStatusFilter('ended'); setCurrentPage(1); }}
              className={statusFilter === 'ended' ? 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-gray-100 text-gray-900' : 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-gray-50 text-gray-700 hover:bg-gray-100'}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">
                Ended: {events.filter(e => e.event_status === 'ended').length}
              </span>
            </button>
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={statusFilter === 'all' ? 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-red-100 text-red-900' : 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-gray-50 text-gray-700 hover:bg-gray-100'}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">
                All: {events.length}
              </span>
            </button>
          </div>

          {viewMode === 'list' && (
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-xs border-gray-200"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportEventsToCSV(filteredEvents)} 
                className="gap-2 text-xs"
              >
                <Download className="w-4 h-4" />
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
                      onEdit={(e) => openEditModal(e)} 
                      onDelete={(e) => handleDeleteEvent(e)} 
                      onUnpublish={canManageEvents() ? (e) => handleUnpublishEvent(e) : undefined}
                      onViewDetails={(e) => { setDetailsEvent(e); setShowDetailsModal(true); }} 
                      onRegistrationForm={canManageEvents() ? (e) => handleRegistrationForm(e) : undefined}
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
                  onRegistrationForm={canManageEvents() ? (e) => handleRegistrationForm(e) : undefined}
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
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xs font-medium text-gray-900 mb-2">
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

        <Dialog open={showCreateModal} onOpenChange={closeModals}>
          <DialogContent className="sm:max-w-[900px] bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
            {/* Header without gradient - matching vendor hotels */}
            <div className="p-6 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">Create New Event</DialogTitle>
                  <p className="text-gray-600 text-sm mt-1">Set up a new event for your organization</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto modal-scrollbar">
              <div className="p-8 pb-0">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Event Title - Takes 2 columns */}
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                        Event Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter event title"
                        required
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Event Type - 1 column */}
                    <div className="space-y-2">
                      <Label htmlFor="event_type" className="text-sm font-medium text-gray-700">
                        Event Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.event_type}
                        onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Conference">Conference</SelectItem>
                          <SelectItem value="Workshop">Workshop</SelectItem>
                          <SelectItem value="Training">Training</SelectItem>
                          <SelectItem value="Meeting">Meeting</SelectItem>
                          <SelectItem value="Seminar">Seminar</SelectItem>
                          <SelectItem value="Webinar">Webinar</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description - Full width with CKEditor */}
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                      Description
                    </Label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden [&_.ck-editor__editable]:min-h-[250px] [&_.ck-editor__editable]:p-4 [&_.ck-editor__top]:bg-gray-50 [&_.ck-editor__top]:border-b [&_.ck-editor__top]:border-gray-300 [&_.ck.ck-toolbar]:border-none [&_.ck-editor__editable]:focus:border-blue-500 [&_.ck-editor__editable]:focus:ring-1 [&_.ck-editor__editable]:focus:ring-blue-500">
                      {editorLoaded && editorRef.current ? (
                        <CKEditor
                          editor={editorRef.current}
                          data={formData.description}
                          onChange={(event: any, editor: any) => {
                            const data = editor.getData();
                            setFormData({ ...formData, description: data });
                          }}
                          config={{
                            placeholder: "Describe the event, its purpose, and what participants can expect...",
                            toolbar: [
                              'heading', '|',
                              'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
                              'outdent', 'indent', '|',
                              'blockQuote', 'undo', 'redo'
                            ]
                          }}
                        />
                      ) : (
                        <div className="min-h-[250px] flex items-center justify-center text-gray-400">
                          Loading editor...
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Use rich formatting to make your description more engaging</p>
                  </div>

                  {/* Venue and Accommodation Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="vendor_accommodation_id" className="text-sm font-medium text-gray-700">
                        Venue (Hotel) <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.vendor_accommodation_id}
                        onValueChange={(value) => {
                          const selectedHotel = vendorHotels.find(h => h.id.toString() === value);
                          setSelectedVendorId(value);
                          setFormData({
                            ...formData,
                            vendor_accommodation_id: value,
                            location: selectedHotel?.location || "",
                            latitude: selectedHotel?.latitude || "",
                            longitude: selectedHotel?.longitude || ""
                          });
                        }}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select venue hotel" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendorHotels.map((hotel) => (
                            <SelectItem key={hotel.id} value={hotel.id.toString()}>
                              {hotel.vendor_name} - {hotel.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expected_participants" className="text-sm font-medium text-gray-700">
                        Expected Participants <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="expected_participants"
                        type="number"
                        value={formData.expected_participants}
                        onChange={(e) => setFormData({ ...formData, expected_participants: e.target.value })}
                        placeholder="Enter expected number of participants"
                        required
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Room Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="single_rooms" className="text-sm font-medium text-gray-700">
                        Single Rooms <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="single_rooms"
                        type="number"
                        value={formData.single_rooms}
                        onChange={(e) => setFormData({ ...formData, single_rooms: e.target.value })}
                        placeholder="Number of single rooms needed"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="double_rooms" className="text-sm font-medium text-gray-700">
                        Double Rooms <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="double_rooms"
                        type="number"
                        value={formData.double_rooms}
                        onChange={(e) => setFormData({ ...formData, double_rooms: e.target.value })}
                        placeholder="Number of double rooms needed"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-sm font-medium text-gray-700">
                      Start Date {tenantData?.timezone && <span className="text-gray-500 ml-1">({tenantData.timezone})</span>} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) =>
                        handleDateChange("start_date", e.target.value)
                      }
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-sm font-medium text-gray-700">
                      End Date {tenantData?.timezone && <span className="text-gray-500 ml-1">({tenantData.timezone})</span>} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                      onChange={(e) =>
                        handleDateChange("end_date", e.target.value)
                      }
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration_deadline" className="text-sm font-medium text-gray-700">
                      Registration Deadline
                    </Label>
                    <Input
                      id="registration_deadline"
                      type="date"
                      value={formData.registration_deadline}
                      max={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, registration_deadline: e.target.value })
                      }
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_days" className="text-sm font-medium text-gray-700">
                      Duration (Days)
                    </Label>
                    <Input
                      id="duration_days"
                      value={formData.duration_days}
                      readOnly
                      className="bg-gray-50 border-gray-300"
                      placeholder="Auto-calculated"
                    />
                  </div>
                </div>

                {formData.vendor_accommodation_id && (
                  <div className="bg-gray-50 p-4 rounded-lg mt-6 border border-gray-200">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Selected Configuration
                    </Label>
                    <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p><strong>Hotel:</strong> {vendorHotels.find(h => h.id.toString() === formData.vendor_accommodation_id)?.vendor_name}</p>
                        <p><strong>Location:</strong> {formData.location}</p>
                      </div>
                      <div>
                        <p><strong>Expected Participants:</strong> {formData.expected_participants || 'Not set'}</p>
                        <p><strong>Room Allocation:</strong> {formData.single_rooms || 0} single, {formData.double_rooms || 0} double rooms</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  <Label htmlFor="banner_image" className="text-sm font-medium text-gray-700">
                    Banner Image URL
                  </Label>
                  <Input
                    id="banner_image"
                    value={formData.banner_image}
                    onChange={(e) =>
                      setFormData({ ...formData, banner_image: e.target.value })
                    }
                    placeholder="https://example.com/banner.jpg"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="mt-6 space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Action Buttons - Sticky at bottom */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50/50">
              <Button
                type="button"
                variant="outline"
                onClick={closeModals}
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium hover:bg-white transition-all"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleCreateEvent}
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Event...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Event
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditModal} onOpenChange={closeModals}>
          <DialogContent className="sm:max-w-[900px] bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
            {/* Header without gradient - matching vendor hotels */}
            <div className="p-6 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">Edit Event</DialogTitle>
                  <p className="text-gray-600 text-sm mt-1">Update the event details below</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto modal-scrollbar">
              <div className="p-8 pb-0">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Event Title - Takes 2 columns */}
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="edit_title" className="text-sm font-medium text-gray-700">
                        Event Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit_title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter event title"
                        required
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Event Type - 1 column */}
                    <div className="space-y-2">
                      <Label htmlFor="edit_event_type" className="text-sm font-medium text-gray-700">
                        Event Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.event_type}
                        onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Conference">Conference</SelectItem>
                          <SelectItem value="Workshop">Workshop</SelectItem>
                          <SelectItem value="Training">Training</SelectItem>
                          <SelectItem value="Meeting">Meeting</SelectItem>
                          <SelectItem value="Seminar">Seminar</SelectItem>
                          <SelectItem value="Webinar">Webinar</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description - Full width with CKEditor */}
                  <div>
                    <Label htmlFor="edit_description" className="text-sm font-medium text-gray-700 mb-2 block">
                      Description
                    </Label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden [&_.ck-editor__editable]:min-h-[250px] [&_.ck-editor__editable]:p-4 [&_.ck-editor__top]:bg-gray-50 [&_.ck-editor__top]:border-b [&_.ck-editor__top]:border-gray-300 [&_.ck.ck-toolbar]:border-none [&_.ck-editor__editable]:focus:border-blue-500 [&_.ck-editor__editable]:focus:ring-1 [&_.ck-editor__editable]:focus:ring-blue-500">
                      {editorLoaded && editorRef.current ? (
                        <CKEditor
                          editor={editorRef.current}
                          data={formData.description}
                          onChange={(event: any, editor: any) => {
                            const data = editor.getData();
                            setFormData({ ...formData, description: data });
                          }}
                          config={{
                            placeholder: "Describe the event, its purpose, and what participants can expect...",
                            toolbar: [
                              'heading', '|',
                              'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
                              'outdent', 'indent', '|',
                              'blockQuote', 'undo', 'redo'
                            ]
                          }}
                        />
                      ) : (
                        <div className="min-h-[250px] flex items-center justify-center text-gray-400">
                          Loading editor...
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Use rich formatting to make your description more engaging</p>
                  </div>

                  {/* Venue and Accommodation Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit_vendor_accommodation_id" className="text-sm font-medium text-gray-700">
                        Venue (Hotel) <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.vendor_accommodation_id}
                        onValueChange={(value) => {
                          const selectedHotel = vendorHotels.find(h => h.id.toString() === value);
                          setSelectedVendorId(value);
                          setFormData({
                            ...formData,
                            vendor_accommodation_id: value,
                            location: selectedHotel?.location || "",
                            latitude: selectedHotel?.latitude || "",
                            longitude: selectedHotel?.longitude || ""
                          });
                        }}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select venue hotel" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendorHotels.map((hotel) => (
                            <SelectItem key={hotel.id} value={hotel.id.toString()}>
                              {hotel.vendor_name} - {hotel.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_expected_participants" className="text-sm font-medium text-gray-700">
                        Expected Participants <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit_expected_participants"
                        type="number"
                        value={formData.expected_participants}
                        onChange={(e) => setFormData({ ...formData, expected_participants: e.target.value })}
                        placeholder="Enter expected number of participants"
                        required
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Room Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit_single_rooms" className="text-sm font-medium text-gray-700">
                        Single Rooms <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit_single_rooms"
                        type="number"
                        value={formData.single_rooms}
                        onChange={(e) => setFormData({ ...formData, single_rooms: e.target.value })}
                        placeholder="Number of single rooms needed"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_double_rooms" className="text-sm font-medium text-gray-700">
                        Double Rooms <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit_double_rooms"
                        type="number"
                        value={formData.double_rooms}
                        onChange={(e) => setFormData({ ...formData, double_rooms: e.target.value })}
                        placeholder="Number of double rooms needed"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit_start_date" className="text-sm font-medium text-gray-700">
                      Start Date {tenantData?.timezone && <span className="text-gray-500 ml-1">({tenantData.timezone})</span>} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit_start_date"
                      type="date"
                      value={formData.start_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleDateChange("start_date", e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_end_date" className="text-sm font-medium text-gray-700">
                      End Date {tenantData?.timezone && <span className="text-gray-500 ml-1">({tenantData.timezone})</span>} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit_end_date"
                      type="date"
                      value={formData.end_date}
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleDateChange("end_date", e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_registration_deadline" className="text-sm font-medium text-gray-700">
                      Registration Deadline
                    </Label>
                    <Input
                      id="edit_registration_deadline"
                      type="date"
                      value={formData.registration_deadline}
                      max={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_duration_days" className="text-sm font-medium text-gray-700">
                      Duration (Days)
                    </Label>
                    <Input
                      id="edit_duration_days"
                      value={formData.duration_days}
                      readOnly
                      className="bg-gray-50 border-gray-300"
                      placeholder="Auto-calculated"
                    />
                  </div>
                </div>

                {formData.vendor_accommodation_id && (
                  <div className="bg-gray-50 p-4 rounded-lg mt-6 border border-gray-200">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Selected Configuration
                    </Label>
                    <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p><strong>Hotel:</strong> {vendorHotels.find(h => h.id.toString() === formData.vendor_accommodation_id)?.vendor_name}</p>
                        <p><strong>Location:</strong> {formData.location}</p>
                      </div>
                      <div>
                        <p><strong>Expected Participants:</strong> {formData.expected_participants || 'Not set'}</p>
                        <p><strong>Room Allocation:</strong> {formData.single_rooms || 0} single, {formData.double_rooms || 0} double rooms</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  <Label htmlFor="edit_banner_image" className="text-sm font-medium text-gray-700">
                    Banner Image URL
                  </Label>
                  <Input
                    id="edit_banner_image"
                    value={formData.banner_image}
                    onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="mt-6 space-y-2">
                  <Label htmlFor="edit_status" className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Action Buttons - Sticky at bottom */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50/50">
              <Button
                type="button"
                variant="outline"
                onClick={closeModals}
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium hover:bg-white transition-all"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleEditEvent}
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Event...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Event
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
      </div>
    </DashboardLayout>
  );
}