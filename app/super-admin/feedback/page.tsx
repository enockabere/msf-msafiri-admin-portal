"use client";

import { useEffect, useState } from "react";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, TrendingUp, Users, Filter } from "lucide-react";

interface FeedbackItem {
  id: number;
  rating: number;
  category: string;
  feedback_text: string;
  created_at: string;
  updated_at?: string;
  user_email?: string;
  user_name?: string;
}

interface FeedbackStats {
  total_feedback: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
}

const categoryLabels: Record<string, string> = {
  user_experience: "User Experience",
  performance: "Performance", 
  features: "Features",
  bug_report: "Bug Report",
  suggestion: "Suggestion",
  general: "General",
};

export default function FeedbackPage() {
  const { user } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchFeedbackData();
    }
  }, [user]);

  const fetchFeedbackData = async () => {
    try {
      const token = apiClient.getToken();
      if (!token) return;

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch feedback and stats
      const [feedbackResponse, statsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/app-feedback/all`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/app-feedback/stats`, { headers })
      ]);

      if (feedbackResponse.ok && statsResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        const statsData = await statsResponse.json();
        
        setFeedback(feedbackData);
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = selectedCategory === "all" 
    ? feedback 
    : feedback.filter(item => item.category === selectedCategory);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  if (user?.role !== "super_admin") {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Access denied. Super admin privileges required.</p>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-600 via-red-700 to-orange-600 rounded-2xl shadow-xl p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">App Feedback</h1>
              <p className="text-sm text-red-100 mt-0.5">User feedback and ratings for the mobile app</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-red-100 border-t-red-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total_feedback}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Rating</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-gray-900">
                            {(typeof stats.average_rating === 'number' ? stats.average_rating.toFixed(1) : "0.0")}
                          </p>
                          <div className="flex">
                            {renderStars(Math.round(stats.average_rating || 0))}
                          </div>
                        </div>
                      </div>
                      <Star className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">5-Star Ratings</p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats.rating_distribution["5"] || 0}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Bug Reports</p>
                        <p className="text-2xl font-bold text-red-600">
                          {stats.category_distribution["bug_report"] || 0}
                        </p>
                      </div>
                      <MessageSquare className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500">
                    Showing {filteredFeedback.length} of {feedback.length} feedback items
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Feedback List */}
            <div className="space-y-4">
              {filteredFeedback.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No feedback available</p>
                  </CardContent>
                </Card>
              ) : (
                filteredFeedback.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex">
                            {renderStars(item.rating)}
                          </div>
                          <span className={`font-semibold ${getRatingColor(item.rating)}`}>
                            {item.rating}/5
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {categoryLabels[item.category] || item.category}
                          </span>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{item.user_name || item.user_email}</p>
                          <p>{new Date(item.updated_at || item.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed">{item.feedback_text}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
}