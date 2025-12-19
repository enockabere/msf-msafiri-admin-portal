"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function NotFound() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // If user is unauthenticated, redirect to login
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const handleGoHome = () => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-sm border shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-40 h-16 mx-auto">
              <Image
                src="/portal/icon/logo1.png"
                alt="MSF Logo"
                width={150}
                height={104}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">
              Page Not Found
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
              <p className="text-gray-600">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleGoHome}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to {status === 'authenticated' ? 'Dashboard' : 'Login'}
              </Button>

              <Button
                onClick={handleGoBack}
                variant="outline"
                className="w-full h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          © 2025 MSF Msafiri. All rights reserved.
        </div>
      </div>
    </div>
  );
}