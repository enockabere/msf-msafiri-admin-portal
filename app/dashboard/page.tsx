"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import StatsCards from "@/components/dashboard/stats-cards";
import RecentActivities from "@/components/dashboard/recent-activities";
import QuickActions from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <StatsCards />
        <RecentActivities />
        <QuickActions />
      </div>
    </DashboardLayout>
  );
}
