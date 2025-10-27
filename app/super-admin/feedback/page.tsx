"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useAuthenticatedApi } from "@/lib/auth";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, TrendingUp, Users, Filter, ArrowLeft, RefreshCw } from "lucide-react";

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
  const router = useRouter();
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    // Don't redirect while auth is loading
    if (authLoading) return;
    
    // Only redirect if we're sure user is not super admin
    if (user && !isSuperAdmin && user?.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }
    
    // Fetch data if user is super admin
    if (user && (isSuperAdmin || user?.role === "super_admin")) {
      fetchFeedbackData();
    }
  }, [user, isSuperAdmin, authLoading, router]);

  const fetchFeedbackData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

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
      setRefreshing(false);
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

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-red-100 border-t-red-600 mx-auto"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
            <p className="text-sm text-gray-500">Verifying permissions</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  // Show access denied only if we're sure user is not super admin
  if (user && !isSuperAdmin && user?.role !== "super_admin") {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <p className="text-gray-500">Access denied. Super admin privileges required.</p>
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {loading ? (
          <>
            {/* Skeleton Header */}
            <div className="bg-gradient-to-br from-red-600 via-red-700 to-orange-600 rounded-2xl shadow-xl animate-pulse">
              <div className="p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl"></div>
                      <div>
                        <div className="h-6 bg-white/30 rounded w-32 mb-2"></div>
                        <div className="h-4 bg-white/20 rounded w-48"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mt-4">
                      <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                        <div className="h-6 bg-white/20 rounded w-12 mb-1"></div>
                        <div className="h-3 bg-white/20 rounded w-16"></div>
                      </div>
                      <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                        <div className="h-6 bg-white/20 rounded w-12 mb-1"></div>
                        <div className="h-3 bg-white/20 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-12 bg-white/10 rounded w-24"></div>
                    <div className="h-12 bg-white rounded w-32"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skeleton Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-0 shadow-lg animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-20 mb-3"></div>
                        <div className="h-8 bg-gray-300 rounded w-12 mb-2"></div>
                        <div className="h-2 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Skeleton Filter */}
            <Card className="border-0 shadow-md animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div className="h-10 bg-gray-200 rounded-lg w-48"></div>
                  <div className="h-6 bg-gray-200 rounded w-32 ml-auto"></div>
                </div>
              </CardContent>
            </Card>

            {/* Skeleton Feedback Items */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="border-0 shadow-md animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
                        <div className="h-6 bg-gray-200 rounded-lg w-20"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-xl p-5">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Modern Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-orange-600 rounded-2xl shadow-xl">
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
              </div>

              <div className="relative p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Title Section */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-white">App Feedback</h1>
                        <p className="text-sm text-red-100 mt-1">Monitor user feedback and ratings to improve the mobile experience</p>
                      </div>
                    </div>

                    {/* Quick Stats in Header */}
                    {stats && (
                      <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                          <Users className="w-5 h-5 text-white" />
                          <div>
                            <div className="text-xl font-bold text-white">{stats.total_feedback}</div>
                            <div className="text-xs text-red-100">Total Feedback</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                          <Star className="w-5 h-5 text-yellow-300" />
                          <div>
                            <div className="text-xl font-bold text-white">
                              {(typeof stats.average_rating === 'number' ? stats.average_rating.toFixed(1) : "0.0")}
                            </div>
                            <div className="text-xs text-red-100">Avg Rating</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Button
                      onClick={() => fetchFeedbackData(true)}
                      disabled={refreshing}
                      className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/20 shadow-lg h-12 px-6"
                    >
                      {refreshing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => router.push("/dashboard")}
                      className="bg-white text-red-600 hover:bg-red-50 shadow-lg font-semibold h-12 px-6"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Refreshing Overlay */}
            {refreshing && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-100 border-t-red-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-red-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">Refreshing feedback...</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait</p>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Stats Cards */}
            {stats && (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-300 ${refreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {/* Total Feedback Card */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Total Feedback</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_feedback}</p>
                        <p className="text-xs text-gray-500 mt-1">All-time submissions</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-7 h-7 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Average Rating Card */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-yellow-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Average Rating</p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-3xl font-bold text-gray-900">
                            {(typeof stats.average_rating === 'number' ? stats.average_rating.toFixed(1) : "0.0")}
                          </p>
                          <div className="flex gap-0.5">
                            {renderStars(Math.round(stats.average_rating || 0))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Out of 5 stars</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Star className="w-7 h-7 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 5-Star Ratings Card */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">5-Star Ratings</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                          {stats.rating_distribution["5"] || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Excellent reviews</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-7 h-7 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bug Reports Card */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Bug Reports</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">
                          {stats.category_distribution["bug_report"] || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Issues reported</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-7 h-7 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Enhanced Filter Section */}
            <Card className={`border-0 shadow-md transition-opacity duration-300 ${refreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-orange-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Filter className="w-5 h-5 text-red-600" />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="flex-1 sm:flex-none border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-900 bg-white hover:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                    <MessageSquare className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      <span className="text-red-600 font-bold">{filteredFeedback.length}</span> of {feedback.length} items
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Feedback List */}
            <div className={`space-y-4 transition-all duration-300 ${refreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {filteredFeedback.length === 0 ? (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">No feedback available</p>
                    <p className="text-sm text-gray-500">No feedback found for the selected category</p>
                  </CardContent>
                </Card>
              ) : (
                filteredFeedback.map((item) => {
                  const ratingColor = item.rating >= 4 ? 'green' : item.rating >= 3 ? 'yellow' : 'red';
                  const gradientBg = item.rating >= 4
                    ? 'from-green-50 to-emerald-50'
                    : item.rating >= 3
                    ? 'from-yellow-50 to-amber-50'
                    : 'from-red-50 to-rose-50';

                  return (
                    <Card key={item.id} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms' }}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradientBg} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                      <CardContent className="p-6 relative">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                          {/* Rating and Category Section */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                            <div className={`flex items-center gap-2 bg-gradient-to-br from-${ratingColor}-100 to-${ratingColor}-200 px-4 py-2.5 rounded-xl border border-${ratingColor}-300 shadow-sm`}>
                              <div className="flex gap-0.5">
                                {renderStars(item.rating)}
                              </div>
                              <span className={`font-bold text-lg ${getRatingColor(item.rating)}`}>
                                {item.rating}
                              </span>
                            </div>
                            <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 text-sm font-semibold rounded-lg border border-gray-300 shadow-sm">
                              {categoryLabels[item.category] || item.category}
                            </span>
                          </div>

                          {/* User Info Section */}
                          <div className="flex items-center gap-3 lg:text-right">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-orange-200 rounded-xl flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{item.user_name || item.user_email}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(item.updated_at || item.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Feedback Text Section */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                          <p className="text-gray-800 leading-relaxed text-sm">{item.feedback_text}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
}