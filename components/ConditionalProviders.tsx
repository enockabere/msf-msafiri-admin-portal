"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "@/components/SessionProvider";
import { TenantProvider } from "@/context/TenantContext";
import { ToastContainer } from "@/components/ui/toast";
import { NavigationLoader } from "@/components/ui/loading";
import SessionTimeoutHandler from "@/components/auth/SessionTimeoutHandler";

export function ConditionalProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname?.startsWith('/public');

  if (isPublicRoute) {
    return (
      <>
        {children}
        <ToastContainer />
      </>
    );
  }

  return (
    <SessionProvider>
      <TenantProvider>
        <SessionTimeoutHandler />
        <NavigationLoader />
        {children}
        <ToastContainer />
      </TenantProvider>
    </SessionProvider>
  );
}