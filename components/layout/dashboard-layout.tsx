"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "./sidebar";
import Navbar from "./navbar";
import QuickLinksFloat from "@/components/QuickLinksFloat";
import { SuperAdminFooter } from "./SuperAdminFooter";
import { useTheme } from "next-themes";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const isTenantPath = pathname?.startsWith('/tenant/');

  // Check if we're on a tenant dashboard route
  const isTenantDashboard = pathname?.startsWith('/tenant/');

  // Super admins get a different layout (no sidebar) unless on tenant dashboard
  if (user?.role === "super_admin" && !isTenantDashboard) {
    return <>{children}</>;
  }

  // Regular admins get the traditional sidebar layout
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Navbar />
          <main className="flex-1 p-6 overflow-y-auto" style={{
            backgroundColor: mounted ? (isDark ? '#000000' : '#ffffff') : '#ffffff'
          }}>
            {children}
          </main>
          {isTenantPath && <SuperAdminFooter />}
        </SidebarInset>
      </div>
      {isTenantPath && <QuickLinksFloat />}
    </SidebarProvider>
  );
}
