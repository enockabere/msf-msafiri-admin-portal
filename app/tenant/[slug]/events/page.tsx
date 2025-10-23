"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import EventDetailsModal from "./EventDetailsModal";
import { EventCard } from "./components/EventCard";
import { EventTable } from "./components/EventTable";
import { toast } from "@/hooks/use-toast";
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

export default function TenantEventsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [events, setEvents] = useState<Event[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  const [tenantData, setTenantData] = useState<{ country?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'ended'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 8;
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('start_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "",
    status: "Draft",
    start_date: "",
    end_date: "",
    vendor_accommodation_id: "",
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
  const [vendorEventSetups, setVendorEventSetups] = useState<{id: number, event_name: string, vendor_name: string, vendor_id: number}[]>([]);
  const [customTitle, setCustomTitle] = useState("");
  const [showCustomTitle, setShowCustomTitle] = useState(false);

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

  const fetchVendorEventSetups = useCallback(async () => {
    try {
      const allSetups: {id: number, event_name: string, vendor_name: string}[] = [];
      
      for (const hotel of vendorHotels) {
        try {
          const setups = await apiClient.request<any[]>(
            `/accommodation/vendor-event-setups/${hotel.id}`
          );
          
          const availableSetups = setups.filter(setup => {
            // Only include setups that are not linked to events that have started or ended
            if (!setup.event_id) return true; // Custom events are always available
            
            const now = new Date();
            if (setup.event?.start_date) {
              const startDate = new Date(setup.event.start_date);
              return now < startDate; // Only upcoming events
            }
            return true;
          }).map(setup => ({
            id: setup.id,
            event_name: setup.event?.title || setup.event_name || 'Custom Event',
            vendor_name: hotel.vendor_name,
            vendor_id: hotel.id
          }));
          
          allSetups.push(...availableSetups);
        } catch (error) {
          console.error(`Error fetching setups for hotel ${hotel.id}:`, error);
        }
      }
      
      setVendorEventSetups(allSetups);
    } catch (error) {
      console.error("Fetch vendor event setups error:", error);
    }
  }, [apiClient, vendorHotels]);

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
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
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
        setTenantData({ country: tenant.country });
      } catch {
        setIsTenantAdmin(false);
        setTenantData(null);
      }

      await Promise.all([fetchEvents(), fetchVendorHotels()]);
    } catch (error) {
      console.error("Access check error:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    }
  }, [user?.id, user?.role, user?.email, apiClient, fetchEvents, tenantSlug]);

  useEffect(() => {
    if (!authLoading && user?.email) {
      checkAccess();
    }
  }, [user?.email, authLoading, checkAccess]);

  useEffect(() => {
    if (vendorHotels.length > 0) {
      fetchVendorEventSetups();
    }
  }, [vendorHotels, fetchVendorEventSetups]);

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
      !formData.vendor_accommodation_id
    ) {
      toast({
        title: "Error",
        description: "Title, event type, venue, start date, and end date are required",
        variant: "destructive",
      });
      return;
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const registrationDeadline = formData.registration_deadline ? new Date(formData.registration_deadline) : null;

    if (startDate < today) {
      toast({
        title: "Error",
        description: "Start date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: "Error",
        description: "End date cannot be before start date",
        variant: "destructive",
      });
      return;
    }

    if (registrationDeadline && registrationDeadline > startDate) {
      toast({
        title: "Error",
        description: "Registration deadline cannot be after the event start date",
        variant: "destructive",
      });
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
      setShowCustomTitle(false);
      setCustomTitle("");
      setFormData({
        title: "",
        description: "",
        event_type: "",
        status: "Draft",
        start_date: "",
        end_date: "",
        vendor_accommodation_id: "",
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

      setDetailsEvent(newEvent);
      setShowDetailsModal(true);

      toast({
        title: "Success",
        description: "Event created successfully",
      });
    } catch (error) {
      console.error("Create event error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create event";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEvent = async () => {
    if (
      !selectedEvent ||
      !formData.title.trim() ||
      !formData.event_type.trim() ||
      !formData.vendor_accommodation_id
    ) {
      toast({
        title: "Error",
        description: "Title, event type, and venue are required",
        variant: "destructive",
      });
      return;
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (startDate < today) {
      toast({
        title: "Error",
        description: "Start date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: "Error",
        description: "End date cannot be before start date",
        variant: "destructive",
      });
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

      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    } catch (error) {
      console.error("Update event error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update event";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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

      toast({
        title: "Success",
        description: "Event unpublished successfully",
      });
    } catch (error) {
      console.error("Unpublish event error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to unpublish event";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error) {
      console.error("Delete event error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete event";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    const duration = calculateDuration(event.start_date, event.end_date);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type || "",
      status: event.status || "Draft",
      start_date: event.start_date,
      end_date: event.end_date,
      vendor_accommodation_id: (event as any).vendor_accommodation_id?.toString() || "",
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
    setShowCustomTitle(false);
    setCustomTitle("");
    setFormData({
      title: "",
      description: "",
      event_type: "",
      status: "Draft",
      start_date: "",
      end_date: "",
      vendor_accommodation_id: "",
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
      const aValue = a[sortField];
      const bValue = b[sortField];
      
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
              <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
              <p className="text-gray-600">
                Manage events for your organization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className={viewMode === 'card' ? 'h-8 px-3 bg-white shadow-sm' : 'h-8 px-3 hover:bg-gray-200'}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'h-8 px-3 bg-white shadow-sm' : 'h-8 px-3 hover:bg-gray-200'}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              {canManageEvents() && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white h-9 px-4 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create Event
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={statusFilter === 'all' ? 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-red-100 text-red-900' : 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-gray-50 text-gray-700 hover:bg-gray-100'}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                All: {events.length}
              </span>
            </button>
            <button
              onClick={() => { setStatusFilter('ongoing'); setCurrentPage(1); }}
              className={statusFilter === 'ongoing' ? 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-green-100 text-green-900' : 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-green-50 text-green-700 hover:bg-green-100'}
            >
              <Play className="w-4 h-4" />
              <span className="text-sm font-medium">
                Ongoing: {events.filter(e => e.event_status === 'ongoing').length}
              </span>
            </button>
            <button
              onClick={() => { setStatusFilter('upcoming'); setCurrentPage(1); }}
              className={statusFilter === 'upcoming' ? 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-blue-100 text-blue-900' : 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100'}
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Upcoming: {events.filter(e => e.event_status === 'upcoming').length}
              </span>
            </button>
            <button
              onClick={() => { setStatusFilter('ended'); setCurrentPage(1); }}
              className={statusFilter === 'ended' ? 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-gray-100 text-gray-900' : 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-gray-50 text-gray-700 hover:bg-gray-100'}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Ended: {events.filter(e => e.event_status === 'ended').length}
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
                  className="pl-10 h-9 text-sm border-gray-200"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportEventsToCSV(filteredEvents)} 
                className="gap-2"
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
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={(field) => {
                    if (sortField === field) {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField(field as keyof Event);
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No {statusFilter === 'all' ? '' : statusFilter} events found
              </h3>
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? canManageEvents() ? "Get started by creating your first event" : "No events have been created yet"
                  : "No " + statusFilter + " events at the moment"
                }
              </p>
            </div>
          )}


        </div>

        <Dialog open={showCreateModal} onOpenChange={closeModals}>
          <DialogContent className="w-[98vw] sm:w-[95vw] lg:w-[90vw] xl:w-[85vw] h-[90vh] max-w-[98vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] overflow-y-auto bg-white border shadow-lg">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new event for your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title" className="mb-2 block">
                    Event Title *
                  </Label>
                  <Select
                    value={formData.title}
                    onValueChange={(value) => {
                      if (value === "other") {
                        setFormData({ ...formData, title: "", vendor_accommodation_id: "" });
                        setCustomTitle("");
                        setShowCustomTitle(true);
                      } else {
                        const selectedSetup = vendorEventSetups.find(setup => setup.event_name === value);
                        if (selectedSetup) {
                          const selectedHotel = vendorHotels.find(h => h.id === selectedSetup.vendor_id);
                          setFormData({ 
                            ...formData, 
                            title: value,
                            vendor_accommodation_id: selectedSetup.vendor_id.toString(),
                            location: selectedHotel?.location || "",
                            latitude: selectedHotel?.latitude || "",
                            longitude: selectedHotel?.longitude || ""
                          });
                        } else {
                          setFormData({ ...formData, title: value });
                        }
                        setCustomTitle("");
                        setShowCustomTitle(false);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event title or choose Other" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorEventSetups.map((setup) => (
                        <SelectItem key={setup.id} value={setup.event_name}>
                          {setup.event_name} ({setup.vendor_name})
                        </SelectItem>
                      ))}
                      <SelectItem value="other">
                        Other (specify custom name)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {showCustomTitle && (
                    <div className="mt-2">
                      <Input
                        value={customTitle}
                        onChange={(e) => {
                          setCustomTitle(e.target.value);
                          setFormData({ ...formData, title: e.target.value });
                        }}
                        placeholder="Enter custom event title"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="event_type" className="mb-2 block">
                    Event Type *
                  </Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, event_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
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
              
              <div>
                <Label htmlFor="description" className="mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter event description"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="vendor_accommodation_id" className="mb-2 block">
                  Venue (Hotel) *
                </Label>
                <Select
                  value={formData.vendor_accommodation_id}
                  onValueChange={(value) => {
                    const selectedHotel = vendorHotels.find(h => h.id.toString() === value);
                    setFormData({ 
                      ...formData, 
                      vendor_accommodation_id: value,
                      location: selectedHotel?.location || "",
                      latitude: selectedHotel?.latitude || "",
                      longitude: selectedHotel?.longitude || ""
                    });
                  }}
                >
                  <SelectTrigger>
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
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="start_date" className="mb-2 block">
                    Start Date *
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) =>
                      handleDateChange("start_date", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="end_date" className="mb-2 block">
                    End Date *
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    onChange={(e) =>
                      handleDateChange("end_date", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="registration_deadline" className="mb-2 block">
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
                  />
                </div>
                <div>
                  <Label htmlFor="duration_days" className="mb-2 block">
                    Duration (Days)
                  </Label>
                  <Input
                    id="duration_days"
                    value={formData.duration_days}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>

              {formData.vendor_accommodation_id && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="mb-2 block text-sm font-medium text-gray-700">
                    Selected Venue Details
                  </Label>
                  <div className="text-sm text-gray-600">
                    <p><strong>Hotel:</strong> {vendorHotels.find(h => h.id.toString() === formData.vendor_accommodation_id)?.vendor_name}</p>
                    <p><strong>Location:</strong> {formData.location}</p>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="banner_image" className="mb-2 block">
                  Banner Image URL
                </Label>
                <Input
                  id="banner_image"
                  value={formData.banner_image}
                  onChange={(e) =>
                    setFormData({ ...formData, banner_image: e.target.value })
                  }
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="perdiem_rate" className="mb-2 block">
                    Per Diem Rate
                  </Label>
                  <Input
                    id="perdiem_rate"
                    type="number"
                    value={formData.perdiem_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, perdiem_rate: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="perdiem_currency" className="mb-2 block">
                    Currency
                  </Label>
                  <Select
                    value={formData.perdiem_currency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, perdiem_currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CHF">CHF</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status" className="mb-2 block">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
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
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={closeModals}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateEvent}
                disabled={submitting}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditModal} onOpenChange={closeModals}>
          <DialogContent className="w-[98vw] sm:w-[95vw] lg:w-[90vw] xl:w-[85vw] h-[90vh] max-w-[98vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] overflow-y-auto bg-white border shadow-lg">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update the event details below to modify the existing event.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit_title" className="mb-2 block">
                    Event Title *
                  </Label>
                  <Input
                    id="edit_title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_event_type" className="mb-2 block">
                    Event Type *
                  </Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, event_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
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
              
              <div>
                <Label htmlFor="edit_description" className="mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter event description"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="edit_vendor_accommodation_id" className="mb-2 block">
                  Venue (Hotel) *
                </Label>
                <Select
                  value={formData.vendor_accommodation_id}
                  onValueChange={(value) => {
                    const selectedHotel = vendorHotels.find(h => h.id.toString() === value);
                    setFormData({ 
                      ...formData, 
                      vendor_accommodation_id: value,
                      location: selectedHotel?.location || "",
                      latitude: selectedHotel?.latitude || "",
                      longitude: selectedHotel?.longitude || ""
                    });
                  }}
                >
                  <SelectTrigger>
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
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="edit_start_date" className="mb-2 block">
                    Start Date *
                  </Label>
                  <Input
                    id="edit_start_date"
                    type="date"
                    value={formData.start_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) =>
                      handleDateChange("start_date", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_end_date" className="mb-2 block">
                    End Date *
                  </Label>
                  <Input
                    id="edit_end_date"
                    type="date"
                    value={formData.end_date}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    onChange={(e) =>
                      handleDateChange("end_date", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_registration_deadline" className="mb-2 block">
                    Registration Deadline
                  </Label>
                  <Input
                    id="edit_registration_deadline"
                    type="date"
                    value={formData.registration_deadline}
                    max={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, registration_deadline: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_duration_days" className="mb-2 block">
                    Duration (Days)
                  </Label>
                  <Input
                    id="edit_duration_days"
                    value={formData.duration_days}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>

              {formData.vendor_accommodation_id && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="mb-2 block text-sm font-medium text-gray-700">
                    Selected Venue Details
                  </Label>
                  <div className="text-sm text-gray-600">
                    <p><strong>Hotel:</strong> {vendorHotels.find(h => h.id.toString() === formData.vendor_accommodation_id)?.vendor_name}</p>
                    <p><strong>Location:</strong> {formData.location}</p>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="edit_banner_image" className="mb-2 block">
                  Banner Image URL
                </Label>
                <Input
                  id="edit_banner_image"
                  value={formData.banner_image}
                  onChange={(e) =>
                    setFormData({ ...formData, banner_image: e.target.value })
                  }
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_perdiem_rate" className="mb-2 block">
                    Per Diem Rate
                  </Label>
                  <Input
                    id="edit_perdiem_rate"
                    type="number"
                    value={formData.perdiem_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, perdiem_rate: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_perdiem_currency" className="mb-2 block">
                    Currency
                  </Label>
                  <Select
                    value={formData.perdiem_currency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, perdiem_currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CHF">CHF</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_status" className="mb-2 block">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
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
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={closeModals}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditEvent}
                disabled={submitting}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Event"
                )}
              </Button>
            </DialogFooter>
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