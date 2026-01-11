import { ReactNode } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";

interface TenantLayoutProps {
  children: ReactNode;
}

export default function TenantLayout({ children }: TenantLayoutProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}