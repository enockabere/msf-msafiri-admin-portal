"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import DashboardLayout from "@/components/layout/dashboard-layout";
import VendorHotelsSetup from "@/components/setups/VendorHotelsSetup";
import { Hotel } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function VendorHotelsPage() {
  const params = useParams();
  const tenantSlug = params.slug as string;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Hotel className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold mb-2 text-gray-900">Vendor Hotels</h1>
                    <p className="text-sm text-gray-600">Manage external hotel partnerships</p>
                  </div>
                </div>
                <VendorHotelsSetup tenantSlug={tenantSlug} addButtonOnly onVendorAdded={() => window.location.reload()} />
              </div>
            </CardHeader>
          </Card>
          <VendorHotelsSetup tenantSlug={tenantSlug} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Hotel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Vendor Hotels</h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Manage external hotel partnerships</p>
                </div>
              </div>
              <VendorHotelsSetup tenantSlug={tenantSlug} addButtonOnly onVendorAdded={() => window.location.reload()} />
            </div>
          </CardHeader>
        </Card>

        <VendorHotelsSetup tenantSlug={tenantSlug} />
      </div>
    </DashboardLayout>
  );
}