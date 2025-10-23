"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hotel, Settings } from "lucide-react";
import VendorHotelsSetup from "@/components/setups/VendorHotelsSetup";

export default function SetupsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = params.slug as string;
  const activeTab = searchParams.get('tab') || 'vendor-hotels';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Vendor Hotels</h1>
              <p className="text-sm text-gray-600">Manage external hotel partnerships</p>
            </div>
            <VendorHotelsSetup tenantSlug={tenantSlug} addButtonOnly onVendorAdded={() => window.location.reload()} />
          </div>
        </div>

        <VendorHotelsSetup tenantSlug={tenantSlug} />
      </div>
    </DashboardLayout>
  );
}