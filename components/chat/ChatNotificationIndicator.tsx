"use client";

import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

interface ChatNotificationIndicatorProps {
  unreadCount: number;
  className?: string;
}

export default function ChatNotificationIndicator({ unreadCount, className = "" }: ChatNotificationIndicatorProps) {
  if (unreadCount === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <Bell className="h-4 w-4 text-gray-600" />
      <Badge
        variant="destructive"
        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white animate-pulse"
      >
        {unreadCount > 99 ? "99+" : unreadCount}
      </Badge>
    </div>
  );
}