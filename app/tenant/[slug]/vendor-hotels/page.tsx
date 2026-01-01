"use client";

import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import VendorHotelsSetup from "@/components/setups/VendorHotelsSetup";
import { Hotel } from "lucide-react";

export default function VendorHotelsPage() {
  const params = useParams();
  const tenantSlug = params.slug as string;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Hotel className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Vendor Hotels</h1>
                <p className="text-sm text-gray-600">Manage external hotel partnerships</p>
              </div>
            </div>
            <VendorHotelsSetup tenantSlug={tenantSlug} addButtonOnly onVendorAdded={() => window.location.reload()} />
          </div>
        </div>

        <VendorHotelsSetup tenantSlug={tenantSlug} />
      </div>
    </DashboardLayout>
  );
}
