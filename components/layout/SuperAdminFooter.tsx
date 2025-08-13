"use client";

import { Heart, Shield, Globe } from "lucide-react";

export function SuperAdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-red-800 via-red-900 to-red-800 text-white border-t border-red-700">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* MSF Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 p-1.5 backdrop-blur-sm">
                <Heart className="w-full h-full text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">MSF Msafiri</h3>
            </div>
            <p className="text-sm text-red-100 leading-relaxed">
              Medical humanitarian organization providing aid to people affected
              by conflict, epidemics, disasters, and exclusion from healthcare.
            </p>
            <div className="flex items-center space-x-2 text-xs text-red-200">
              <Globe className="w-3 h-3" />
              <span>Operating worldwide since 1971</span>
            </div>
          </div>

          {/* System Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-red-200" />
              <h4 className="font-semibold text-white">System Information</h4>
            </div>
            <div className="space-y-2 text-sm text-red-100">
              <div className="flex justify-between">
                <span>System Status:</span>
                <span className="text-green-300 font-medium">Operational</span>
              </div>
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="font-mono text-xs">v2.1.0</span>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <span className="font-mono text-xs">Production</span>
              </div>
              <div className="flex justify-between">
                <span>Last Update:</span>
                <span className="text-xs">August 12, 2025</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white">Quick Links</h4>
            <div className="space-y-2">
              <a
                href="/admin/system"
                className="block text-sm text-red-100 hover:text-white transition-colors hover:underline"
              >
                System Settings
              </a>
              <a
                href="/admin/security"
                className="block text-sm text-red-100 hover:text-white transition-colors hover:underline"
              >
                Security Center
              </a>
              <a
                href="/admin/logs"
                className="block text-sm text-red-100 hover:text-white transition-colors hover:underline"
              >
                System Logs
              </a>
              <a
                href="/admin/backup"
                className="block text-sm text-red-100 hover:text-white transition-colors hover:underline"
              >
                Backup & Recovery
              </a>
              <a
                href="/admin/support"
                className="block text-sm text-red-100 hover:text-white transition-colors hover:underline"
              >
                Technical Support
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-red-700 mt-6 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-red-200">
              <span>© {currentYear} Médecins Sans Frontières (MSF)</span>
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
      </div>
    </footer>
  );
}
