"use client";

import { useState, useEffect } from "react";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash2,
  Edit,
  Plus,
  Eye,
  Send,
  Newspaper,
  X,
  Save,
  Loader2,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { LoadingScreen } from "@/components/ui/loading";

interface NewsUpdate {
  id: number;
  title: string;
  summary: string;
  content?: string;
  external_link?: string;
  video_url?: string;
  document_url?: string;
  content_type: string;
  category: string;
  is_important: boolean;
  is_published: boolean;
  scheduled_publish_at?: string;
  expires_at?: string;
  image_url?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  published_at?: string;
}

const categories = [
  { value: "general", label: "General" },
  { value: "health_program", label: "Health Program" },
  { value: "security_briefing", label: "Security Briefing" },
  { value: "events", label: "Events" },
  { value: "reports", label: "Reports" },
  { value: "announcement", label: "Announcement" },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case "health_program":
      return "bg-green-100 text-green-800";
    case "security_briefing":
      return "bg-orange-100 text-orange-800";
    case "events":
      return "bg-purple-100 text-purple-800";
    case "reports":
      return "bg-blue-100 text-blue-800";
    case "announcement":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function NewsUpdatesPage() {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();

  const [newsUpdates, setNewsUpdates] = useState<NewsUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsUpdate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    external_link: "",
    video_url: "",
    document_url: "",
    content_type: "text",
    category: "general",
    is_important: false,
    scheduled_publish_at: "",
    expires_at: "",
    image_url: "",
  });
  const [publishOption, setPublishOption] = useState<
    "draft" | "now" | "scheduled"
  >("draft");

  useEffect(() => {
    fetchNewsUpdates();
  }, [authLoading, user, currentPage, searchQuery, activeTab]);

  const fetchNewsUpdates = async () => {
    if (authLoading || !user) {
      return;
    }

    try {
      const token = apiClient.getToken();
      const params = new URLSearchParams({
        skip: ((currentPage - 1) * itemsPerPage).toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      console.log('Fetching news updates from:', `${process.env.NEXT_PUBLIC_API_URL}/api/v1/news-updates/?${params}`);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/news-updates/?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('Fetch response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Fetch error response:', errorText);
      }

      if (response.ok) {
        const data = await response.json();
        setNewsUpdates(data.items || []);
        setTotalItems(data.total || 0);
        setTotalPages(data.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching news updates:", error);
      toast.error("Failed to load news updates");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields based on publish option
      if (publishOption === "scheduled" && !formData.scheduled_publish_at) {
        toast.error("Please select a scheduled publish date");
        setSubmitting(false);
        return;
      }

      if (publishOption === "now" && !formData.expires_at) {
        toast.error("Please select an expiry date for immediate publishing");
        setSubmitting(false);
        return;
      }

      const token = apiClient.getToken();
      if (!token) {
        toast.error("Please log in again");
        return;
      }

      const url = editingNews
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/news-updates/${editingNews.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/news-updates/`;

      const method = editingNews ? "PUT" : "POST";

      // Prepare submission data based on publish option
      const submissionData = {
        ...formData,
        is_published: publishOption === "now",
        scheduled_publish_at:
          publishOption === "scheduled" ? formData.scheduled_publish_at : null,
        expires_at: formData.expires_at || null,
      };

      console.log('Sending data to API:', submissionData);
      console.log('API URL:', url);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });

      console.log('API Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('API Error response:', errorText);
      }

      if (response.ok) {
        const message =
          publishOption === "now"
            ? editingNews
              ? "News updated and published!"
              : "News created and published!"
            : publishOption === "scheduled"
            ? editingNews
              ? "News updated and scheduled!"
              : "News created and scheduled!"
            : editingNews
            ? "News updated as draft"
            : "News saved as draft";

        toast.success(message);
        setIsDialogOpen(false);
        resetForm();
        setCurrentPage(1);
        fetchNewsUpdates();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save news update");
      }
    } catch (error) {
      console.error("Error saving news update:", error);
      toast.error("Failed to save news update");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (newsId: number, isPublished: boolean) => {
    try {
      // Check if news has expiry date before publishing
      if (isPublished) {
        const news = newsUpdates.find(n => n.id === newsId);
        if (!news?.expires_at) {
          toast.error("Cannot publish news without expiry date. Please edit and add expiry date first.");
          return;
        }
      }

      const token = apiClient.getToken();
      if (!token) {
        toast.error("Please log in again");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/news-updates/${newsId}/publish`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_published: isPublished }),
        }
      );

      if (response.ok) {
        toast.success(
          isPublished
            ? "News published successfully"
            : "News unpublished successfully"
        );
        setCurrentPage(1);
        fetchNewsUpdates();
      } else {
        toast.error("Failed to update publication status");
      }
    } catch (error) {
      console.error("Error updating publication status:", error);
      toast.error("Failed to update publication status");
    }
  };

  const handleDelete = async (newsId: number) => {
    if (!confirm("Are you sure you want to delete this news update?")) {
      return;
    }

    try {
      const token = apiClient.getToken();
      if (!token) {
        toast.error("Please log in again");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/news-updates/${newsId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("News update deleted successfully");
        setCurrentPage(1);
        fetchNewsUpdates();
      } else {
        toast.error("Failed to delete news update");
      }
    } catch (error) {
      console.error("Error deleting news update:", error);
      toast.error("Failed to delete news update");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      summary: "",
      content: "",
      external_link: "",
      video_url: "",
      document_url: "",
      content_type: "text",
      category: "general",
      is_important: false,
      scheduled_publish_at: "",
      expires_at: "",
      image_url: "",
    });
    setPublishOption("draft");
    setEditingNews(null);
  };

  const openEditDialog = (news: NewsUpdate) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      summary: news.summary,
      content: news.content || "",
      external_link: news.external_link || "",
      video_url: news.video_url || "",
      document_url: news.document_url || "",
      content_type: news.content_type || "text",
      category: news.category,
      is_important: news.is_important,
      scheduled_publish_at: news.scheduled_publish_at || "",
      expires_at: news.expires_at || "",
      image_url: news.image_url || "",
    });
    if (news.is_published) {
      setPublishOption("now");
    } else if (news.scheduled_publish_at) {
      setPublishOption("scheduled");
    } else {
      setPublishOption("draft");
    }
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNewsStatus = (news: NewsUpdate) => {
    const now = new Date();

    if (news.expires_at && new Date(news.expires_at) < now) {
      return "expired";
    }

    if (
      news.scheduled_publish_at &&
      new Date(news.scheduled_publish_at) > now
    ) {
      return "scheduled";
    }

    if (news.is_published) {
      return "active";
    }

    return "draft";
  };

  const filterNewsByStatus = (news: NewsUpdate[]) => {
    if (activeTab === "all") return news;
    return news.filter((item) => getNewsStatus(item) === activeTab);
  };

  const getStatusCounts = () => {
    const counts = {
      all: newsUpdates.length,
      active: 0,
      draft: 0,
      scheduled: 0,
      expired: 0,
    };

    newsUpdates.forEach((news) => {
      const status = getNewsStatus(news);
      counts[status as keyof typeof counts]++;
    });

    return counts;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className={i === currentPage ? "bg-red-600 hover:bg-red-700" : ""}
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-500">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          {pages}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading news updates..." />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Modern Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-orange-600 rounded-2xl shadow-xl">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Title Section */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Newspaper className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">
                      News & Updates
                    </h1>
                    <p className="text-xs text-red-100 mt-0.5">
                      Manage and publish news articles for your organization
                    </p>
                  </div>
                </div>

                {/* Quick Stats in Header */}
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
                    <CheckCircle className="w-4 h-4 text-white" />
                    <div>
                      <div className="text-lg font-bold text-white">
                        {getStatusCounts().active}
                      </div>
                      <div className="text-[10px] text-red-100">Active</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
                    <Edit className="w-4 h-4 text-white" />
                    <div>
                      <div className="text-lg font-bold text-white">
                        {getStatusCounts().draft}
                      </div>
                      <div className="text-[10px] text-red-100">Drafts</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
                    <Clock className="w-4 h-4 text-white" />
                    <div>
                      <div className="text-lg font-bold text-white">
                        {getStatusCounts().scheduled}
                      </div>
                      <div className="text-[10px] text-red-100">Scheduled</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={resetForm}
                    className="bg-white text-red-600 hover:bg-red-50 shadow-lg font-semibold h-10 px-5 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create News/Updates
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-[98vw] sm:w-[95vw] lg:w-[90vw] xl:w-[85vw] h-[95vh] sm:h-[90vh] max-w-[98vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] overflow-hidden bg-white border-0 shadow-2xl p-0 rounded-2xl flex flex-col">
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Newspaper className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <DialogTitle className="text-lg font-bold text-white">
                          {editingNews
                            ? "Edit News Update"
                            : "Create News Update"}
                        </DialogTitle>
                        <p className="text-red-100 text-xs mt-1">
                          {editingNews
                            ? "Update the news article details and content"
                            : "Share important news and updates with your team"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto modal-scrollbar"
                  >
                    <div className="p-6 pb-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Title - Full width */}
                        <div className="space-y-2 md:col-span-2">
                          <Label
                            htmlFor="title"
                            className="text-sm font-semibold text-gray-900"
                          >
                            Title
                            <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                title: e.target.value,
                              })
                            }
                            required
                            placeholder="Enter a clear and engaging title"
                            className="h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                          />
                        </div>

                        {/* Summary - Full width */}
                        <div className="space-y-2 md:col-span-2">
                          <Label
                            htmlFor="summary"
                            className="text-sm font-semibold text-gray-900"
                          >
                            Summary
                            <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Textarea
                            id="summary"
                            value={formData.summary}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                summary: e.target.value,
                              })
                            }
                            required
                            placeholder="Brief summary of the news (shown in previews)"
                            className="px-4 py-2.5 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all resize-none min-h-[4rem]"
                            rows={3}
                          />
                        </div>

                        {/* Full Content - Full width */}
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-semibold text-gray-900">
                            Full Content
                          </Label>
                          <RichTextEditor
                            value={formData.content}
                            onChange={(content) =>
                              setFormData({ ...formData, content })
                            }
                            placeholder="Write your detailed content here..."
                            height={200}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Use the rich text editor to format your content with
                            bold, italic, links, lists, and more.
                          </p>
                        </div>

                        {/* External Link - Full width */}
                        <div className="space-y-2 md:col-span-2">
                          <Label
                            htmlFor="external_link"
                            className="text-sm font-semibold text-gray-900"
                          >
                            External Link URL (Optional)
                          </Label>
                          <Input
                            id="external_link"
                            type="url"
                            value={formData.external_link}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                external_link: e.target.value,
                              })
                            }
                            placeholder="https://example.com/full-article"
                            className="h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            If provided, users can access this link in addition
                            to the content above
                          </p>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="category"
                            className="text-sm font-semibold text-gray-900"
                          >
                            Category
                          </Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) =>
                              setFormData({ ...formData, category: value })
                            }
                          >
                            <SelectTrigger className="h-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Image URL */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="image_url"
                            className="text-sm font-semibold text-gray-900"
                          >
                            Image URL
                          </Label>
                          <Input
                            id="image_url"
                            value={formData.image_url}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                image_url: e.target.value,
                              })
                            }
                            placeholder="https://example.com/image.jpg"
                            className="h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                          />
                        </div>

                        {/* Video URL */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="video_url"
                            className="text-sm font-semibold text-gray-900"
                          >
                            Video URL (Optional)
                          </Label>
                          <Input
                            id="video_url"
                            type="url"
                            value={formData.video_url}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                video_url: e.target.value,
                              })
                            }
                            placeholder="https://example.com/video.mp4"
                            className="h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                          />
                        </div>

                        {/* Document URL */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="document_url"
                            className="text-sm font-semibold text-gray-900"
                          >
                            Document URL (Optional)
                          </Label>
                          <Input
                            id="document_url"
                            type="url"
                            value={formData.document_url}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                document_url: e.target.value,
                              })
                            }
                            placeholder="https://example.com/document.pdf"
                            className="h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                          />
                        </div>

                        {/* Important Toggle - Full width */}
                        <div className="space-y-2 md:col-span-2">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                              <Label
                                htmlFor="is_important"
                                className="text-sm font-semibold text-gray-900 cursor-pointer"
                              >
                                Mark as Important
                              </Label>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Important news will be highlighted and shown at
                                the top
                              </p>
                            </div>
                            <Switch
                              id="is_important"
                              checked={formData.is_important}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  is_important: checked,
                                })
                              }
                              className="bg-gray-300 data-[state=checked]:bg-red-600"
                            />
                          </div>
                        </div>

                        {/* Publishing Options - Full width */}
                        <div className="space-y-3 md:col-span-2">
                          <Label className="text-sm font-semibold text-gray-900">
                            Publishing Options
                          </Label>
                          <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                              <input
                                type="radio"
                                name="publish_option"
                                value="draft"
                                checked={publishOption === "draft"}
                                onChange={(e) =>
                                  setPublishOption(
                                    e.target.value as
                                      | "draft"
                                      | "now"
                                      | "scheduled"
                                  )
                                }
                                className="text-red-600 focus:ring-red-500"
                              />
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  Save as Draft
                                </span>
                                <p className="text-xs text-gray-500">
                                  Save without publishing
                                </p>
                              </div>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                              <input
                                type="radio"
                                name="publish_option"
                                value="now"
                                checked={publishOption === "now"}
                                onChange={(e) =>
                                  setPublishOption(
                                    e.target.value as
                                      | "draft"
                                      | "now"
                                      | "scheduled"
                                  )
                                }
                                className="text-red-600 focus:ring-red-500"
                              />
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  Publish Now
                                </span>
                                <p className="text-xs text-gray-500">
                                  Publish immediately and send notifications
                                </p>
                              </div>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                              <input
                                type="radio"
                                name="publish_option"
                                value="scheduled"
                                checked={publishOption === "scheduled"}
                                onChange={(e) =>
                                  setPublishOption(
                                    e.target.value as
                                      | "draft"
                                      | "now"
                                      | "scheduled"
                                  )
                                }
                                className="text-red-600 focus:ring-red-500"
                              />
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  Schedule Publishing
                                </span>
                                <p className="text-xs text-gray-500">
                                  Set a future date and time to publish
                                </p>
                              </div>
                            </label>
                          </div>

                          {publishOption === "scheduled" && (
                            <div className="mt-3">
                              <Label
                                htmlFor="scheduled_publish_at"
                                className="text-sm font-semibold text-gray-900"
                              >
                                Publish Date & Time
                                <span className="text-red-500 ml-1">*</span>
                              </Label>
                              <Input
                                id="scheduled_publish_at"
                                type="datetime-local"
                                value={formData.scheduled_publish_at}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    scheduled_publish_at: e.target.value,
                                  })
                                }
                                min={new Date().toISOString().slice(0, 16)}
                                className="mt-1 h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                                required={publishOption === "scheduled"}
                              />
                            </div>
                          )}
                        </div>

                        {/* Expiry Date - Full width */}
                        <div className="space-y-2 md:col-span-2">
                          <Label
                            htmlFor="expires_at"
                            className="text-sm font-semibold text-gray-900"
                          >
                            Expiry Date & Time
                            {(publishOption === "now" || publishOption === "scheduled") && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </Label>
                          <Input
                            id="expires_at"
                            type="datetime-local"
                            value={formData.expires_at}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                expires_at: e.target.value,
                              })
                            }
                            min={new Date().toISOString().slice(0, 16)}
                            className="h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                            required={publishOption === "now" || publishOption === "scheduled"}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {(publishOption === "now" || publishOption === "scheduled") 
                              ? "Required: Set when this news should stop appearing in the mobile app."
                              : "Set when this news should stop appearing in the mobile app. Required for publishing."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Action Buttons - Sticky at bottom */}
                  <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50/50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="px-6 py-2.5 text-sm font-medium hover:bg-white transition-all"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {editingNews ? "Update News" : "Create News"}
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search news by title, summary, or content..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-10 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Tabs */}
        <Card className="border-0 shadow-md overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full h-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-3 bg-gray-50 rounded-none">
              <TabsTrigger
                value="all"
                className="flex items-center justify-center gap-1.5 h-10 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-red-600 rounded-lg transition-all text-xs"
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span className="font-medium">All</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-gray-200 px-1.5"
                >
                  {getStatusCounts().all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="flex items-center justify-center gap-1.5 h-10 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-green-600 rounded-lg transition-all text-xs"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-medium">Active</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-gray-200 px-1.5"
                >
                  {getStatusCounts().active}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="draft"
                className="flex items-center justify-center gap-1.5 h-10 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-600 rounded-lg transition-all text-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="font-medium">Drafts</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-gray-200 px-1.5"
                >
                  {getStatusCounts().draft}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="scheduled"
                className="flex items-center justify-center gap-1.5 h-10 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 rounded-lg transition-all text-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">Scheduled</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-gray-200 px-1.5"
                >
                  {getStatusCounts().scheduled}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="expired"
                className="flex items-center justify-center gap-1.5 h-10 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-red-600 rounded-lg transition-all text-xs"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="font-medium">Expired</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-gray-200 px-1.5"
                >
                  {getStatusCounts().expired}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="p-6 pt-4">
              <div className="space-y-4">
                {filterNewsByStatus(newsUpdates).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-3">
                      <Newspaper className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                      {activeTab === "all"
                        ? "No news updates yet"
                        : `No ${activeTab} news updates`}
                    </h3>
                    <p className="text-xs text-gray-500 text-center max-w-md">
                      {activeTab === "all"
                        ? "Create your first news update to keep your team informed"
                        : `No news updates found in the ${activeTab} category`}
                    </p>
                  </div>
                ) : (
                  filterNewsByStatus(newsUpdates).map((news) => {
                    const status = getNewsStatus(news);
                    const statusConfig = {
                      active: {
                        label: "Active",
                        color: "bg-green-100 text-green-800 border-green-300",
                        icon: CheckCircle,
                      },
                      draft: {
                        label: "Draft",
                        color: "bg-gray-100 text-gray-800 border-gray-300",
                        icon: Edit,
                      },
                      scheduled: {
                        label: "Scheduled",
                        color: "bg-blue-100 text-blue-800 border-blue-300",
                        icon: Clock,
                      },
                      expired: {
                        label: "Expired",
                        color: "bg-red-100 text-red-800 border-red-300",
                        icon: AlertCircle,
                      },
                    };
                    const statusInfo =
                      statusConfig[status as keyof typeof statusConfig];
                    const StatusIcon = statusInfo.icon;

                    return (
                      <Card
                        key={news.id}
                        className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"></div>
                        <CardHeader className="pb-4 relative z-10">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            {/* Left Content */}
                            <div className="flex-1 min-w-0">
                              {/* Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                                <Badge
                                  className={`${getCategoryColor(
                                    news.category
                                  )} border font-medium text-[10px] px-2 py-0.5`}
                                >
                                  {categories.find(
                                    (c) => c.value === news.category
                                  )?.label || news.category}
                                </Badge>
                                {news.is_important && (
                                  <Badge className="bg-red-100 text-red-800 border border-red-300 font-medium text-[10px] px-2 py-0.5">
                                    <AlertCircle className="w-2.5 h-2.5 mr-1" />
                                    Important
                                  </Badge>
                                )}
                                <Badge
                                  className={`${statusInfo.color} border font-medium text-[10px] px-2 py-0.5`}
                                >
                                  <StatusIcon className="w-2.5 h-2.5 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </div>

                              {/* Title */}
                              <CardTitle className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                                {news.title}
                              </CardTitle>

                              {/* Summary */}
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {news.summary}
                              </p>

                              {/* Metadata */}
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    Created {formatDate(news.created_at)}
                                  </span>
                                </div>
                                {news.published_at && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>
                                      Published {formatDate(news.published_at)}
                                    </span>
                                  </div>
                                )}
                                {news.scheduled_publish_at && (
                                  <div className="flex items-center gap-1 text-blue-600">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      Scheduled{" "}
                                      {formatDate(news.scheduled_publish_at)}
                                    </span>
                                  </div>
                                )}
                                {news.expires_at && (
                                  <div className="flex items-center gap-1 text-orange-600">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>
                                      Expires {formatDate(news.expires_at)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Actions */}
                            <div className="flex lg:flex-col items-center lg:items-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(news)}
                                className="border-2 hover:bg-blue-50 hover:border-blue-300 h-8 text-xs"
                              >
                                <Edit className="w-3.5 h-3.5 lg:mr-1.5" />
                                <span className="hidden lg:inline">Edit</span>
                              </Button>

                              <Button
                                variant={
                                  news.is_published ? "outline" : "default"
                                }
                                size="sm"
                                onClick={() =>
                                  handlePublish(news.id, !news.is_published)
                                }
                                className={`border-2 h-8 text-xs ${
                                  news.is_published
                                    ? "hover:bg-orange-50 hover:border-orange-300"
                                    : "bg-green-600 hover:bg-green-700 text-white border-green-600"
                                }`}
                              >
                                {news.is_published ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5 lg:mr-1.5" />
                                    <span className="hidden lg:inline">
                                      Unpublish
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5 lg:mr-1.5" />
                                    <span className="hidden lg:inline">
                                      Publish
                                    </span>
                                  </>
                                )}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(news.id)}
                                className="border-2 text-red-600 hover:bg-red-50 hover:border-red-300 h-8 text-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5 lg:mr-1.5" />
                                <span className="hidden lg:inline">Delete</span>
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        {(news.content || news.external_link) && (
                          <CardContent className="pt-0 relative z-10">
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border-2 border-gray-200 space-y-3">
                              {news.content && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1 h-4 bg-red-600 rounded-full"></div>
                                    <h4 className="font-semibold text-sm text-gray-900">
                                      Full Content
                                    </h4>
                                  </div>
                                  <div
                                    className="text-gray-700 prose prose-sm max-w-none text-xs"
                                    dangerouslySetInnerHTML={{
                                      __html: news.content,
                                    }}
                                  />
                                </div>
                              )}
                              {news.external_link && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                                    <h4 className="font-semibold text-sm text-gray-900">
                                      External Link
                                    </h4>
                                  </div>
                                  <a
                                    href={news.external_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors text-xs"
                                  >
                                    <span className="break-all">
                                      {news.external_link}
                                    </span>
                                    <svg
                                      className="w-3.5 h-3.5 flex-shrink-0"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                      />
                                    </svg>
                                  </a>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {renderPagination()}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
}
