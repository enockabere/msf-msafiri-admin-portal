"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react";
import Image from "next/image";

const getErrorMessage = (
  error: string | null
): { title: string; message: string; canRetry: boolean } => {
  switch (error) {
    case "Configuration":
      return {
        title: "Configuration Error",
        message:
          "There's a configuration issue with the authentication system. Please contact support.",
        canRetry: false,
      };
    case "AccessDenied":
    case "access_denied":
      return {
        title: "Access Denied",
        message:
          "Only users with admin roles (Super Admin, MT Admin, HR Admin, or Event Admin) can access this portal. Please contact your administrator if you believe this is an error.",
        canRetry: false,
      };
    case "Verification":
      return {
        title: "Verification Failed",
        message: "Email verification failed. Please try signing in again.",
        canRetry: true,
      };
    case "Default":
      return {
        title: "Authentication Error",
        message:
          "An unexpected error occurred during authentication. Please try again.",
        canRetry: true,
      };
    case "Signin":
      return {
        title: "Sign In Failed",
        message:
          "Unable to sign in. Please check your credentials and try again.",
        canRetry: true,
      };
    case "OAuthSignin":
      return {
        title: "OAuth Sign In Error",
        message: "There was an error with Microsoft Sign In. Please try again.",
        canRetry: true,
      };
    case "OAuthCallback":
      return {
        title: "OAuth Callback Error",
        message: "Authentication callback failed. Please try signing in again.",
        canRetry: true,
      };
    case "OAuthCreateAccount":
      return {
        title: "Account Creation Failed",
        message: "Unable to create your account. Please contact support.",
        canRetry: false,
      };
    case "EmailCreateAccount":
      return {
        title: "Email Verification Required",
        message: "Please verify your email address before signing in.",
        canRetry: false,
      };
    case "Callback":
      return {
        title: "Callback Error",
        message: "Authentication callback failed. Please try again.",
        canRetry: true,
      };
    case "OAuthAccountNotLinked":
      return {
        title: "Account Not Linked",
        message:
          "This account is already linked to another provider. Please use your original sign-in method.",
        canRetry: false,
      };
    case "SessionRequired":
      return {
        title: "Session Required",
        message: "You need to be signed in to access this page.",
        canRetry: true,
      };
    case "auth_failed":
      return {
        title: "Authentication Failed",
        message: "Login failed. Please check your credentials and try again.",
        canRetry: true,
      };
    case "insufficient_role":
      return {
        title: "Insufficient Permissions",
        message: "Your account does not have the required admin permissions to access this portal. Only Super Admin, MT Admin, HR Admin, and Event Admin roles are allowed.",
        canRetry: false,
      };
    default:
      return {
        title: "Authentication Error",
        message:
          "An unexpected authentication error occurred. Please try signing in again.",
        canRetry: true,
      };
  }
};

// FIXED: Separate component that uses useSearchParams
function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);

  const error = searchParams.get("error");
  const errorInfo = getErrorMessage(error);

  // Auto-redirect countdown for retryable errors
  useEffect(() => {
    if (errorInfo.canRetry && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (errorInfo.canRetry && countdown === 0) {
      router.push("/login");
    }
  }, [countdown, errorInfo.canRetry, router]);

  const handleRetry = () => {
    router.push("/login");
  };

  const handleContactSupport = () => {
    // You can customize this to your support system
    const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@msf.org";
    window.location.href =
      `mailto:${supportEmail}?subject=Authentication Error&body=Error: ` +
      error;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-sm border shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-40 h-16 mx-auto">
              <Image
                src="/icon/logo1.png"
                alt="MSF Logo"
                width={150}
                height={104}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <CardTitle className="text-xl font-bold text-red-600">
              {errorInfo.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {errorInfo.message}
              </AlertDescription>
            </Alert>

            {/* Error Details for Development */}
            {process.env.NODE_ENV === "development" && error && (
              <Alert className="border-gray-200 bg-gray-50">
                <AlertDescription className="text-gray-700 text-xs">
                  <strong>Debug Info:</strong> Error code: {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Auto-redirect countdown for retryable errors */}
            {errorInfo.canRetry && countdown > 0 && (
              <div className="text-center text-sm text-gray-600">
                Automatically redirecting to login in {countdown} seconds...
              </div>
            )}

            <div className="space-y-3">
              {errorInfo.canRetry ? (
                <Button
                  onClick={handleRetry}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              ) : (
                <Button
                  onClick={handleContactSupport}
                  className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <AlertTriangle className="w-4 mr-2" />
                  Contact Support
                </Button>
              )}

              <Button
                onClick={() => router.push("/login")}
                variant="outline"
                className="w-full h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
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

// FIXED: Loading fallback component
function AuthErrorLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-sm border shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-40 h-16 mx-auto">
              <Image
                src="/icon/logo1.png"
                alt="MSF Logo"
                width={150}
                height={104}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <CardTitle className="text-xl font-bold text-red-600">
              Loading...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// FIXED: Main component wrapped with Suspense
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<AuthErrorLoading />}>
      <AuthErrorContent />
    </Suspense>
  );
}