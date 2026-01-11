"use client";

import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
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
    <div className="space-y-4">
      <Card className="relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent dark:from-red-400/20 dark:via-red-400/10 dark:to-transparent"></div>
        <div className="relative p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 group-hover:scale-110 transition-all duration-300">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className={`text-base font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Travel Requirements</h1>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Configure travel requirements for visitors</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      <TravelRequirementsSetup tenantSlug={tenantSlug} />
    </div>
  );
}