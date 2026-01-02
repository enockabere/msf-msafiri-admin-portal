"use client";

import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/dashboard-layout";
import TravelRequirementsSetup from "@/components/setups/TravelRequirementsSetup";
import { Plane } from "lucide-react";

export default function TravelRequirementsPage() {
  const params = useParams();
  const tenantSlug = params.slug as string;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="rounded-2xl p-6 border-2" style={{
          background: mounted && theme === 'dark' ? '#000000' : 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #f3e8ff 100%)',
          borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb'
        }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold mb-2" style={{
                  color: mounted && theme === 'dark' ? '#ffffff' : '#111827'
                }}>Travel Requirements</h1>
                <p className="text-sm" style={{
                  color: mounted && theme === 'dark' ? '#d1d5db' : '#4b5563'
                }}>Configure travel requirements for visitors from different countries</p>
              </div>
            </div>
          </div>
        </Card>
        <TravelRequirementsSetup tenantSlug={tenantSlug} />
      </div>
    </DashboardLayout>
  );
}