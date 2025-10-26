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
  CheckCircle2,
  Clock,
  Archive,
  BarChart3,
  Search,
  Eye,
  Save,
  X,
  Loader2,
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
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filter briefings based on search and filters
  const filteredBriefings = briefings.filter((briefing) => {
    const matchesSearch =
      !searchTerm ||
      briefing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      briefing.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      briefing.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate statistics
  const publishedCount = briefings.filter((b) => b.status === "published").length;
  const draftCount = briefings.filter((b) => b.status === "draft").length;
  const archivedCount = briefings.filter((b) => b.status === "archived").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Security Briefings
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage and distribute security information across events
              </p>
            </div>
            {canCreateBriefings() && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Create Briefing
              </Button>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1">
                      Total Briefings
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-900">
                      {briefings.length}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-blue-200 rounded-xl">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-green-700 mb-1">
                      Published
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-green-900">
                      {publishedCount}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-200 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-amber-700 mb-1">
                      Drafts
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-amber-900">
                      {draftCount}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-amber-200 rounded-xl">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Archived
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {archivedCount}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-200 rounded-xl">
                    <Archive className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search briefings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 h-9 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 h-9 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {filteredBriefings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs sm:text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-semibold text-gray-900">
                      {filteredBriefings.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {briefings.length}
                    </span>{" "}
                    briefings
                    {searchTerm && (
                      <span className="ml-2">
                        (filtered by &quot;{searchTerm}&quot;)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filteredBriefings.length === 0 ? (
              <div className="col-span-full">
                <Card className="border-0 shadow-md">
                  <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
                    <div className="p-3 sm:p-4 bg-gray-100 rounded-full mb-4">
                      <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 text-center">
                      {searchTerm
                        ? "No matching briefings found"
                        : "No security briefings found"}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 text-center mb-6 max-w-md px-4">
                      {searchTerm
                        ? `No briefings match your search "${searchTerm}". Try different keywords.`
                        : "Get started by creating your first security briefing to share important information."}
                    </p>
                    {canCreateBriefings() && !searchTerm && (
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg text-sm sm:text-base"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Briefing
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredBriefings.map((briefing) => (
                <Card
                  key={briefing.id}
                  className="shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-red-50 cursor-pointer group hover:scale-[1.01] overflow-hidden"
                  onClick={() => {
                    setSelectedBriefing(briefing);
                    setShowDetailsModal(true);
                  }}
                >
                  <CardContent className="p-4 sm:p-5 h-full">
                    <div className="flex flex-col h-full justify-between">
                      {/* Top Section */}
                      <div className="space-y-3">
                        {/* Header with Icon and Title */}
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="flex-shrink-0 p-2 rounded-xl bg-gradient-to-br from-red-100 to-red-200 shadow-sm group-hover:shadow-md transition-shadow">
                            <Shield className="w-5 h-5 text-red-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-red-700 transition-colors">
                              {briefing.title}
                            </h3>
                            {briefing.event_title && (
                              <p className="text-xs text-gray-600 flex items-center gap-1">
                                <span className="text-red-600 flex-shrink-0">•</span>
                                <span className="truncate">{briefing.event_title}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status and Type Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            className={`px-2 py-0.5 text-[10px] sm:text-xs font-semibold shadow-sm whitespace-nowrap ${
                              briefing.status === "published"
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : briefing.status === "draft"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-gray-100 text-gray-800 border border-gray-300"
                            }`}
                          >
                            {briefing.status === "published" && (
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5 inline" />
                            )}
                            {briefing.status === "draft" && (
                              <Clock className="w-2.5 h-2.5 mr-0.5 inline" />
                            )}
                            {briefing.status === "archived" && (
                              <Archive className="w-2.5 h-2.5 mr-0.5 inline" />
                            )}
                            {briefing.status?.toUpperCase() || "DRAFT"}
                          </Badge>
                          <Badge
                            className={`px-2 py-0.5 text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                              briefing.brief_type === "general"
                                ? "bg-blue-100 text-blue-800 border border-blue-300"
                                : "bg-purple-100 text-purple-800 border border-purple-300"
                            }`}
                          >
                            {briefing.brief_type === "general" ? "General" : "Event"}
                          </Badge>
                        </div>

                        {/* Category and Location */}
                        {(briefing.category || briefing.location) && (
                          <div className="flex flex-wrap gap-1.5">
                            {briefing.category && (
                              <Badge className="px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-300 max-w-[150px] truncate">
                                {briefing.category}
                              </Badge>
                            )}
                            {briefing.location && (
                              <Badge className="px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-pink-100 text-pink-800 border border-pink-300 max-w-[150px] truncate">
                                📍 {briefing.location}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Content Preview */}
                        <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            {briefing.content_type === "text" ? (
                              <FileText className="w-3 h-3 text-gray-600 flex-shrink-0" />
                            ) : (
                              <Video className="w-3 h-3 text-purple-600 flex-shrink-0" />
                            )}
                            <span className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase">
                              {briefing.content_type === "text" ? "Text" : "Media"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-700 line-clamp-3">
                            {briefing.content}
                          </div>
                        </div>
                      </div>

                      {/* Footer with Actions - Always at bottom */}
                      <div className="space-y-2 pt-3 mt-3 border-t border-gray-200">
                        <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>{new Date(briefing.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBriefing(briefing);
                              setShowDetailsModal(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-all px-2 py-1 text-xs h-7 min-w-0"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {briefing.status === "draft" && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(briefing.id, "published");
                              }}
                              variant="outline"
                              size="sm"
                              className="text-green-700 border-green-300 hover:bg-green-50 transition-all px-2 py-1 text-xs h-7 flex-1"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Publish</span>
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
                              className="text-gray-700 border-gray-300 hover:bg-gray-100 transition-all px-2 py-1 text-xs h-7 flex-1"
                            >
                              <Archive className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Archive</span>
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
                              className="text-red-700 border-red-300 hover:bg-red-50 transition-all px-2 py-1 h-7 min-w-0"
                            >
                              <Trash2 className="w-3 h-3" />
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
          <DialogContent className="bg-white border-0 shadow-2xl max-w-3xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">Create Security Briefing</DialogTitle>
                  <p className="text-red-100 text-sm mt-1">Share important security information with your team</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto modal-scrollbar p-6 pb-0">
              {/* Two-column grid layout for better space utilization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title - Full width */}
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="title" className="text-sm font-semibold text-gray-900 flex items-center">
                    <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                    Title
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Emergency evacuation procedures"
                    className="pl-4 pr-4 py-3 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                  />
                </div>

                {/* Briefing Type */}
                <div className="space-y-2">
                  <label htmlFor="briefType" className="text-sm font-semibold text-gray-900 flex items-center">
                    <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                    Briefing Type
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="briefType"
                    value={formData.brief_type}
                    onChange={(e) =>
                      setFormData({ ...formData, brief_type: e.target.value })
                    }
                    className="w-full pl-4 pr-4 py-3 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all bg-white"
                  >
                    <option value="general">General</option>
                    <option value="event_specific">Event-Specific</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-semibold text-gray-900 flex items-center">
                    <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full pl-4 pr-4 py-3 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Event - Only show if event_specific */}
                {formData.brief_type === "event_specific" && (
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="event" className="text-sm font-semibold text-gray-900 flex items-center">
                      <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                      Event
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      id="event"
                      value={formData.event_id}
                      onChange={(e) =>
                        setFormData({ ...formData, event_id: e.target.value })
                      }
                      className="w-full pl-4 pr-4 py-3 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all bg-white"
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

                {/* Content Type */}
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="contentType" className="text-sm font-semibold text-gray-900 flex items-center">
                    <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                    Content Type
                  </label>
                  <select
                    id="contentType"
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
                    className="w-full pl-4 pr-4 py-3 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all bg-white"
                  >
                    <option value="text">Plain Text</option>
                    <option value="rich_text">Rich Text</option>
                    <option value="video">Video URL</option>
                    <option value="document">Document URL</option>
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-semibold text-gray-900 flex items-center">
                    <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full pl-4 pr-4 py-3 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-semibold text-gray-900 flex items-center">
                    <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                    Location
                  </label>
                  <LocationSelect
                    value={formData.location}
                    country={tenantData?.country}
                    onChange={(value, placeDetails) => {
                      setFormData({
                        ...formData,
                        location: value,
                        latitude:
                          placeDetails?.geometry?.location?.lat()?.toString() ||
                          "",
                        longitude:
                          placeDetails?.geometry?.location?.lng()?.toString() ||
                          "",
                      });
                    }}
                    placeholder="Search for location"
                  />
                  <p className="text-xs text-gray-500 mt-1 ml-1">Start typing to search for the location</p>
                </div>

                {/* Publish Start Date */}
                <div className="space-y-2">
                  <label htmlFor="startDate" className="text-sm font-semibold text-gray-900 flex items-center">
                    <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                    Publish Start Date
                  </label>
                  <input
                    id="startDate"
                    type="datetime-local"
                    value={formData.publish_start_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        publish_start_date: e.target.value,
                      })
                    }
                    className="w-full pl-4 pr-4 py-3 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all bg-white"
                  />
                </div>

                {/* Publish End Date */}
                <div className="space-y-2">
                  <label htmlFor="endDate" className="text-sm font-semibold text-gray-900 flex items-center">
                    <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                    Publish End Date
                  </label>
                  <input
                    id="endDate"
                    type="datetime-local"
                    value={formData.publish_end_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        publish_end_date: e.target.value,
                      })
                    }
                    className="w-full pl-4 pr-4 py-3 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all bg-white"
                  />
                </div>

                {/* Content */}
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="content" className="text-sm font-semibold text-gray-900 flex items-center">
                    <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                    Content
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  {isRichText ? (
                    <div className="border-2 border-gray-300 rounded-lg overflow-hidden focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500">
                      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
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
                        className="w-full px-4 py-3 border-0 focus:outline-none focus:ring-0 resize-none text-sm min-h-[120px]"
                      />
                      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
                        <strong>Markdown:</strong> **bold**, *italic*, __underline__,
                        - bullets, 1. numbers
                      </div>
                    </div>
                  ) : (
                    <textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder={
                        formData.content_type === "video"
                          ? "Enter video URL (e.g., https://youtube.com/...)"
                          : formData.content_type === "document"
                          ? "Enter document URL (e.g., https://...)"
                          : "Describe the security briefing information, procedures, and important details..."
                      }
                      className="w-full px-4 py-3 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all resize-none min-h-[120px]"
                    />
                  )}
                  {!isRichText && (
                    <p className="text-xs text-gray-500 mt-1 ml-1">
                      {formData.content.length} / 2000 characters
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons - Sticky at bottom */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium hover:bg-white transition-all"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleCreateBriefing}
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Briefing
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="sm:max-w-[750px] max-h-[90vh] bg-white border-0 shadow-2xl rounded-xl overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-200">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-red-100 to-red-200 shadow-md">
                  <Shield className="w-7 h-7 text-red-700" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                    {selectedBriefing?.title}
                  </DialogTitle>
                  {selectedBriefing?.event_title && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-red-600">•</span>
                      Event: {selectedBriefing.event_title}
                    </p>
                  )}
                </div>
              </div>
            </DialogHeader>

            {selectedBriefing && (
              <div className="space-y-5 py-4">
                {/* Badges Section */}
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={`px-3 py-1.5 text-xs font-semibold shadow-sm ${
                      selectedBriefing.status === "published"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : selectedBriefing.status === "draft"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-gray-100 text-gray-800 border border-gray-300"
                    }`}
                  >
                    {selectedBriefing.status === "published" && (
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                    )}
                    {selectedBriefing.status === "draft" && (
                      <Clock className="w-3 h-3 mr-1 inline" />
                    )}
                    {selectedBriefing.status === "archived" && (
                      <Archive className="w-3 h-3 mr-1 inline" />
                    )}
                    {selectedBriefing.status?.toUpperCase() || "DRAFT"}
                  </Badge>
                  <Badge
                    className={`px-3 py-1.5 text-xs font-semibold ${
                      selectedBriefing.brief_type === "general"
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-purple-100 text-purple-800 border border-purple-300"
                    }`}
                  >
                    {selectedBriefing.brief_type === "general"
                      ? "General"
                      : "Event-Specific"}
                  </Badge>
                  {selectedBriefing.category && (
                    <Badge className="px-3 py-1.5 text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
                      {selectedBriefing.category}
                    </Badge>
                  )}
                  {selectedBriefing.location && (
                    <Badge className="px-3 py-1.5 text-xs font-semibold bg-pink-100 text-pink-800 border border-pink-300">
                      📍 {selectedBriefing.location}
                    </Badge>
                  )}
                </div>

                {/* Content Section */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border-2 border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    {selectedBriefing.content_type === "text" ? (
                      <FileText className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Video className="w-5 h-5 text-purple-600" />
                    )}
                    <h4 className="font-bold text-gray-900 text-lg">Content</h4>
                  </div>
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedBriefing.content}
                  </div>
                </div>

                {/* Publication Schedule */}
                {(selectedBriefing.publish_start_date ||
                  selectedBriefing.publish_end_date) && (
                  <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <h4 className="font-bold text-gray-900 text-lg">
                        Publication Schedule
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {selectedBriefing.publish_start_date && (
                        <div className="flex items-start gap-2 text-sm">
                          <span className="font-semibold text-gray-700 min-w-[60px]">
                            Start:
                          </span>
                          <span className="text-gray-600">
                            {new Date(
                              selectedBriefing.publish_start_date
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedBriefing.publish_end_date && (
                        <div className="flex items-start gap-2 text-sm">
                          <span className="font-semibold text-gray-700 min-w-[60px]">
                            End:
                          </span>
                          <span className="text-gray-600">
                            {new Date(
                              selectedBriefing.publish_end_date
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-700 font-bold text-sm">
                        {selectedBriefing.created_by?.charAt(0).toUpperCase() ||
                          "?"}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">
                        {selectedBriefing.created_by}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(
                          selectedBriefing.created_at
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
                className="px-8 h-11 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-semibold transition-all"
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
