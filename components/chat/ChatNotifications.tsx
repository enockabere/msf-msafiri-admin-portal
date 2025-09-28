"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  BellOff, 
  MessageSquare, 
  X
} from "lucide-react";
import { useChatNotifications } from "@/hooks/useChatNotifications";

interface ChatNotificationsProps {
  tenantSlug: string;
  className?: string;
}

export default function ChatNotifications({ tenantSlug, className = "" }: ChatNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);

  
  const { 
    unreadCount, 
    isConnected,
    clearAll,
    requestNotificationPermission
  } = useChatNotifications({ tenantSlug, enabled: true });

  const handleNotificationClick = async () => {

    
    if (!isOpen) {
      await requestNotificationPermission();
    }
    setIsOpen(!isOpen);
  };



  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNotificationClick}
        className="relative"
      >
        {isConnected ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5 text-gray-400" />}
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center p-0">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notifications Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 z-50 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Chat Messages</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto bg-white">
              {unreadCount === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No new messages</p>
                </div>
              ) : (
                <div className="p-3">
                  <div className="text-center">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm font-medium text-gray-900">
                      You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Open chat to view messages
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}