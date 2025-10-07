"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Copy, ExternalLink, Save } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { LoadingScreen } from "@/components/ui/loading";

interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  registration_form_title?: string;
  registration_form_description?: string;
}

export default function EventRegistrationFormPage() {
  const params = useParams();
  const { apiClient } = useAuthenticatedApi();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    registration_form_title: "",
    registration_form_description: "",
  });

  const tenantSlug = params.slug as string;
  const eventId = params.eventId as string;

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const eventData = await apiClient.request<Event>(`/events/${eventId}`, {
        headers: { "X-Tenant-ID": tenantSlug },
      });

      setEvent(eventData);
      setFormData({
        registration_form_title: eventData.registration_form_title || `${eventData.title} - Registration Form`,
        registration_form_description: eventData.registration_form_description || generateDefaultDescription(eventData),
      });
    } catch (error) {
      console.error("Error fetching event:", error);
      toast({
        title: "Error",
        description: "Failed to fetch event details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultDescription = (event: Event) => {
    return `<p>Dear colleague,</p>
<p>Congratulations on your selection for the <strong>${event.title}</strong>, taking place on <strong>${new Date(event.start_date).toLocaleDateString()} - ${new Date(event.end_date).toLocaleDateString()}</strong> in <strong>${event.location}</strong>.</p>
<p>Please complete the form below to enable prompt organisation of your travel.</p>

<h3>OCA STAFF</h3>
<p>Unless you are not currently linked to a project or assignment, your HRCO is responsible for booking your travel.</p>

<h3>NON-OCA STAFF</h3>
<p>You should discuss with your OC L&D or country program how you will travel to this training.</p>

<h3>ALL STAFF</h3>
<p>Please read the instructions carefully and follow them accordingly.</p>`;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.request(`/events/${eventId}`, {
        method: "PUT",
        headers: { "X-Tenant-ID": tenantSlug },
        body: JSON.stringify(formData),
      });

      toast({
        title: "Success",
        description: "Registration form settings saved successfully",
      });

      await fetchEvent();
    } catch (error) {
      console.error("Error saving form settings:", error);
      toast({
        title: "Error",
        description: "Failed to save registration form settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPublicFormUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/event-registration/${eventId}`;
  };

  const copyFormUrl = () => {
    const url = getPublicFormUrl();
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Registration form URL copied to clipboard",
    });
  };

  const openFormPreview = () => {
    const url = getPublicFormUrl();
    window.open(url, "_blank");
  };

  if (loading) {
    return <LoadingScreen message="Loading event details..." />;
  }

  if (!event) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
            <p className="text-gray-600">The event you're looking for doesn't exist.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Registration Form Settings</h1>
              <p className="text-gray-600">{event.title}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={openFormPreview}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Preview Form
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Settings
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Public Registration Form URL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  value={getPublicFormUrl()}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyFormUrl}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Share this URL with participants to allow them to register without authentication.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Customization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Form Title</Label>
                <Input
                  id="title"
                  value={formData.registration_form_title}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      registration_form_title: e.target.value
                    }))
                  }
                  placeholder="Enter form title"
                />
              </div>

              <div>
                <Label htmlFor="description">Form Description</Label>
                <p className="text-sm text-gray-500 mb-2">
                  You can use HTML tags for formatting. This will appear at the top of the registration form.
                </p>
                <Textarea
                  id="description"
                  value={formData.registration_form_description}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      registration_form_description: e.target.value
                    }))
                  }
                  placeholder="Enter form description with HTML formatting"
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50">
                <h2 className="text-xl font-bold text-center mb-2">
                  {formData.registration_form_title}
                </h2>
                <div className="text-sm text-gray-600 mb-4">
                  <p className="text-center mb-2">The survey will take approximately 8 minutes to complete.</p>
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <span>📅 {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
                    <span>📍 {event.location}</span>
                  </div>
                </div>
                <div 
                  className="prose max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: formData.registration_form_description }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}