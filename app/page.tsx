"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page on client side
    router.replace("/login");
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm border shadow-xl rounded-lg p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    </div>
  );
}

// Keep metadata export separate
export const metadata = {
  title: "MSF Msafiri Admin Portal",
  description: "Comprehensive admin portal for MSF Kenya operations management",
};
