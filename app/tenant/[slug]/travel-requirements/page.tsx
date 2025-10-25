"use client";

import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import TravelRequirementsSetup from "@/components/setups/TravelRequirementsSetup";

export default function TravelRequirementsPage() {
  const params = useParams();
  const tenantSlug = params.slug as string;

  return (
    <DashboardLayout>
      <TravelRequirementsSetup tenantSlug={tenantSlug} />
    </DashboardLayout>
  );
}