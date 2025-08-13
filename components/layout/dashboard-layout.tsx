"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import Sidebar from "./sidebar";
import Navbar from "./navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  // Super admins get a different layout (no sidebar)
  if (user?.role === "super_admin") {
    return <>{children}</>;
  }

  // Regular admins get the traditional sidebar layout
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
