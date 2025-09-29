"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Star,
  MessageSquare,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Eye,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface SessionFeedback {
  id: number;
  session_id: number;
  participant_name: string;
  participant_email: string;
  session_rating: number;
  content_rating: number;
  presenter_rating: number;
  feedback_text?: string;
  submitted_at: string;
}

interface SessionStats {
  session_id: number;
  session_number: string;
  session_title: string;
  start_datetime: string;
  end_datetime: string;
  total_responses: number;
  average_session_rating: number;
  average_content_rating: number;
  average_presenter_rating: number;
  response_rate: number;
}

interface SessionFeedbackProps {
  eventId: number;
  tenantSlug: string;
}

export default function SessionFeedback({ eventId, tenantSlug }: SessionFeedbackProps) {
  const [sessionStats, setSessionStats] = useState<SessionStats[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionStats | null>(null);
  const [sessionFeedback, setSessionFeedback] = useState<SessionFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const fetchSessionStats = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/sessions/feedback/stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'X-Tenant-ID': tenantSlug,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSessionStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch session stats:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId, tenantSlug]);

  const fetchSessionFeedback = useCallback(async (sessionId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/sessions/${sessionId}/feedback`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'X-Tenant-ID': tenantSlug,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSessionFeedback(data);
      }
    } catch (error) {
      console.error("Failed to fetch session feedback:", error);
    }
  }, [eventId, tenantSlug]);

  useEffect(() => {
    fetchSessionStats();
  }, [fetchSessionStats]);

  const handleViewDetails = async (session: SessionStats) => {
    setSelectedSession(session);
    await fetchSessionFeedback(session.session_id);
    setShowDetails(true);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600 bg-green-50";
    if (rating >= 3.5) return "text-yellow-600 bg-yellow-50";
    if (rating >= 2.5) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Session Feedback</h3>
          <p className="text-sm text-gray-600 mt-1">
            View feedback and ratings for each session
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="h-4 w-4" />
          <span>{sessionStats.length} sessions</span>
        </div>
      </div>

      {sessionStats.length > 0 ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Session Rating</TableHead>
                <TableHead>Content Rating</TableHead>
                <TableHead>Presenter Rating</TableHead>
                <TableHead>Response Rate</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionStats.map((session) => (
                <TableRow key={session.session_id}>
                  <TableCell>
                    <div>
                      <Badge variant="secondary" className="text-xs mb-1">
                        {session.session_number}
                      </Badge>
                      <div className="font-medium text-sm">{session.session_title}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(session.start_datetime), "MMM dd")}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(session.start_datetime), "HH:mm")} - {format(parseISO(session.end_datetime), "HH:mm")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{session.total_responses}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(session.average_session_rating)}</div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(session.average_session_rating)}`}>
                        {session.average_session_rating.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(session.average_content_rating)}</div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(session.average_content_rating)}`}>
                        {session.average_content_rating.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(session.average_presenter_rating)}</div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(session.average_presenter_rating)}`}>
                        {session.average_presenter_rating.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={session.response_rate >= 70 ? "default" : session.response_rate >= 40 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {session.response_rate.toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(session)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No session feedback yet</h4>
          <p className="text-gray-500">Feedback will appear here once participants start rating sessions</p>
        </div>
      )}

      {/* Session Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="secondary">{selectedSession?.session_number}</Badge>
              {selectedSession?.session_title} - Detailed Feedback
            </DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedSession.total_responses}</div>
                  <div className="text-sm text-blue-700">Total Responses</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedSession.average_session_rating.toFixed(1)}</div>
                  <div className="text-sm text-green-700">Session Rating</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedSession.average_content_rating.toFixed(1)}</div>
                  <div className="text-sm text-purple-700">Content Rating</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{selectedSession.response_rate.toFixed(0)}%</div>
                  <div className="text-sm text-orange-700">Response Rate</div>
                </div>
              </div>

              {/* Individual Feedback */}
              <div>
                <h4 className="font-semibold mb-4">Individual Feedback</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {sessionFeedback.map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium">{feedback.participant_name}</div>
                          <div className="text-sm text-gray-500">{feedback.participant_email}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(parseISO(feedback.submitted_at), "MMM dd, HH:mm")}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Session</div>
                          <div className="flex items-center gap-1">
                            <div className="flex">{renderStars(feedback.session_rating)}</div>
                            <span className="text-sm font-medium">{feedback.session_rating}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Content</div>
                          <div className="flex items-center gap-1">
                            <div className="flex">{renderStars(feedback.content_rating)}</div>
                            <span className="text-sm font-medium">{feedback.content_rating}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Presenter</div>
                          <div className="flex items-center gap-1">
                            <div className="flex">{renderStars(feedback.presenter_rating)}</div>
                            <span className="text-sm font-medium">{feedback.presenter_rating}</span>
                          </div>
                        </div>
                      </div>

                      {feedback.feedback_text && (
                        <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-200">
                          <div className="text-xs text-gray-600 mb-1">Comments</div>
                          <p className="text-sm text-gray-700">{feedback.feedback_text}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}