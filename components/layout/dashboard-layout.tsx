"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "./sidebar";
import Navbar from "./navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  // Check if we're on a tenant dashboard route
  const isTenantDashboard = pathname?.startsWith('/tenant/');

  // Super admins get a different layout (no sidebar) unless on tenant dashboard
  if (user?.role === "super_admin" && !isTenantDashboard) {
    return <>{children}</>;
  }

  // Regular admins get the traditional sidebar layout
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
