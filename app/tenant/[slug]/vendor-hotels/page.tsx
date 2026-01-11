"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import VendorHotelsSetup from "@/components/setups/VendorHotelsSetup";
import { Hotel } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function VendorHotelsPage() {
  const params = useParams();
  const tenantSlug = params.slug as string;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Simulate loading time to match the component
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      <Card className="relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent dark:from-red-400/20 dark:via-red-400/10 dark:to-transparent"></div>
        <CardHeader className="relative p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                <Hotel className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className={`text-base font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Vendor Hotels</h1>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Manage external hotel partnerships</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <VendorHotelsSetup tenantSlug={tenantSlug} addButtonOnly onVendorAdded={() => window.location.reload()} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="w-full overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-100 border-t-red-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Hotel className="w-6 h-6 text-red-600 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-base font-medium text-gray-900 dark:text-white">Loading vendor hotels...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch the data</p>
              </div>
            </div>
          </div>
        ) : (
          <VendorHotelsSetup tenantSlug={tenantSlug} />
        )}
      </div>
    </div>
  );