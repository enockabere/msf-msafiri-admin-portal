"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NotificationProvider } from "@/context/NotificationContext";
import { useAuth } from "@/lib/auth";

import {
  Bell,
  Search,
  Filter,
  CheckCheck,
  AlertTriangle,
  Info,
  Check,
  X,
  Clock,
  RefreshCw,
  Loader2,
  MessageCircle,
  Archive,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationContext } from "@/context/NotificationContext";
import { NotificationPriority } from "@/lib/api";

function NotificationsContent() {
  const params = useParams();
  const tenantSlug = params.slug as string;
  
  const { notifications, stats, loading, markAsRead: markAsReadHook, markAllAsRead: markAllAsReadHook, refetch } =
    useNotifications();
  const { decrementUnread, markAllRead: markAllReadContext } = useNotificationContext();

  const markAsRead = async (notificationId: number) => {
    await markAsReadHook(notificationId);
    decrementUnread();
  };

  const markAllAsRead = async () => {
    await markAllAsReadHook();
    markAllReadContext();
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const getNotificationIcon = (priority: string) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case NotificationPriority.HIGH:
        return <X className="h-4 w-4 text-orange-500" />;
      case NotificationPriority.LOW:
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
            Urgent
          </Badge>
        );
      case NotificationPriority.HIGH:
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
            High
          </Badge>
        );
      case NotificationPriority.LOW:
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            Low
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
            Medium
          </Badge>
        );
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority =
      filterPriority === "all" || notification.priority === filterPriority;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "read" && notification.is_read) ||
      (filterStatus === "unread" && !notification.is_read);

    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header Section - Match badges page design */}
      <Card className="relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent dark:from-red-400/20 dark:via-red-400/10 dark:to-transparent"></div>
        <div className="relative p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 group-hover:scale-110 transition-all duration-300">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-medium text-gray-900 dark:text-white">Notifications</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Manage system alerts and updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="border-gray-300 hover:bg-gray-50 px-3 py-2 text-xs"
              >
                <RefreshCw className={`w-3 h-3 mr-2 ${loading || refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {(stats?.unread ?? 0) > 0 && (
                <Button
                  onClick={markAllAsRead}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-3 py-2 text-xs"
                >
                  <CheckCheck className="w-3 h-3 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <MessageCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Unread</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.unread || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Urgent</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats?.urgent || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Archive className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Read</p>
                <p className="text-2xl font-bold text-green-600">
                  {(stats?.total || 0) - (stats?.unread || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value={NotificationPriority.URGENT}>Urgent</option>
              <option value={NotificationPriority.HIGH}>High</option>
              <option value={NotificationPriority.MEDIUM}>Medium</option>
              <option value={NotificationPriority.LOW}>Low</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Recent Notifications
            </CardTitle>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {filteredNotifications.length} items
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Loading notifications...
                </p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                No notifications found
              </p>
              <p className="text-xs text-gray-500">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group p-4 border rounded-lg transition-all duration-200 hover:shadow-sm hover:border-gray-300 ${
                    !notification.is_read
                      ? "bg-blue-50/50 border-blue-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.priority)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>

                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatTimeAgo(notification.created_at)}
                              </span>
                            </div>
                            <span>•</span>
                            <span className="capitalize">
                              {notification.notification_type.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getPriorityBadge(notification.priority)}
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TenantNotificationsPage() {
  return (
    <NotificationProvider>
      <NotificationsContent />
    </NotificationProvider>
  );
}