"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useTenant } from "@/context/TenantContext";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { SuperAdminNavbar } from "./SuperAdminNavbar";
import { SuperAdminProfile } from "@/components/SuperAdminProfile";
import { AddTenantModal } from "../dashboard/AddTenantModal";
import { DashboardHeader } from "../dashboard/dashboard-header";
import { DashboardContent } from "../dashboard/dashboard-content";
import { SuperAdminFooter } from "./SuperAdminFooter";
import { ToastContainer } from "@/components/ui/toast";
import { useProfile } from "@/hooks/useProfile";
import { NotificationProvider } from "@/context/NotificationContext";
import type { AuthUser } from "@/types/auth";

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { tenants, loading, error, refreshTenants } = useTenant();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>('active');
  const [currentView, setCurrentView] = useState<'active' | 'total' | 'inactive' | 'super-admins' | 'pending-invitations' | 'all'>('active');
  const [tabLoading, setTabLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const activeTenants = tenants.filter((t) => t.is_active);
  const inactiveTenants = tenants.filter((t) => !t.is_active);

  // Listen for notification events
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      setNotification(event.detail);
      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    };

    window.addEventListener('showNotification', handleNotification as EventListener);
    return () => window.removeEventListener('showNotification', handleNotification as EventListener);
  }, []);

  // Type-safe user casting
  const typedUser = user as AuthUser | null;

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen flex flex-col bg-red-800">
        <SuperAdminNavbar
          user={typedUser}
          onProfileClick={() => setShowProfile(true)}
        />

      <main className="flex-1 bg-gray-50 w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-4 sm:py-6 lg:py-8">
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
      </main>

      <SuperAdminFooter />
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
          onClose={() => setShowProfile(false)}
          user={typedUser}
        />
      </div>
    </NotificationProvider>
  );
}
