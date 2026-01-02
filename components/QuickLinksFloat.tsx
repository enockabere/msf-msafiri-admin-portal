"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Hotel,
  AlertCircle,
  Users,
  Bell,
  Loader2,
  Menu,
  X,
} from "lucide-react";

export default function QuickLinksFloat() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const tenantSlug = params.slug as string;

  const handleBackToDashboard = () => {
    setNavigationLoading(true);
    router.push("/dashboard");
  };

  const handleCardClick = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full shadow-lg"
        style={{
          backgroundColor: isDark ? '#dc2626' : '#dc2626',
          color: '#ffffff'
        }}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Quick Links Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}>
          <div className="absolute bottom-24 right-6 w-80">
            <Card
              className="shadow-xl"
              style={{
                backgroundColor: isDark ? '#000000' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb'
              }}
            >
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3" style={{ color: isDark ? '#ffffff' : '#111827' }}>
                  Quick Links
                </h3>
                <div className="space-y-2">
                  {/* Back to Super Admin */}
                  {user?.role?.toLowerCase() === "super_admin" && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3"
                      style={{
                        backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                        color: isDark ? '#ffffff' : '#111827'
                      }}
                      onClick={handleBackToDashboard}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-500 rounded-lg text-white">
                          {navigationLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowLeft className="h-4 w-4" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-xs">Back to Super Admin</div>
                          <div className="text-xs opacity-70">Return to main dashboard</div>
                        </div>
                      </div>
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    style={{
                      backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                      color: isDark ? '#ffffff' : '#111827'
                    }}
                    onClick={() => handleCardClick(`/tenant/${tenantSlug}/accommodation`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-500 rounded-lg text-white">
                        <Hotel className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-xs">Accommodation</div>
                        <div className="text-xs opacity-70">Manage guesthouses & rooms</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    style={{
                      backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                      color: isDark ? '#ffffff' : '#111827'
                    }}
                    onClick={() => handleCardClick(`/tenant/${tenantSlug}/travel-requirements`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-500 rounded-lg text-white">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-xs">Travel Requirements</div>
                        <div className="text-xs opacity-70">Manage travel requirements</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    style={{
                      backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                      color: isDark ? '#ffffff' : '#111827'
                    }}
                    onClick={() => handleCardClick(`/tenant/${tenantSlug}/transport-setup`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500 rounded-lg text-white">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-xs">Transport Setup</div>
                        <div className="text-xs opacity-70">Manage transport settings</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    style={{
                      backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                      color: isDark ? '#ffffff' : '#111827'
                    }}
                    onClick={() => handleCardClick(`/tenant/${tenantSlug}/news-updates`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-500 rounded-lg text-white">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-xs">News & Updates</div>
                        <div className="text-xs opacity-70">Latest news & announcements</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}