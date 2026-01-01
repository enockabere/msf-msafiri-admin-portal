"use client";

import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import TravelRequirementsSetup from "@/components/setups/TravelRequirementsSetup";
import { Plane } from "lucide-react";

export default function TravelRequirementsPage() {
  const params = useParams();
  const tenantSlug = params.slug as string;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Travel Requirements</h1>
                <p className="text-sm text-gray-600">Configure travel requirements for visitors from different countries</p>
              </div>
            </div>
          </div>
        </div>
        <TravelRequirementsSetup tenantSlug={tenantSlug} />
      </div>
    </DashboardLayout>
  );
}