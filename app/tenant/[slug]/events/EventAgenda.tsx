"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "lucide-react";
import { format, isWithinInterval, parseISO, isSameDay } from "date-fns";

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
  eventHasEnded = false,
}: EventAgendaProps) {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    presenter: "",
  });

  const fetchEventDetails = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEventDetails({
          start_date: data.start_date,
          end_date: data.end_date,
        });
      }
    } catch (error) {
      console.error("Failed to fetch event details:", error);
    }
  }, [eventId]);

  const fetchAgendaItems = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/agenda`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
  }, [fetchEventDetails, fetchAgendaItems]);

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
      !formData.date ||
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

    // Validate that selected date is within event dates
    const selectedDateTime = new Date(formData.date);
    if (!isDateWithinEvent(selectedDateTime)) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Selected date must be within the event date range.",
        variant: "destructive",
      });
      return;
    }

    // Validate that end time is after start time
    if (formData.end_time <= formData.start_time) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const startDateTime = `${formData.date}T${formData.start_time}:00`;
      const endDateTime = `${formData.date}T${formData.end_time}:00`;

      const payload = {
        title: formData.title,
        description: formData.description,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        location: formData.location,
        presenter: formData.presenter,
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
        throw new Error("Failed to save agenda item");
      }
    } catch {
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

    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description || "",
      date: format(startDate, "yyyy-MM-dd"),
      start_time: format(startDate, "HH:mm"),
      end_time: format(endDate, "HH:mm"),
      location: item.location || "",
      presenter: item.presenter || "",
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      date: "",
      start_time: "",
      end_time: "",
      location: "",
      presenter: "",
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
    setFormData({
      title: "",
      description: "",
      date: format(date, "yyyy-MM-dd"),
      start_time: "09:00",
      end_time: "10:00",
      location: "",
      presenter: "",
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
                <TableHead>Location</TableHead>
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
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {item.description}
                          </div>
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
                    <TableCell>{item.location || "-"}</TableCell>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Agenda Item" : "Add Agenda Item"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter agenda item title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter description (optional)"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  min={eventDetails?.start_date}
                  max={eventDetails?.end_date}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Start Time *
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  End Time *
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
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Enter location (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Presenter
                </label>
                <Input
                  value={formData.presenter}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      presenter: e.target.value,
                    }))
                  }
                  placeholder="Enter presenter name (optional)"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
