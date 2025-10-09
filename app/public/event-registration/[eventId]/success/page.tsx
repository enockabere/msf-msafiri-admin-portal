"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, MapPin, Mail } from "lucide-react";

interface Event {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
}

export default function RegistrationSuccessPage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const eventId = params.eventId as string;

  const fetchEvent = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/public`
      );
      if (response.ok) {
        const eventData = await response.json();
        setEvent(eventData);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Registration Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-600">
              Thank you for registering for the event. Your registration has been received and is being processed.
            </p>

            {event && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
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
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 mb-2">
                <Mail className="w-4 h-4" />
                <span className="font-medium">What&apos;s Next?</span>
              </div>
              <p className="text-sm text-blue-700">
                You will receive a confirmation email with further details about the event, including travel arrangements and accommodation information.
              </p>
            </div>

            <p className="text-xs text-gray-500">
              If you have any questions, please contact the event organizers.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}