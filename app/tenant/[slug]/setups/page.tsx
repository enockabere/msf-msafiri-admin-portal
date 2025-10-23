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
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">System Setups</h1>
              <p className="text-sm text-gray-600">Configure system components and integrations</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Configurations</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          const newSearchParams = new URLSearchParams(searchParams.toString());
          newSearchParams.set('tab', value);
          router.push(`?${newSearchParams.toString()}`, { scroll: false });
        }} className="space-y-6">
          <TabsList className="inline-flex h-auto items-center justify-center rounded-xl bg-transparent p-0 gap-2">
            <TabsTrigger
              value="vendor-hotels"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-6 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border-2 data-[state=inactive]:border-gray-200 hover:bg-gray-50"
            >
              <Hotel className="w-4 h-4" />
              <span>Vendor Hotels</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendor-hotels" className="space-y-6">
            <VendorHotelsSetup tenantSlug={tenantSlug} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}