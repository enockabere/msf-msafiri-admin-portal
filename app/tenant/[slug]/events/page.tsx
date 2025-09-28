"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Plus,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Clock,
  Play,
  CheckCircle,
  Users,
  UserCheck,
} from "lucide-react";
import EventDetailsModal from "./EventDetailsModal";
import { toast } from "@/components/ui/toast";
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
  latitude?: number;
  longitude?: number;
  banner_image?: string;
  duration_days?: number;
  perdiem_rate?: number;
  perdiem_currency?: string;
  tenant_id: number;
  created_by: string;
  created_at: string;
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
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [events, setEvents] = useState<Event[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'ended'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 8;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "",
    status: "Draft",
    start_date: "",
    end_date: "",
    location: "",
    address: "",
    latitude: "",
    longitude: "",
    banner_image: "",
    duration_days: "",
    perdiem_rate: "",
    perdiem_currency: "",
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

      // Fetch participant counts for each event
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

      // Fetch user roles
      const roles = await apiClient
        .request<UserRole[]>(`/user-roles/user/${user.id}`)
        .catch(() => []);
      const roleNames = roles.map((r) => r.role);
      if (user.role) {
        roleNames.push(user.role);
      }
      setUserRoles([...new Set(roleNames)]);

      // Allow all admin users to access events
      await fetchEvents();
    } catch (error) {
      console.error("Access check error:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    }
  }, [user?.id, user?.role, apiClient, fetchEvents]);

  useEffect(() => {
    if (!authLoading && user?.email) {
      checkAccess();
    }
  }, [user?.email, authLoading, checkAccess]);

  const canManageEvents = () => {
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
      !formData.end_date
    ) {
      toast({
        title: "Error",
        description: "Title, event type, start date, and end date are required",
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

      await apiClient.request(`/events/?tenant=${tenantSlug}`, {
        method: "POST",
        body: JSON.stringify(eventData),
      });

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
        latitude: "",
        longitude: "",
        banner_image: "",
        duration_days: "",
        perdiem_rate: "",
        perdiem_currency: "",
      });
      const newEvent = await apiClient.request<Event>(
        `/events/?tenant=${tenantSlug}`,
        {
          method: "POST",
          body: JSON.stringify(eventData),
        }
      );

      await fetchEvents();

      // Show event details modal after creation
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
      !formData.event_type.trim()
    ) {
      toast({
        title: "Error",
        description: "Title and event type are required",
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
      latitude: event.latitude?.toString() || "",
      longitude: event.longitude?.toString() || "",
      banner_image: event.banner_image || "",
      duration_days: duration,
      perdiem_rate: event.perdiem_rate?.toString() || "",
      perdiem_currency: event.perdiem_currency || "",
    });
    setShowEditModal(true);
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
      latitude: "",
      longitude: "",
      banner_image: "",
      duration_days: "",
      perdiem_rate: "",
      perdiem_currency: "",
    });
  };

  if (loading || authLoading) {
    return <LoadingScreen message="Loading events..." />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Events</h1>
              <p className="text-gray-600">
                Manage events for your organization
              </p>
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

          {/* Event Status Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                statusFilter === 'all' ? 'bg-red-100 text-red-900' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                All: {events.length}
              </span>
            </button>
            <button
              onClick={() => { setStatusFilter('ongoing'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                statusFilter === 'ongoing' ? 'bg-green-100 text-green-900' : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              <Play className="w-4 h-4" />
              <span className="text-sm font-medium">
                Ongoing: {events.filter(e => e.event_status === 'ongoing').length}
              </span>
            </button>
            <button
              onClick={() => { setStatusFilter('upcoming'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                statusFilter === 'upcoming' ? 'bg-blue-100 text-blue-900' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Upcoming: {events.filter(e => e.event_status === 'upcoming').length}
              </span>
            </button>
            <button
              onClick={() => { setStatusFilter('ended'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                statusFilter === 'ended' ? 'bg-gray-100 text-gray-900' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Ended: {events.filter(e => e.event_status === 'ended').length}
              </span>
            </button>
          </div>

          {/* Filtered Events */}
          {(() => {
            // Sort events: ongoing first, then upcoming, then ended
            const sortedEvents = [...events].sort((a, b) => {
              const statusOrder = { ongoing: 0, upcoming: 1, ended: 2 };
              return (statusOrder[a.event_status || 'ended'] || 2) - (statusOrder[b.event_status || 'ended'] || 2);
            });
            
            // Filter events based on status
            const filteredEvents = statusFilter === 'all' 
              ? sortedEvents 
              : sortedEvents.filter(e => e.event_status === statusFilter);
            
            // Pagination
            const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
            const startIndex = (currentPage - 1) * eventsPerPage;
            const paginatedEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage);
            
            return (
              <>
                {filteredEvents.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {paginatedEvents.map((event) => (
                        <EventCard 
                          key={event.id} 
                          event={event} 
                          canManageEvents={canManageEvents()} 
                          onEdit={openEditModal} 
                          onDelete={handleDeleteEvent} 
                          onViewDetails={(e) => { setDetailsEvent(e); setShowDetailsModal(true); }} 
                        />
                      ))}
                    </div>
                    
                    {/* Pagination */}
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
                        : `No ${statusFilter} events at the moment`
                      }
                    </p>
                  </div>
                )}
              </>
            );
          })()}

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

        {/* Create Event Modal */}
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="start_date" className="mb-2 block">
                    Start Date *
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
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
                    onChange={(e) =>
                      handleDateChange("end_date", e.target.value)
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

              <div className="grid grid-cols-2 gap-4">
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

        {/* Edit Event Modal */}
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_start_date" className="mb-2 block">
                    Start Date *
                  </Label>
                  <Input
                    id="edit_start_date"
                    type="date"
                    value={formData.start_date}
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
                    onChange={(e) =>
                      handleDateChange("end_date", e.target.value)
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

              <div className="grid grid-cols-2 gap-4">
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

        {/* Event Details Modal */}
        <EventDetailsModal
          event={detailsEvent}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setDetailsEvent(null);
          }}
          tenantSlug={tenantSlug}
        />
      </div>
    </DashboardLayout>
  );
}

// Event Card Component
interface EventCardProps {
  event: Event;
  canManageEvents: boolean;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onViewDetails: (event: Event) => void;
}

function EventCard({ event, canManageEvents, onEdit, onDelete, onViewDetails }: EventCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'from-blue-50 to-blue-100';
      case 'ongoing': return 'from-green-50 to-green-100';
      case 'ended': return 'from-gray-50 to-gray-100';
      default: return 'from-white to-red-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />;
      case 'ongoing': return <Play className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />;
      case 'ended': return <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />;
      default: return <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />;
    }
  };

  const getStatusText = () => {
    if (event.event_status === 'upcoming' && event.days_until_start) {
      return event.days_until_start === 1 ? 'Starts tomorrow' : `Starts in ${event.days_until_start} days`;
    }
    if (event.event_status === 'ongoing') {
      return 'Event in progress';
    }
    if (event.event_status === 'ended') {
      return 'Event completed';
    }
    return '';
  };

  return (
    <Card
      className={`shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br ${getStatusColor(event.event_status || '')} cursor-pointer`}
      onClick={() => onViewDetails(event)}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col h-full">
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-red-100 to-red-200 shadow-sm flex-shrink-0">
              {getStatusIcon(event.event_status || '')}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-1 line-clamp-2 break-words">
                {event.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {event.event_type}
              </p>
              {getStatusText() && (
                <p className="text-xs font-medium text-blue-600 mt-1">
                  {getStatusText()}
                </p>
              )}
            </div>
            {canManageEvents && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-100 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-white border-2 border-gray-200 rounded-lg shadow-lg"
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(event);
                    }}
                    className="hover:bg-red-50 focus:bg-red-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(event);
                    }}
                    className="hover:bg-red-50 focus:bg-red-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(event);
                    }}
                    className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex-1 space-y-2 sm:space-y-3">
            <div className="text-sm sm:text-base text-gray-600">
              <span className="font-medium">Location:</span>
              <span className="text-gray-800 font-semibold ml-1 break-words">
                {event.location || "TBD"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Registered:</span>
                <span className="font-semibold text-gray-800">{event.participant_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <UserCheck className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">Selected:</span>
                <span className="font-semibold text-green-700">{event.selected_count || 0}</span>
              </div>
            </div>

            {event.event_status === 'ongoing' && (
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">Checked In:</span>
                <span className="font-semibold text-blue-700">{event.checked_in_count || 0}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-1 sm:gap-2">
              <Badge
                className={`px-2 py-1 text-xs font-medium ${
                  event.status === "Published"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {event.status}
              </Badge>
              {event.duration_days && (
                <Badge
                  variant="outline"
                  className="px-2 py-1 text-xs font-medium border-2 border-red-200 text-red-700 bg-red-50"
                >
                  {event.duration_days} days
                </Badge>
              )}
              <Badge
                className={`px-2 py-1 text-xs font-medium ${
                  event.event_status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                  event.event_status === 'ongoing' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {event.event_status ? event.event_status.charAt(0).toUpperCase() + event.event_status.slice(1) : 'Unknown'}
              </Badge>
            </div>
          </div>

          <div className="text-xs text-gray-500 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-gray-200 truncate">
            Created by {event.created_by}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}