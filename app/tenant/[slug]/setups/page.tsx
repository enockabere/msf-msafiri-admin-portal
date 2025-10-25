"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hotel, Settings, Plane } from "lucide-react";
import VendorHotelsSetup from "@/components/setups/VendorHotelsSetup";
import TravelRequirementsSetup from "@/components/setups/TravelRequirementsSetup";

export default function SetupsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = params.slug as string;
  const activeTab = searchParams.get('tab') || 'vendor-hotels';

  const handleTabChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    router.push(url.pathname + url.search);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">System Setups</h1>
              <p className="text-sm text-gray-600">Configure system settings and requirements</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vendor-hotels" className="flex items-center gap-2">
              <Hotel className="h-4 w-4" />
              Vendor Hotels
            </TabsTrigger>
            <TabsTrigger value="travel-requirements" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Travel Requirements
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="vendor-hotels" className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Vendor Hotels</h2>
                  <p className="text-sm text-gray-600">Manage external hotel partnerships</p>
                </div>
                <VendorHotelsSetup tenantSlug={tenantSlug} addButtonOnly onVendorAdded={() => window.location.reload()} />
              </div>
            </div>
            <VendorHotelsSetup tenantSlug={tenantSlug} />
          </TabsContent>
          
          <TabsContent value="travel-requirements" className="space-y-6">
            <TravelRequirementsSetup tenantSlug={tenantSlug} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}