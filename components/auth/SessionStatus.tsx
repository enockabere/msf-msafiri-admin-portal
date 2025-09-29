"use client";

import { useSessionManager } from "@/hooks/useSessionManager";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function SessionStatus() {
  const { sessionState, refreshSession, isAuthenticated } = useSessionManager();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isAuthenticated || !sessionState.isExpiring) {
    return null;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="border-yellow-200 bg-yellow-50">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <p className="font-medium text-sm">Session expiring soon</p>
              {sessionState.timeUntilExpiry && (
                <p className="text-xs">
                  Time remaining: {formatTimeRemaining(sessionState.timeUntilExpiry)}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs h-7 px-2"
            >
              {isRefreshing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                "Extend"
              )}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}