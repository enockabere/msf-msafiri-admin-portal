"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function SessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname?.startsWith("/public");

  // For public routes, don't use SessionProvider to avoid auth API calls
  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <NextAuthSessionProvider basePath="/portal/api/auth">
      {children}
    </NextAuthSessionProvider>
  );
}
