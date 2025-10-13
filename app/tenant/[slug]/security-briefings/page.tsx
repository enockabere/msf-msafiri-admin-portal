"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Shield,
  Plus,
  Trash2,
  FileText,
  Video,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
} from "lucide-react";
import { LocationSelect } from "@/components/ui/location-select";
import { toast } from "@/components/ui/toast";
import { LoadingScreen } from "@/components/ui/loading";

interface Event {
  id: number;
  title: string;
}

interface SecurityBriefing {
  id: number;
  title: string;
  brief_type: string;
  content_type: string;
  content: string;
  event_id?: number;
  event_title?: string;
  status: string;
  category?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  publish_start_date?: string;
  publish_end_date?: string;
  is_active: boolean;
  tenant_id: string;
  created_by: string;
  created_at: string;
}

export default function SecurityBriefingsPage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const [briefings, setBriefings] = useState<SecurityBriefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    brief_type: "general",
    content_type: "text",
    content: "",
    event_id: "",
    status: "draft",
    category: "",
    location: "",
    latitude: "",
    longitude: "",
    publish_start_date: "",
    publish_end_date: "",
  });
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const categories = [
    "Accommodation Security",
    "Emergency Procedures", 
    "Communication Protocol",
    "Transport Guidelines",
    "General Situation",
    "General"
  ];
  const [events, setEvents] = useState<Event[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isRichText, setIsRichText] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBriefing, setSelectedBriefing] = useState<SecurityBriefing | null>(null);
  const [tenantData, setTenantData] = useState<{ country?: string } | null>(null);

  const tenantSlug = params.slug as string;

  // Check if user can create security briefings (all admin roles)
  const canCreateBriefings = () => {
    return (
      user?.role &&
      ["super_admin", "mt_admin", "hr_admin", "event_admin"].includes(user.role)
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch tenant data for country filtering
        try {
          const tenantResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
            {
              headers: {
                Authorization: `Bearer ${apiClient.getToken()}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (tenantResponse.ok) {
            const tenant = await tenantResponse.json();
            setTenantData({ country: tenant.country });
          }
        } catch (error) {
          console.error('Failed to fetch tenant data:', error);
        }

        // Fetch events for dropdown
        const eventsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/?tenant=${tenantSlug}`,
          {
            headers: {
              Authorization: `Bearer ${apiClient.getToken()}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setEvents(eventsData);
        }

        // Fetch security briefings with filters
        let briefingsUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/security-briefings/?tenant=${tenantSlug}`;
        if (statusFilter !== "all") briefingsUrl += `&status=${statusFilter}`;
        if (categoryFilter !== "all") briefingsUrl += `&category=${encodeURIComponent(categoryFilter)}`;
        
        const briefingsResponse = await fetch(briefingsUrl, {
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
        });
        if (briefingsResponse.ok) {
          const briefingsData = await briefingsResponse.json();
          setBriefings(briefingsData);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user?.email) {
      fetchData();
    }
  }, [user?.email, authLoading, apiClient, tenantSlug, statusFilter, categoryFilter]);

  const handleCreateBriefing = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    if (formData.brief_type === "event_specific" && !formData.event_id) {
      toast({
        title: "Error",
        description: "Event is required for event-specific briefings",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Map frontend content types to API expected values
      let apiContentType = formData.content_type;
      if (formData.content_type === "rich_text") {
        apiContentType = "text"; // API treats rich text as regular text
      } else if (formData.content_type === "document") {
        apiContentType = "video"; // API uses 'video' for URLs (both video and document)
      }

      const payload = {
        title: formData.title,
        brief_type: formData.brief_type,
        content_type: apiContentType,
        content: formData.content,
        event_id: formData.event_id ? parseInt(formData.event_id) : null,
        status: formData.status,
        category: formData.category || null,
        location: formData.location || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        publish_start_date: formData.publish_start_date || null,
        publish_end_date: formData.publish_end_date || null,
        is_active: true,
      };

      // Use direct fetch with tenant parameter like working SecurityBriefings.tsx
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/security-briefings/?tenant=${tenantSlug}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || "Unknown error" };
        }

        throw new Error(
          errorData.detail || "Failed to create security briefing"
        );
      }

      setShowCreateModal(false);
      setFormData({
        title: "",
        brief_type: "general",
        content_type: "text",
        content: "",
        event_id: "",
        status: "draft",
        category: "",
        location: "",
        latitude: "",
        longitude: "",
        publish_start_date: "",
        publish_end_date: "",
      });
      setIsRichText(false);

      // Refetch data
      const eventsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/?tenant=${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      }

      const briefingsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/security-briefings/?tenant=${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (briefingsResponse.ok) {
        const briefingsData = await briefingsResponse.json();
        setBriefings(briefingsData);
      }

      toast({
        title: "Success",
        description: "Security briefing created successfully",
      });
    } catch (error) {
      console.error("Create briefing error:", error);
      let errorMessage = "Failed to create security briefing";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        errorMessage = JSON.stringify(error);
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (briefingId: number, newStatus: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/security-briefings/${briefingId}/status/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Refetch data
      const fetchData = async () => {
        let briefingsUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/security-briefings/?tenant=${tenantSlug}`;
        if (statusFilter !== "all") briefingsUrl += `&status=${statusFilter}`;
        if (categoryFilter !== "all") briefingsUrl += `&category=${encodeURIComponent(categoryFilter)}`;
        
        const briefingsResponse = await fetch(briefingsUrl, {
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
        });
        if (briefingsResponse.ok) {
          const briefingsData = await briefingsResponse.json();
          setBriefings(briefingsData);
        }
      };
      
      await fetchData();

      toast({
        title: "Success",
        description: `Briefing ${newStatus} successfully`,
      });
    } catch (error) {
      console.error("Status change error:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBriefing = async (briefingId: number) => {
    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Delete Security Briefing?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/security-briefings/${briefingId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
          errorData.detail || "Failed to delete security briefing"
        );
      }

      // Refetch data
      const briefingsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/security-briefings/?tenant=${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (briefingsResponse.ok) {
        const briefingsData = await briefingsResponse.json();
        setBriefings(briefingsData);
      }

      toast({
        title: "Success",
        description: "Security briefing deleted successfully",
      });
    } catch (error) {
      console.error("Delete briefing error:", error);
      toast({
        title: "Error",
        description: "Failed to delete security briefing",
        variant: "destructive",
      });
    }
  };

  if (loading || authLoading) {
    return <LoadingScreen message="Loading security briefings..." />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Security Briefings
              </h1>
              <p className="text-gray-600">
                Manage security briefings for events
              </p>
            </div>
            {canCreateBriefings() && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="gap-2 bg-red-600 hover:bg-red-700 text-white h-9 px-4 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Briefing
              </Button>
            )}
          </div>
          
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {briefings.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Shield className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No security briefings found
                    </h3>
                    <p className="text-gray-600 text-center mb-4">
                      Get started by creating your first security briefing
                    </p>
                    {canCreateBriefings() && (
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Briefing
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              briefings.map((briefing) => (
                <Card
                  key={briefing.id}
                  className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-red-50 cursor-pointer"
                  onClick={() => {
                    setSelectedBriefing(briefing);
                    setShowDetailsModal(true);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-red-200 shadow-sm">
                          <Shield className="w-6 h-6 text-red-700" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800 mb-1">
                            {briefing.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {briefing.event_title}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            className={`px-2 py-1 text-xs font-medium ${
                              briefing.brief_type === "general"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-blue-100 text-blue-800 border-blue-200"
                            }`}
                          >
                            {briefing.brief_type === "general"
                              ? "General"
                              : "Event-Specific"}
                          </Badge>
                          <Badge
                            className={`px-2 py-1 text-xs font-medium ${
                              briefing.content_type === "text"
                                ? "bg-gray-100 text-gray-800 border-gray-200"
                                : "bg-purple-100 text-purple-800 border-purple-200"
                            }`}
                          >
                            {briefing.content_type === "text" ? (
                              <>
                                <FileText className="w-3 h-3 mr-1" />
                                Text
                              </>
                            ) : (
                              <>
                                <Video className="w-3 h-3 mr-1" />
                                Video
                              </>
                            )}
                          </Badge>
                          <Badge
                            className={`px-2 py-1 text-xs font-medium ${
                              briefing.status === "published"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : briefing.status === "draft"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
                            {briefing.status?.toUpperCase() || "DRAFT"}
                          </Badge>
                          {briefing.category && (
                            <Badge className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 border-blue-200">
                              {briefing.category}
                            </Badge>
                          )}
                          {briefing.location && (
                            <Badge className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 border-purple-200">
                              📍 {briefing.location}
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-gray-700 line-clamp-3">
                          {briefing.content}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-red-100">
                        <div className="text-xs text-gray-500">
                          Created{" "}
                          {new Date(briefing.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex gap-1">
                          {briefing.status === "draft" && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(briefing.id, "published");
                              }}
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              Publish
                            </Button>
                          )}
                          {briefing.status === "published" && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(briefing.id, "archived");
                              }}
                              variant="outline"
                              size="sm"
                              className="text-gray-600 border-gray-200 hover:bg-gray-50"
                            >
                              Archive
                            </Button>
                          )}
                          {briefing.status === "draft" && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBriefing(briefing.id);
                              }}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Create Briefing Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] bg-white border shadow-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Security Briefing</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter briefing title"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Briefing Type
                </label>
                <select
                  value={formData.brief_type}
                  onChange={(e) =>
                    setFormData({ ...formData, brief_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="general">General</option>
                  <option value="event_specific">Event-Specific</option>
                </select>
              </div>

              {formData.brief_type === "event_specific" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Event
                  </label>
                  <select
                    value={formData.event_id}
                    onChange={(e) =>
                      setFormData({ ...formData, event_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select an event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Content Type
                </label>
                <select
                  value={formData.content_type}
                  onChange={(e) => {
                    const newContentType = e.target.value;
                    setFormData({
                      ...formData,
                      content_type: newContentType,
                      content: "",
                    });
                    setIsRichText(newContentType === "rich_text");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="text">Plain Text</option>
                  <option value="rich_text">Rich Text</option>
                  <option value="video">Video URL</option>
                  <option value="document">Document URL</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Publish Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.publish_start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, publish_start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Publish End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.publish_end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, publish_end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Location
                </label>
                <LocationSelect
                  value={formData.location}
                  country={tenantData?.country}
                  onChange={(value, placeDetails) => {
                    setFormData({ 
                      ...formData, 
                      location: value,
                      latitude: placeDetails?.geometry?.location?.lat()?.toString() || "",
                      longitude: placeDetails?.geometry?.location?.lng()?.toString() || ""
                    });
                  }}
                  placeholder="Search for location"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Content
                </label>
                {isRichText ? (
                  <div className="border border-gray-300 rounded-md">
                    <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-gray-50">
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById(
                            "rich-content"
                          ) as HTMLTextAreaElement;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = textarea.value.substring(
                            start,
                            end
                          );
                          const newText =
                            textarea.value.substring(0, start) +
                            `**${selectedText}**` +
                            textarea.value.substring(end);
                          setFormData({ ...formData, content: newText });
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById(
                            "rich-content"
                          ) as HTMLTextAreaElement;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = textarea.value.substring(
                            start,
                            end
                          );
                          const newText =
                            textarea.value.substring(0, start) +
                            `*${selectedText}*` +
                            textarea.value.substring(end);
                          setFormData({ ...formData, content: newText });
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById(
                            "rich-content"
                          ) as HTMLTextAreaElement;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = textarea.value.substring(
                            start,
                            end
                          );
                          const newText =
                            textarea.value.substring(0, start) +
                            `__${selectedText}__` +
                            textarea.value.substring(end);
                          setFormData({ ...formData, content: newText });
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Underline className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-gray-300 mx-1" />
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById(
                            "rich-content"
                          ) as HTMLTextAreaElement;
                          const start = textarea.selectionStart;
                          const newText =
                            textarea.value.substring(0, start) +
                            "\n- " +
                            textarea.value.substring(start);
                          setFormData({ ...formData, content: newText });
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById(
                            "rich-content"
                          ) as HTMLTextAreaElement;
                          const start = textarea.selectionStart;
                          const newText =
                            textarea.value.substring(0, start) +
                            "\n1. " +
                            textarea.value.substring(start);
                          setFormData({ ...formData, content: newText });
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      id="rich-content"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Enter briefing content with markdown formatting"
                      rows={4}
                      className="w-full px-3 py-2 border-0 focus:outline-none focus:ring-0 resize-none"
                    />
                    <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
                      Use **bold**, *italic*, __underline__, - for bullets, 1.
                      for numbers
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder={
                      formData.content_type === "video"
                        ? "Enter video URL"
                        : formData.content_type === "document"
                        ? "Enter document URL"
                        : "Enter briefing content"
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                )}
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBriefing}
                disabled={submitting}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm"
              >
                {submitting ? "Creating..." : "Create Briefing"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] bg-white border shadow-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                {selectedBriefing?.title}
              </DialogTitle>
            </DialogHeader>

            {selectedBriefing && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={`px-2 py-1 text-xs font-medium ${
                    selectedBriefing.brief_type === "general"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-blue-100 text-blue-800 border-blue-200"
                  }`}>
                    {selectedBriefing.brief_type === "general" ? "General" : "Event-Specific"}
                  </Badge>
                  <Badge className={`px-2 py-1 text-xs font-medium ${
                    selectedBriefing.status === "published"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : selectedBriefing.status === "draft"
                      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                  }`}>
                    {selectedBriefing.status?.toUpperCase() || "DRAFT"}
                  </Badge>
                  {selectedBriefing.category && (
                    <Badge className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 border-blue-200">
                      {selectedBriefing.category}
                    </Badge>
                  )}
                  {selectedBriefing.location && (
                    <Badge className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 border-purple-200">
                      📍 {selectedBriefing.location}
                    </Badge>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {selectedBriefing.content}
                  </div>
                </div>

                {(selectedBriefing.publish_start_date || selectedBriefing.publish_end_date) && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Publication Schedule</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {selectedBriefing.publish_start_date && (
                        <div>Start: {new Date(selectedBriefing.publish_start_date).toLocaleString()}</div>
                      )}
                      {selectedBriefing.publish_end_date && (
                        <div>End: {new Date(selectedBriefing.publish_end_date).toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 border-t pt-3">
                  Created by {selectedBriefing.created_by} on {new Date(selectedBriefing.created_at).toLocaleDateString()}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
