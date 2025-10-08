"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [sortField, setSortField] = useState<keyof Event>('start_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "",
    status: "Draft",
    start_date: "",
    end_date: "",
    location: "",
    address: "",
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

  const tenantSlug = params.slug as string;

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

      // Check if user is tenant admin (owner)
      try {
        const tenantData = await apiClient.request<{ admin_email: string }>(`/tenants/slug/${tenantSlug}`);
        setIsTenantAdmin(tenantData.admin_email === user.email);
      } catch {
        setIsTenantAdmin(false);
      }

      await fetchEvents();
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
    field: "start_date" | "end_date",
    value: string
  ) => {
    const newFormData = { ...formData, [field]: value };
    if (field === "start_date" || field === "end_date") {
      newFormData.duration_days = calculateDuration(
        newFormData.start_date,
        newFormData.end_date
      );
    }
    setFormData(newFormData);
  };

  const handleCreateEvent = async () => {
    if (
      !formData.title.trim() ||
      !formData.event_type.trim() ||
      !formData.start_date ||
      !formData.end_date ||
      !formData.country.trim()
    ) {
      toast({
        title: "Error",
        description: "Title, event type, country, start date, and end date are required",
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
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      const newEvent = await apiClient.request<Event>(
        `/events/?tenant=${tenantSlug}`,
        {
          method: "POST",
          body: JSON.stringify(eventData),
        }
      );

      setShowCreateModal(false);
      setFormData({
        title: "",
        description: "",
        event_type: "",
        status: "Draft",
        start_date: "",
        end_date: "",
        location: "",
        address: "",
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
      !formData.country.trim()
    ) {
      toast({
        title: "Error",
        description: "Title, event type, and country are required",
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
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
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
      location: event.location || "",
      address: event.address || "",
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
    setFormData({
      title: "",
      description: "",
      event_type: "",
      status: "Draft",
      start_date: "",
      end_date: "",
      location: "",
      address: "",
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {paginatedEvents.map((event) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      canManageEvents={canManageEvents()} 
                      onEdit={(e) => openEditModal(e)} 
                      onDelete={(e) => handleDeleteEvent(e)} 
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

          {events.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No events found
                  </h3>
                  <p className="text-gray-600 text-center mb-4">
                    {canManageEvents()
                      ? "Get started by creating your first event"
                      : "No events have been created yet"}
                  </p>
                  {canManageEvents() && (
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Dialog open={showCreateModal} onOpenChange={closeModals}>
          <DialogContent className="max-w-2xl bg-white border shadow-lg">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new event for your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="mb-2 block">
                    Event Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <Label htmlFor="event_type" className="mb-2 block">
                    Event Type *
                  </Label>
                  <Input
                    id="event_type"
                    value={formData.event_type}
                    onChange={(e) =>
                      setFormData({ ...formData, event_type: e.target.value })
                    }
                    placeholder="Conference, Workshop, Training, etc."
                  />
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
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="location" className="mb-2 block">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Venue name or city"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="mb-2 block">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <Label htmlFor="country" className="mb-2 block">
                    Country *
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    placeholder="Event country"
                  />
                </div>
              </div>
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
          <DialogContent className="max-w-2xl bg-white border shadow-lg">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update the event details below to modify the existing event.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
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
                  <Input
                    id="edit_event_type"
                    value={formData.event_type}
                    onChange={(e) =>
                      setFormData({ ...formData, event_type: e.target.value })
                    }
                    placeholder="Conference, Workshop, Training, etc."
                  />
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
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_location" className="mb-2 block">
                    Location
                  </Label>
                  <Input
                    id="edit_location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Venue name or city"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_address" className="mb-2 block">
                    Address
                  </Label>
                  <Input
                    id="edit_address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_country" className="mb-2 block">
                    Country *
                  </Label>
                  <Input
                    id="edit_country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    placeholder="Event country"
                  />
                </div>
              </div>
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