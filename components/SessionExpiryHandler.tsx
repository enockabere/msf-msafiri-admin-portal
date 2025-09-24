"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export function SessionExpiryHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only run on client side to avoid SSG issues
    if (typeof window === "undefined") return;

    const sessionExpired = searchParams.get("sessionExpired");
    const reason = searchParams.get("reason");

    if (sessionExpired === "true") {
      // Determine the message based on reason
      let message = "Your session has expired. Please log in again.";
      let description = "Security timeout";

      if (reason === "inactivity") {
        message =
          "Your session has expired due to inactivity. Please log in again.";
        description = "Security timeout";
      } else if (reason === "error") {
        message = "A session error occurred. Please log in again.";
        description = "Authentication error";
      }

      toast.error(
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{message}</span>
        </div>,
        {
          duration: 5000,
          description: description,
        }
      );

      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("sessionExpired");
      newUrl.searchParams.delete("reason");

      // Use window.history to avoid potential router issues during SSG
      window.history.replaceState({}, "", newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

  return null;
}
