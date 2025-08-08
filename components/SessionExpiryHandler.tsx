// SessionExpiryHandler.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export function SessionExpiryHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionExpired = searchParams.get("sessionExpired");

    if (sessionExpired === "true") {
      toast.error(
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">
            Your session has expired due to inactivity. Please log in again.
          </span>
        </div>,
        {
          duration: 5000,
          description: "Security timeout",
        }
      );

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("sessionExpired");
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
