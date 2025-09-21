"use client";

import { useState, ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { SuperAdminNavbar } from "./SuperAdminNavbar";
import { SuperAdminProfile } from "@/components/SuperAdminProfile";
import { SuperAdminFooter } from "./SuperAdminFooter";
import { ToastContainer } from "@/components/ui/toast";
import type { AuthUser } from "@/types/auth";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  // Type-safe user casting
  const typedUser = user as AuthUser | null;

  // Show loading if user is not loaded yet
  if (!typedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-red-800">
      <SuperAdminNavbar
        user={typedUser}
        onProfileClick={() => setShowProfile(true)}
      />

      <main className="flex-1 bg-gray-50 w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-4 sm:py-6 lg:py-8">
        <SessionTimeoutWarning warningMinutes={5} sessionDurationMinutes={30} />
        {children}
      </main>

      <SuperAdminFooter />
      <ToastContainer />

      <SuperAdminProfile
        open={showProfile}
        onClose={() => setShowProfile(false)}
        user={typedUser}
      />
    </div>
  );
}