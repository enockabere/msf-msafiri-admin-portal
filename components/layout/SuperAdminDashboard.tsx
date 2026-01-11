"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useTenant } from "@/context/TenantContext";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SuperAdminProfile } from "@/components/SuperAdminProfile";
import { AddTenantModal } from "../dashboard/AddTenantModal";
import { DashboardHeader } from "../dashboard/dashboard-header";
import { DashboardContent } from "../dashboard/dashboard-content";
import { SuperAdminFooter } from "./SuperAdminFooter";
import { ToastContainer } from "@/components/ui/toast";
import { LoadingScreen } from "@/components/ui/loading";
import { useProfile } from "@/hooks/useProfile";
import { NotificationProvider } from "@/context/NotificationContext";
import { useTheme } from "next-themes";
import type { AuthUser } from "@/types/auth";
import { useAuthenticatedApi } from "@/lib/auth";

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const { theme } = useTheme();
  const { profile, refreshProfile } = useProfile();
  const { tenants, loading, error, refreshTenants } = useTenant();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>('active');
  const [currentView, setCurrentView] = useState<'active' | 'total' | 'inactive' | 'super-admins' | 'pending-invitations' | 'all'>('active');
  const [tabLoading, setTabLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [vettingEvents, setVettingEvents] = useState<any[]>([]);

  const activeTenants = tenants.filter((t) => t.is_active);
  const inactiveTenants = tenants.filter((t) => !t.is_active);

  // Type-safe user casting
  const typedUser = user as AuthUser | null;
  const hasTenantAccess = typedUser?.tenantId && typedUser?.tenantId !== 'null';
  const hasVettingRole = typedUser?.allRoles?.includes('VETTING_COMMITTEE') || typedUser?.allRoles?.includes('VETTING_APPROVER');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  // Fetch vetting events if user has vetting roles OR tenant access (to check for committee membership)
  useEffect(() => {
    const fetchVettingEvents = async () => {
      if ((hasVettingRole || hasTenantAccess) && typedUser) {
        try {
          const response = await apiClient.request('/vetting-committee/my-vetting-events');
          setVettingEvents(response.vetting_events || []);
        } catch (error) {
          console.error('Failed to fetch vetting events:', error);
          // If API call fails, vetting events will remain empty array
        }
      }
    };

    fetchVettingEvents();
  }, [hasVettingRole, hasTenantAccess, typedUser, apiClient]);
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      setNotification(event.detail);
      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    };

    window.addEventListener('showNotification', handleNotification as EventListener);
    return () => window.removeEventListener('showNotification', handleNotification as EventListener);
  }, []);

  const handleCardClick = (type: 'active' | 'total' | 'inactive' | 'super-admins' | 'pending-invitations' | 'all') => {
    if (type !== currentView) {
      setTabLoading(true);
      setSelectedCard(type);
      setCurrentView(type);
      
      // Simulate loading time for tab switch
      setTimeout(() => {
        setTabLoading(false);
      }, 500);
    }
  };

  // Show loading if user is not loaded yet
  if (!typedUser) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <NotificationProvider>
      <div className="p-6">
        <SessionTimeoutWarning warningMinutes={5} sessionDurationMinutes={30} />

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{notification.message}</p>
              <button 
                onClick={() => setNotification(null)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <DashboardHeader
          user={typedUser}
          profile={profile ? { full_name: profile.full_name } : undefined}
          onProfileClick={() => setShowProfile(true)}
          onAddTenantClick={() => setShowAddModal(true)}
        />

        {/* Tenant Access Card */}
        {hasTenantAccess && (
          <Card className="mb-6 border border-red-200 bg-gradient-to-r from-red-50 to-red-100 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">V</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">Vetting Committee Access</h3>
                    <p className="text-sm text-red-700">
                      You have vetting committee access for {typedUser.tenantId} tenant
                    </p>
                    {vettingEvents.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {vettingEvents.map((event, index) => (
                          <div key={event.event_id} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            <span className="font-medium">{event.event_title}</span>
                            <span className="ml-2 text-red-500">({event.role})</span>
                            {event.event_start_date && (
                              <span className="ml-2 text-red-500">
                                - {new Date(event.event_start_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = `${baseUrl}/tenant/${typedUser.tenantId}/dashboard`}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg shadow-md transition-colors flex items-center gap-2"
                >
                  Proceed to Vetting
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <DashboardContent
          activeTenants={activeTenants.length}
          totalTenants={tenants.length}
          inactiveTenants={inactiveTenants.length}
          selectedCard={selectedCard}
          currentView={currentView}
          loading={loading}
          error={error}
          onCardClick={handleCardClick}
          onRefresh={refreshTenants}
          onTenantUpdate={refreshTenants}
          tabLoading={tabLoading}
        />
      </div>

      <ToastContainer />

      {/* Modals */}
      <AddTenantModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          refreshTenants();
        }}
      />

      <SuperAdminProfile
        open={showProfile}
        onClose={() => {
          setShowProfile(false);
          // Refresh profile data when closing the modal to ensure latest data is displayed
          refreshProfile();
        }}
        user={typedUser}
      />
    </NotificationProvider>
  );
