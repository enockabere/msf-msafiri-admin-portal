"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "@/components/ui/toast";

export default function SessionTimeoutHandler() {
  const pathname = usePathname();

  // Don't render on public pages
  const isPublicRoute = pathname?.startsWith('/public') || pathname === '/login' || pathname === '/';

  if (isPublicRoute) {
    return null;
  }

  return <SessionTimeoutHandlerInner />;
}

function SessionTimeoutHandlerInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  useEffect(() => {

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (status === 'authenticated' && session) {
      // Set timeout for 25 minutes (5 minutes before session expires)
      const timeoutDuration = 25 * 60 * 1000; // 25 minutes
      
      timeoutRef.current = setTimeout(() => {
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          toast({
            title: "Session Expiring Soon",
            description: "Your session will expire in 5 minutes. Please save your work.",
            variant: "destructive",
          });
          
          // Auto logout after 5 more minutes
          setTimeout(() => {
            signOut({ callbackUrl: '/login?message=session_expired' });
          }, 5 * 60 * 1000);
        }
      }, timeoutDuration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [session, status, pathname]);

  // Handle session errors
  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/login' && pathname !== '/') {
      router.push('/login?message=session_expired');
    }
  }, [status, pathname, router]);

  return null;
}
