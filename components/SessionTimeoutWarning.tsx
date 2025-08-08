"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Clock } from "lucide-react";

interface SessionTimeoutWarningProps {
  warningMinutes?: number; // Show warning X minutes before expiry
  sessionDurationMinutes?: number; // Total session duration
}

export function SessionTimeoutWarning({
  warningMinutes = 5,
  sessionDurationMinutes = 30,
}: SessionTimeoutWarningProps) {
  const { data: session, update } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!session) return;

    const checkSessionExpiry = () => {
      const now = new Date().getTime();
      const sessionExpiry = new Date(session.expires).getTime();
      const warningTime = sessionExpiry - warningMinutes * 60 * 1000;

      const timeUntilExpiry = Math.max(0, sessionExpiry - now);
      const timeUntilWarning = Math.max(0, warningTime - now);

      setTimeLeft(Math.floor(timeUntilExpiry / 1000));

      // Show warning if we're within the warning period and session hasn't expired
      if (timeUntilWarning <= 0 && timeUntilExpiry > 0) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    // Check immediately and then every 30 seconds
    checkSessionExpiry();
    const interval = setInterval(checkSessionExpiry, 30000);

    return () => clearInterval(interval);
  }, [session, warningMinutes, sessionDurationMinutes]);

  const handleExtendSession = async () => {
    try {
      // Refresh the session
      await update();
      setShowWarning(false);

      // Optional: Make a request to your API to refresh the token
      // You might want to call a refresh endpoint here
    } catch (error) {
      console.error("Failed to extend session:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!showWarning) return null;

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Session Timeout Warning</span>
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>Your session will expire soon due to inactivity.</p>
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              <span>Time remaining: {formatTime(timeLeft)}</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowWarning(false)}
            className="flex-1"
          >
            Dismiss
          </Button>
          <Button
            onClick={handleExtendSession}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
