"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Edit,
  Trash2,
  MapPin,
  User,
  FileText,
  AlertCircle,
  X,
  Save,
} from "lucide-react";
import { format, isWithinInterval, parseISO, isSameDay } from "date-fns";

// Dynamically import CKEditor with SSR disabled
const CKEditor = dynamic(() => import("@ckeditor/ckeditor5-react").then(mod => ({ default: mod.CKEditor })), { ssr: false });

// Simple timezone mapping based on common MSF countries
const getTimezoneByCountry = (country?: string): string => {
  const timezoneMap: Record<string, string> = {
    'Kenya': 'EAT (UTC+3)',
    'Uganda': 'EAT (UTC+3)',
    'Tanzania': 'EAT (UTC+3)',
    'South Africa': 'SAST (UTC+2)',
    'Nigeria': 'WAT (UTC+1)',
    'Ghana': 'GMT (UTC+0)',
    'Switzerland': 'CET (UTC+1)',
    'Belgium': 'CET (UTC+1)',
    'France': 'CET (UTC+1)',
    'Spain': 'CET (UTC+1)',
    'UK': 'GMT (UTC+0)',
    'United Kingdom': 'GMT (UTC+0)',
  };

  return timezoneMap[country || ''] || 'Local Time';
};

interface AgendaItem {
  id: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  presenter?: string;
  session_number: string;
  created_by: string;
  created_at: string;
}

interface EventAgendaProps {
  eventId: number;
  tenantSlug: string;
  eventHasEnded?: boolean;
}

interface EventDetails {
  start_date: string;
  end_date: string;
}

export default function EventAgenda({
  eventId,
  tenantSlug,
  eventHasEnded = false,
}: EventAgendaProps) {
  const { accessToken } = useAuth();
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [tenantCountry, setTenantCountry] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [editorLoaded, setEditorLoaded] = useState(false);
  const editorRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    day_number: 1,
    start_time: "09:00",
    end_time: "10:00",
    speaker: "",
  });
  const [facilitators, setFacilitators] = useState<any[]>([]);

  const fetchEventDetails = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEventDetails({
          start_date: data.start_date,
          end_date: data.end_date,
        });
      } else {
        console.error('Failed to fetch event details - status:', response.status);
        if (response.status === 401) {
          console.error('Authentication failed - token may be expired');
          // Try to refresh the page or redirect to login
        }
      }
    } catch (error) {
      console.error("Failed to fetch event details:", error);
    }
  }, [eventId, accessToken]);

  const fetchTenantData = useCallback(async () => {
    try {
      const tenantResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json();
        setTenantCountry(tenantData.country || "");
      } else {
        console.error("Failed to fetch tenant - status:", tenantResponse.status);
      }
    } catch (error) {
      console.error("Failed to fetch tenant details:", error);
    }
  }, [tenantSlug, accessToken]);

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

  const fetchFacilitators = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/event-registration/event/${eventId}/registrations`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const facilitatorList = data.filter((p: any) => 
          (p.participant_role || p.role) === "facilitator"
        );
        setFacilitators(facilitatorList);
      }
    } catch (error) {
      console.error("Failed to fetch facilitators:", error);
    }
  }, [eventId]);

  const fetchAgendaItems = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/agenda`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAgendaItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch agenda items:", error);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventDetails();
    fetchAgendaItems();
    fetchFacilitators();
    fetchTenantData();
  }, [fetchEventDetails, fetchAgendaItems, fetchFacilitators, fetchTenantData]);

  const isDateWithinEvent = (date: Date) => {
    if (!eventDetails) return false;

    const eventStart = parseISO(eventDetails.start_date);
    const eventEnd = parseISO(eventDetails.end_date);

    return isWithinInterval(date, { start: eventStart, end: eventEnd });
  };

  const getAgendaItemsForDate = (date: Date) => {
    return agendaItems.filter((item) =>
      isSameDay(parseISO(item.start_datetime), date)
    );
  };

  const generateSessionNumber = () => {
    const sortedItems = [...agendaItems].sort(
      (a, b) =>
        new Date(a.start_datetime).getTime() -
        new Date(b.start_datetime).getTime()
    );
    return `Session ${sortedItems.length + 1}`;
  };

  const handleSubmit = async () => {
    if (
      !formData.title ||
      !formData.start_time ||
      !formData.end_time
    ) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate that end time is after start time
    const startTimeMinutes = parseInt(formData.start_time.split(':')[0]) * 60 + parseInt(formData.start_time.split(':')[1]);
    const endTimeMinutes = parseInt(formData.end_time.split(':')[0]) * 60 + parseInt(formData.end_time.split(':')[1]);

    if (endTimeMinutes <= startTimeMinutes) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    if (!eventDetails) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Event details not loaded. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Calculate the actual date based on day number
      const eventStartDate = new Date(eventDetails.start_date);
      const agendaDate = new Date(eventStartDate);
      agendaDate.setDate(eventStartDate.getDate() + (formData.day_number - 1));

      const dateStr = agendaDate.toISOString().split('T')[0];
      const startDateTime = `${dateStr}T${formData.start_time}:00`;
      const endDateTime = `${dateStr}T${formData.end_time}:00`;

      const payload = {
        title: formData.title,
        description: formData.description,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        day_number: formData.day_number,
        speaker: formData.speaker,
        session_number: editingId ? undefined : generateSessionNumber(),
      };

      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/agenda/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/agenda`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchAgendaItems();
        handleCloseForm();

        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Success!",
          description: `Agenda item ${
            editingId ? "updated" : "created"
          } successfully.`,
        });
      } else {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        throw new Error(`Failed to save agenda item: ${response.status}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to save agenda item.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: AgendaItem) => {
    const startDate = parseISO(item.start_datetime);
    const endDate = parseISO(item.end_datetime);
    
    // Calculate day number from start date
    const eventStartDate = new Date(eventDetails!.start_date);
    const itemDate = new Date(startDate);
    const dayNumber = Math.floor((itemDate.getTime() - eventStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const startTime = format(startDate, "HH:mm");
    const endTime = format(endDate, "HH:mm");
    
    // Ensure end time is different from start time
    const finalEndTime = endTime === startTime ? 
      format(new Date(endDate.getTime() + 60 * 60 * 1000), "HH:mm") : // Add 1 hour if same
      endTime;

    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description || "",
      day_number: dayNumber,
      start_time: startTime,
      end_time: finalEndTime,
      speaker: item.presenter || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/agenda/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        await fetchAgendaItems();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Deleted!",
          description: "Agenda item deleted successfully.",
        });
      }
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to delete agenda item.",
        variant: "destructive",
      });
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      day_number: 1,
      start_time: "09:00",
      end_time: "10:00",
      speaker: "",
    });
  };

  const getCurrentSession = () => {
    const now = new Date();
    const sortedItems = [...agendaItems].sort(
      (a, b) =>
        new Date(a.start_datetime).getTime() -
        new Date(b.start_datetime).getTime()
    );

    // Find current session (ongoing)
    const currentSession = sortedItems.find((item) => {
      const start = new Date(item.start_datetime);
      const end = new Date(item.end_datetime);
      return now >= start && now <= end;
    });

    if (currentSession) {
      return { ...currentSession, status: "current" };
    }

    // Find next session
    const nextSession = sortedItems.find((item) => {
      const start = new Date(item.start_datetime);
      return now < start;
    });

    if (nextSession) {
      return { ...nextSession, status: "next" };
    }

    return null;
  };

  const handleAddForDate = (date: Date) => {
    // Calculate day number from selected date
    const eventStartDate = new Date(eventDetails!.start_date);
    const dayNumber = Math.floor((date.getTime() - eventStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    setFormData({
      title: "",
      description: "",
      day_number: dayNumber,
      start_time: "09:00",
      end_time: "10:00",
      speaker: "",
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Event Agenda</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage the event schedule and agenda items
          </p>
          {eventDetails && (
            <p className="text-xs text-gray-500 mt-1">
              Event dates: {format(parseISO(eventDetails.start_date), "MMM dd")}{" "}
              - {format(parseISO(eventDetails.end_date), "MMM dd, yyyy")} 
              ({Math.floor(Math.abs(new Date(eventDetails.end_date).getTime() - new Date(eventDetails.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {(() => {
            const currentSession = getCurrentSession();
            if (currentSession) {
              return (
                <div
                  className={`px-3 py-2 rounded-lg border ${
                    currentSession.status === "current"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                  }`}
                >
                  <div className="text-xs font-medium">
                    {currentSession.status === "current"
                      ? "🔴 Current Session"
                      : "⏰ Next Session"}
                  </div>
                  <div className="text-sm font-semibold">
                    {currentSession.session_number}
                  </div>
                  <div className="text-xs">{currentSession.title}</div>
                </div>
              );
            }
            return null;
          })()}
          <Button
            onClick={() => setShowForm(true)}
            disabled={eventHasEnded}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Agenda Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-red-600" />
              Select Date
            </h4>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => !isDateWithinEvent(date)}
              className="rounded-md border"
              modifiers={{
                hasAgenda: (date) => getAgendaItemsForDate(date).length > 0,
              }}
              modifiersStyles={{
                hasAgenda: {
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  fontWeight: "bold",
                },
              }}
            />
            <div className="mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span>Days with agenda items</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                <span>Available dates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Agenda Items */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">
                  {selectedDate ? (
                    <>Agenda for {format(selectedDate, "MMMM dd, yyyy")}</>
                  ) : (
                    "Select a date to view agenda"
                  )}
                </h4>
                {selectedDate && isDateWithinEvent(selectedDate) && (
                  <Button
                    size="sm"
                    onClick={() => handleAddForDate(selectedDate)}
                    disabled={eventHasEnded}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4">
              {selectedDate && isDateWithinEvent(selectedDate) ? (
                <>
                  {getAgendaItemsForDate(selectedDate).length > 0 ? (
                    <div className="space-y-3">
                      {getAgendaItemsForDate(selectedDate)
                        .sort(
                          (a, b) =>
                            new Date(a.start_datetime).getTime() -
                            new Date(b.start_datetime).getTime()
                        )
                        .map((item) => (
                          <div
                            key={item.id}
                            className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs font-medium"
                                  >
                                    {item.session_number}
                                  </Badge>
                                  <h5 className="font-semibold text-gray-900">
                                    {item.title}
                                  </h5>
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {format(
                                      parseISO(item.start_datetime),
                                      "HH:mm"
                                    )}{" "}
                                    -{" "}
                                    {format(
                                      parseISO(item.end_datetime),
                                      "HH:mm"
                                    )}
                                  </Badge>
                                </div>

                                {item.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {item.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                  {item.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {item.location}
                                    </div>
                                  )}
                                  {item.presenter && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {item.presenter}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(item)}
                                  disabled={eventHasEnded}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                  disabled={eventHasEnded}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        No agenda items
                      </h4>
                      <p className="text-gray-500 mb-4">
                        Add agenda items for this date
                      </p>
                      <Button
                        onClick={() => handleAddForDate(selectedDate)}
                        disabled={eventHasEnded}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Item
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Select a date
                  </h4>
                  <p className="text-gray-500">
                    Choose a date within the event period to view or add agenda
                    items
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* All Agenda Items Table */}
      {agendaItems.length > 0 && (
        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b">
            <h4 className="font-semibold">All Agenda Items</h4>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Presenter</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendaItems
                .sort(
                  (a, b) =>
                    new Date(a.start_datetime).getTime() -
                    new Date(b.start_datetime).getTime()
                )
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium"
                      >
                        {item.session_number}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        {item.description && (
                          <div
                            className="text-sm text-gray-500 truncate max-w-xs"
                            dangerouslySetInnerHTML={{
                              __html: item.description.replace(/<[^>]*>/g, '').substring(0, 100)
                            }}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {format(
                            parseISO(item.start_datetime),
                            "MMM dd, yyyy"
                          )}
                        </div>
                        <div className="text-gray-500">
                          {format(parseISO(item.start_datetime), "HH:mm")} -{" "}
                          {format(parseISO(item.end_datetime), "HH:mm")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.presenter || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          disabled={eventHasEnded}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={eventHasEnded}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        {showForm && (
          <div className="fixed inset-0 z-[45] bg-black/20 backdrop-blur-sm pointer-events-none" />
        )}
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl p-0 flex flex-col z-50">
          <DialogHeader className="px-6 py-5 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Agenda Item" : "Add Agenda Item"}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  Schedule a session or activity for this event
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                Title
                <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter agenda item title"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Description
              </label>
              <div className="border border-gray-300 rounded-md overflow-hidden">
                {editorLoaded && editorRef.current ? (
                  <CKEditor
                    editor={editorRef.current}
                    data={formData.description}
                    onChange={(_event: any, editor: any) => {
                      const data = editor.getData();
                      setFormData((prev) => ({
                        ...prev,
                        description: data,
                      }));
                    }}
                    config={{
                      toolbar: [
                        'heading', '|',
                        'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
                        'blockQuote', 'undo', 'redo'
                      ],
                      placeholder: "Enter description (optional)",
                    }}
                  />
                ) : (
                  <div className="p-4 text-sm text-gray-500">Loading editor...</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  Day
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.day_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, day_number: parseInt(e.target.value) }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                >
                  {eventDetails ? (
                    (() => {
                      const startDate = new Date(eventDetails.start_date);
                      const endDate = new Date(eventDetails.end_date);
                      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

                      return Array.from({ length: diffDays }, (_, i) => {
                        const dayDate = new Date(startDate);
                        dayDate.setDate(startDate.getDate() + i);
                        return (
                          <option key={i + 1} value={i + 1}>
                            Day {i + 1} ({format(dayDate, "MMM dd, yyyy")})
                          </option>
                        );
                      });
                    })()
                  ) : (
                    <option value={1}>Day 1 (Loading...)</option>
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  Start Time ({getTimezoneByCountry(tenantCountry)})
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      start_time: e.target.value,
                    }))
                  }
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  End Time ({getTimezoneByCountry(tenantCountry)})
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      end_time: e.target.value,
                    }))
                  }
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Speaker
              </label>
              <select
                value={formData.speaker}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    speaker: e.target.value,
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a speaker (optional)</option>
                {facilitators.map((facilitator) => (
                  <option key={facilitator.id} value={facilitator.full_name}>
                    {facilitator.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  All times are in <strong>{getTimezoneByCountry(tenantCountry)}</strong>{tenantCountry ? ` based on tenant country: ${tenantCountry}` : ''}. Make sure to verify the timezone is correct for your event location.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleCloseForm}
                className="flex-1 sm:flex-none border-gray-300 hover:bg-gray-100"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                disabled={loading}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white"
              >
                {editingId ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Updating..." : "Update"}
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {loading ? "Creating..." : "Create"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
