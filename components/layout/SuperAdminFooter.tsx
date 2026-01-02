"use client";

import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";

interface SuperAdminFooterProps {
  tenantName?: string;
}

export function SuperAdminFooter({ tenantName }: SuperAdminFooterProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <footer className="text-white border-t" style={{ 
        backgroundColor: '#ffffff', 
        borderColor: '#e5e7eb',
        color: '#000000'
      }}>
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            <div className="flex items-center space-x-4 text-sm" style={{ color: '#6b7280' }}>
              <span>© {currentYear} Médecins Sans Frontières{tenantName ? ` (${tenantName})` : ''}</span>
            </div>
            <div className="flex items-center space-x-4 text-sm" style={{ color: '#6b7280' }}>
              <span>All rights reserved</span>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <footer className="border-t" style={{
      backgroundColor: isDark ? '#000000' : '#ffffff',
      borderColor: isDark ? '#333333' : '#e5e7eb',
      color: isDark ? '#ffffff' : '#000000'
    }}>
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
          <div className="flex items-center space-x-2 text-sm">
            <span style={{
              color: isDark ? '#d1d5db' : '#6b7280'
            }}>© {currentYear} Médecins Sans Frontières{tenantName ? ` (${tenantName})` : ''}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span style={{
              color: isDark ? '#d1d5db' : '#6b7280'
            }}>All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}