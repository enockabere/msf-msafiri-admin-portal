"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Hotel, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import VendorHotelsSetup from "@/components/setups/VendorHotelsSetup";

export default function SetupsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.slug as string;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">System Setups</h1>
              <p className="text-sm text-gray-600">Configure system templates and vendor partnerships</p>
            </div>
          </div>
        </div>

        {/* Setup Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vendor Hotels */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Hotel className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Vendor Hotels</h3>
                  <p className="text-sm text-gray-600">Manage external hotel partnerships</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <VendorHotelsSetup tenantSlug={tenantSlug} addButtonOnly onVendorAdded={() => window.location.reload()} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/tenant/${tenantSlug}/vendor-hotels`)}
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Templates */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Certificate Templates</h3>
                  <p className="text-sm text-gray-600">Design certificate templates for events</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/tenant/${tenantSlug}/setups/certificates`)}
                >
                  Manage Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vendor Hotels Full View */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Vendor Hotels</h2>
          <VendorHotelsSetup tenantSlug={tenantSlug} />
        </div>
      </div>
    </DashboardLayout>
  );
}