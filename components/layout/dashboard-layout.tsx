"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useSidebar } from "@/contexts/SidebarContext";
import Sidebar from "./sidebar";
import Navbar from "./navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();

  // Check if we're on a tenant dashboard route
  const isTenantDashboard = pathname?.startsWith('/tenant/');

  // Super admins get a different layout (no sidebar) unless on tenant dashboard
  if (user?.role === "super_admin" && !isTenantDashboard) {
    return <>{children}</>;
  }

  // Regular admins get the traditional sidebar layout
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar
        collapsed={collapsed}
        toggleCollapse={toggleCollapsed}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-950">{children}</main>
      </div>
    </div>
  );
}
