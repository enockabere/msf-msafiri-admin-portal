"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuthenticatedApi } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Share2,
  Eye,
  Clock,
  AlertCircle,
  X,
  ArrowUp,
} from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { LoadingScreen } from "@/components/ui/loading";
import FormBuilder from "@/components/forms/FormBuilder";
import ShareModal from "@/components/events/ShareModal";

// Add after other imports

interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  registration_form_title?: string;
  registration_form_description?: string;
  registration_deadline?: string;
}

interface Tenant {
  id: number;
  name: string;
  slug: string;
  country?: string;
  timezone?: string;
}

export default function EventRegistrationFormPage() {
  const params = useParams();
  const { apiClient } = useAuthenticatedApi();
  const [event, setEvent] = useState<Event | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const tenantSlug = params.slug as string;
  const eventId = params.eventId as string;

  const fetchEvent = useCallback(async () => {
    try {
      const [eventData, tenantData] = await Promise.all([
        apiClient.request<Event>(`/events/${eventId}?tenant=${tenantSlug}`),
        apiClient.request<Tenant>(`/tenants/slug/${tenantSlug}`)
      ]);

      setEvent(eventData);
      setTenant(tenantData);
    } catch (error: any) {
      const errorMessage = error?.message || error?.detail || "Failed to fetch event details";
      sonnerToast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [apiClient, eventId, tenantSlug]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Scroll-to-top button visibility - Find the actual scrolling element
  useEffect(() => {
    let scrollContainer: any = null;

    const handleScroll = () => {
      // Get scroll position from all possible containers
      const windowScrollY = window.scrollY || window.pageYOffset;
      const main = document.querySelector('main');
      const mainScrollY = main ? (main as HTMLElement).scrollTop : 0;
      const containerScrollY = (scrollContainer && scrollContainer !== window) ? scrollContainer.scrollTop : 0;

      // Use the maximum scroll value
      const scrollY = Math.max(windowScrollY, mainScrollY, containerScrollY);
      setShowScrollTop(scrollY > 400);
    };

    // Setup with delay to ensure DOM is ready
    setTimeout(() => {
      const main = document.querySelector('main');
      scrollContainer = (main && main.scrollHeight > main.clientHeight) ? main : window;
      handleScroll();

      // Add listeners to multiple potential scroll containers
      window.addEventListener('scroll', handleScroll, { passive: true });
      if (scrollContainer && scrollContainer !== window) {
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      }
      if (main && main !== scrollContainer) {
        main.addEventListener('scroll', handleScroll, { passive: true });
      }
    }, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollContainer && scrollContainer !== window) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      const main = document.querySelector('main');
      if (main && main !== scrollContainer) {
        main.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const main = document.querySelector('main');
    if (main) {
      (main as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading event details..." />;
  }

  if (!event) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Event Not Found
          </h1>
          <p className="text-gray-600">
            The event you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </ProtectedRoute>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const publicUrl = `${baseUrl}/public/event-registration/${eventId}`;

  const handlePreview = () => {
    
    const newWindow = window.open(publicUrl, "_blank");

    if (!newWindow) {
      console.error('❌ Failed to open new window (popup blocked?)');
      sonnerToast.error("Preview Failed", {
        description: "Popup was blocked. Please allow popups for this site.",
      });
    } else {
      console.log('✅ Preview window opened successfully');
    }

    console.log('👁️ ============ PREVIEW COMPLETE ============');
  };

  const isDeadlinePassed = event?.registration_deadline && new Date() > new Date(event.registration_deadline);

  return (
    <ProtectedRoute>
      <div className="w-full max-w-none mx-auto px-1 sm:px-2 lg:px-4 xl:px-6 py-6 space-y-6">
        {/* Event Header */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-indigo-50">
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{tenantSlug.toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">
                      {tenantSlug.toUpperCase() === 'OCA' ? 'Médecins Sans Frontières' : tenantSlug.toUpperCase()}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Registration Portal
                    </p>
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {event.registration_form_title ||
                    `${event.title} - Application Form`}
                </CardTitle>
                <p className="text-sm text-gray-600 mb-4">
                  Complete the application form below. Takes approximately 8
                  minutes.
                </p>
              </div>
              <div className="flex gap-2 self-start">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = `/tenant/${tenantSlug}/events`}
                  className="flex items-center gap-2 bg-white"
                >
                  <X className="w-4 h-4" />
                  Close
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  disabled={!!isDeadlinePassed}
                  className="flex items-center gap-2 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isDeadlinePassed ? "Registration deadline has passed" : "Preview registration form"}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareModal(true)}
                  disabled={!!isDeadlinePassed}
                  className="flex items-center gap-2 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isDeadlinePassed ? "Registration deadline has passed" : "Share registration form"}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                <Calendar className="w-4 h-4 text-red-600" />
                <span>
                  {new Date(event.start_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(event.end_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>{event.location}</span>
              </div>
              {event.registration_deadline && (
                <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg text-red-700">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">
                    Application Deadline:{" "}
                    {new Date(event.registration_deadline).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}{" "}
                    at{" "}
                    {new Date(event.registration_deadline).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }
                    )}{" "}
                    <span className="text-red-600 font-normal">
                      ({tenant?.timezone || 'Local timezone'})
                    </span>
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

          {/* Admin Preview Banner */}
          <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Admin Preview Mode</h3>
                <p className="text-sm text-blue-700">
                  You can navigate through all form steps without filling required fields. This form cannot be submitted.
                </p>
              </div>
            </div>
          </div>

          <ShareModal
            open={showShareModal}
            onOpenChange={setShowShareModal}
            publicUrl={publicUrl}
            event={event}
            tenant={tenant}
            apiClient={apiClient}
            eventId={eventId}
          />

          {/* Form Builder */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl text-gray-900">Form Builder</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Customize your event registration form by adding, editing, or removing fields
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <FormBuilder eventId={parseInt(eventId)} onSave={() => window.location.reload()} />
            </CardContent>
          </Card>

        {/* Floating Scroll-to-Top Button */}
        <Button
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 z-[9999] w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl transition-all duration-300 hover:scale-110 ${showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          size="icon"
          aria-label="Scroll to top"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999,
          }}
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      </div>
    </ProtectedRoute>
  );
}
