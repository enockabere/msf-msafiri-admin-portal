"use client";

import { Shield } from "lucide-react";

interface SuperAdminFooterProps {
  tenantName?: string;
}

export function SuperAdminFooter({ tenantName }: SuperAdminFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="text-white border-t border-red-700" style={{ backgroundColor: '#ee0000' }}>
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
          <div className="flex items-center space-x-4 text-sm text-red-200">
            <span>© {currentYear} Médecins Sans Frontières{tenantName ? ` (${tenantName})` : ''}</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">All rights reserved</span>
          </div>
          <div className="flex items-center space-x-4 text-xs text-red-300">
            <span>Super Admin Portal</span>
            <span>•</span>
            <span>Secure Access</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Encrypted</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
