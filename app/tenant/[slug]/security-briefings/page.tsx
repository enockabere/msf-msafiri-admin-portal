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
import { Shield, Plus, Trash2, FileText, Video } from "lucide-react";
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
    event_id: ""
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const tenantSlug = params.slug as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch events for dropdown
        const eventsData = await apiClient.request<Event[]>(`/events/?tenant=${tenantSlug}`);
        setEvents(eventsData);
        
        // Fetch security briefings
        const briefingsData = await apiClient.request<SecurityBriefing[]>(`/security-briefings/?tenant=${tenantSlug}`);
        setBriefings(briefingsData);
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
  }, [user?.email, authLoading, apiClient, tenantSlug]);

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
      
      await apiClient.request(`/security-briefings/?tenant=${tenantSlug}`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      setShowCreateModal(false);
      setFormData({ title: "", brief_type: "general", content_type: "text", content: "", event_id: "" });
      
      // Refetch data
      const eventsData = await apiClient.request<Event[]>(`/events/?tenant=${tenantSlug}`);
      setEvents(eventsData);
      const briefingsData = await apiClient.request<SecurityBriefing[]>(`/security-briefings/?tenant=${tenantSlug}`);
      setBriefings(briefingsData);
      
      toast({
        title: "Success",
        description: "Security briefing created successfully",
      });
    } catch (error) {
      console.error("Create briefing error:", error);
      toast({
        title: "Error",
        description: "Failed to create security briefing",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBriefing = async (briefingId: number) => {
    const { default: Swal } = await import('sweetalert2');
    
    const result = await Swal.fire({
      title: 'Delete Security Briefing?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.request(`/security-briefings/${briefingId}?tenant=${tenantSlug}`, {
        method: 'DELETE',
      });
      
      // Refetch data
      const briefingsData = await apiClient.request<SecurityBriefing[]>(`/security-briefings/?tenant=${tenantSlug}`);
      setBriefings(briefingsData);
      
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
              <h1 className="text-2xl font-bold text-gray-900">Security Briefings</h1>
              <p className="text-gray-600">Manage security briefings for events</p>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)} 
              className="gap-2 bg-red-600 hover:bg-red-700 text-white h-9 px-4 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Briefing
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {briefings.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Shield className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No security briefings found</h3>
                    <p className="text-gray-600 text-center mb-4">
                      Get started by creating your first security briefing
                    </p>
                    <Button onClick={() => setShowCreateModal(true)} className="bg-red-600 hover:bg-red-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Briefing
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              briefings.map((briefing) => (
                <Card key={briefing.id} className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-red-50">
                  <CardContent className="p-6">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-red-200 shadow-sm">
                          <Shield className="w-6 h-6 text-red-700" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800 mb-1">{briefing.title}</h3>
                          <p className="text-sm text-gray-600">{briefing.event_title}</p>
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`px-2 py-1 text-xs font-medium ${
                            briefing.brief_type === 'general' 
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}>
                            {briefing.brief_type === 'general' ? 'General' : 'Event-Specific'}
                          </Badge>
                          <Badge className={`px-2 py-1 text-xs font-medium ${
                            briefing.content_type === 'text' 
                              ? 'bg-gray-100 text-gray-800 border-gray-200'
                              : 'bg-purple-100 text-purple-800 border-purple-200'
                          }`}>
                            {briefing.content_type === 'text' ? (
                              <><FileText className="w-3 h-3 mr-1" />Text</>
                            ) : (
                              <><Video className="w-3 h-3 mr-1" />Video</>
                            )}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-700 line-clamp-3">
                          {briefing.content}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-red-100">
                        <div className="text-xs text-gray-500">
                          Created {new Date(briefing.created_at).toLocaleDateString()}
                        </div>
                        <Button
                          onClick={() => handleDeleteBriefing(briefing.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Security Briefing</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter briefing title"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Briefing Type
                </label>
                <select
                  value={formData.brief_type}
                  onChange={(e) => setFormData({ ...formData, brief_type: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="text">Text</option>
                  <option value="video">Video URL</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={formData.content_type === 'video' ? 'Enter video URL' : 'Enter briefing content'}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBriefing}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {submitting ? "Creating..." : "Create Briefing"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}