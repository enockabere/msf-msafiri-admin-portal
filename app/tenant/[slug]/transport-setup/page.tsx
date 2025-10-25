"use client";

import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import TransportSetup from "@/components/setups/TransportSetup";

export default function TransportSetupPage() {
  const params = useParams();
  const tenantSlug = params.slug as string;

  return (
    <DashboardLayout>
      <TransportSetup tenantSlug={tenantSlug} />
    </DashboardLayout>
  );
}