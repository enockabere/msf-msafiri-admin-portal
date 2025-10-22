"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle, Calendar, MapPin, User, Mail, Building } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface RecommendationData {
  id: number;
  participant_name: string;
  participant_email: string;
  operation_center: string;
  event_title: string;
  event_dates: string;
  event_location: string;
  recommendation_text?: string;
  submitted_at?: string;
  registration_deadline?: string;
  already_submitted: boolean;
}

export default function LineManagerRecommendationPage() {
  const params = useParams();
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recommendationText, setRecommendationText] = useState("");
  const token = params.token as string;

  useEffect(() => {
    fetchRecommendationData();
  }, [token]);

  const fetchRecommendationData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/line-manager-recommendation/${token}`
      );
      
      if (!response.ok) {
        throw new Error("Recommendation request not found");
      }
      
      const recommendationData = await response.json();
      setData(recommendationData);
      
      if (recommendationData.recommendation_text) {
        setRecommendationText(recommendationData.recommendation_text);
      }
    } catch (error) {
      console.error("Error fetching recommendation data:", error);
      toast({
        title: "Error",
        description: "Failed to load recommendation request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!recommendationText.trim()) {
      toast({
        title: "Required Field",
        description: "Please provide your recommendation",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/line-manager-recommendation/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recommendation_text: recommendationText }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit recommendation");
      }

      toast({
        title: "Success",
        description: "Your recommendation has been submitted successfully",
      });

      await fetchRecommendationData();
    } catch (error) {
      console.error("Error submitting recommendation:", error);
      toast({
        title: "Error",
        description: "Failed to submit recommendation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Loading recommendation request...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Request Not Found
          </h1>
          <p className="text-gray-600">
            The recommendation request you're looking for doesn't exist or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-indigo-50 mb-6">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">MSF</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">
                  Médecins Sans Frontières
                </h3>
                <p className="text-xs text-gray-500">Line Manager Recommendation</p>
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
              Recommendation Request
            </CardTitle>
          </CardHeader>
        </Card>

        {data.already_submitted ? (
          <Card className="border-0 shadow-lg mb-6">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Recommendation Submitted
              </h2>
              <p className="text-gray-600 mb-4">
                Thank you! Your recommendation was submitted on{" "}
                {data.submitted_at && new Date(data.submitted_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-red-600" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Event</Label>
                    <p className="font-semibold">{data.event_title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Dates</Label>
                    <p>{data.event_dates}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{data.event_location}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-red-600" />
                    Participant Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Name</Label>
                    <p className="font-semibold">{data.participant_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{data.participant_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <span>Operation Center: {data.operation_center}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Your Recommendation</CardTitle>
                <p className="text-gray-600">
                  Please provide your recommendation for this participant's attendance at the event.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Recommendation <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    value={recommendationText}
                    onChange={(e) => setRecommendationText(e.target.value)}
                    placeholder="Please provide your detailed recommendation..."
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 h-40 resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !recommendationText.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white px-8"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit Recommendation
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}