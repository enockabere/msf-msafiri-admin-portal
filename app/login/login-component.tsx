"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_VERSION } from "@/lib/version";
import {
  ArrowLeft,
  Mail,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// FIXED: Robust API URL detection with better logging
const getApiUrl = (): string => {
  // Try environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Client-side fallback logic
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // Local development
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const localUrl = process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://localhost:8000";
      return localUrl;
    }

    // Vercel deployment or other production
    const prodUrl = process.env.NEXT_PUBLIC_PROD_API_URL || "https://msafiri-visitor-api.onrender.com";
    return prodUrl;
  }

  // Server-side fallback
  const fallbackUrl = process.env.NEXT_PUBLIC_PROD_API_URL || "https://msafiri-visitor-api.onrender.com";
  return fallbackUrl;
};

interface LoginFormData {
  email: string;
  password: string;
}

interface PasswordResetData {
  email: string;
  token?: string;
  newPassword?: string;
  confirmPassword?: string;
}

type ViewMode = "login" | "resetRequest" | "resetPassword";

// Travel and Events Illustration component - Responsive design
const TravelEventsIllustration = () => (
  <div className="relative flex justify-center items-center space-x-3 md:space-x-4 lg:space-x-6 mb-6 md:mb-8 scale-75 md:scale-90 lg:scale-100">
    {/* Plane */}
    <div className="relative">
      <div className="w-16 h-6 md:w-20 md:h-8 bg-white rounded-full shadow-lg relative overflow-hidden border-2 border-gray-200">
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-3 md:w-12 md:h-4 bg-red-500 rounded-full"></div>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 md:w-3 md:h-3 bg-gray-300 rounded-full"></div>
      </div>
      {/* Wings */}
      <div className="absolute top-1.5 left-6 w-6 h-1.5 md:top-2 md:left-8 md:w-8 md:h-2 bg-gray-300 rounded-full"></div>
      <div className="absolute bottom-1.5 left-6 w-6 h-1.5 md:bottom-2 md:left-8 md:w-8 md:h-2 bg-gray-300 rounded-full"></div>
      {/* Flight path dots */}
      <div className="absolute -right-6 top-1 md:-right-8 flex space-x-1">
        <div className="w-1 h-1 bg-red-400 rounded-full"></div>
        <div className="w-1 h-1 bg-red-300 rounded-full"></div>
        <div className="w-1 h-1 bg-red-200 rounded-full"></div>
      </div>
    </div>

    {/* Event venue/building */}
    <div className="flex flex-col items-center">
      {/* Building */}
      <div className="w-12 h-16 md:w-16 md:h-20 bg-gray-700 rounded-t-lg relative">
        {/* Windows */}
        <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 md:top-2 md:left-2 md:w-2 md:h-2 bg-yellow-300 rounded-sm"></div>
        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 md:top-2 md:right-2 md:w-2 md:h-2 bg-yellow-300 rounded-sm"></div>
        <div className="absolute top-5 left-1.5 w-1.5 h-1.5 md:top-6 md:left-2 md:w-2 md:h-2 bg-yellow-300 rounded-sm"></div>
        <div className="absolute top-5 right-1.5 w-1.5 h-1.5 md:top-6 md:right-2 md:w-2 md:h-2 bg-yellow-300 rounded-sm"></div>
        <div className="absolute top-8 left-1.5 w-1.5 h-1.5 md:top-10 md:left-2 md:w-2 md:h-2 bg-yellow-300 rounded-sm"></div>
        <div className="absolute top-8 right-1.5 w-1.5 h-1.5 md:top-10 md:right-2 md:w-2 md:h-2 bg-yellow-300 rounded-sm"></div>
        {/* Entrance */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-5 h-6 md:w-6 md:h-8 bg-red-500 rounded-t-lg"></div>
      </div>
      {/* Base */}
      <div className="w-16 h-3 md:w-20 md:h-4 bg-gray-600 rounded-b-lg"></div>
    </div>

    {/* Calendar/Event icon */}
    <div className="flex flex-col items-center">
      <div className="w-11 h-13 md:w-14 md:h-16 bg-white rounded-lg shadow-lg border-2 border-gray-200 relative">
        {/* Calendar header */}
        <div className="w-full h-3 md:h-4 bg-red-500 rounded-t-lg"></div>
        {/* Calendar rings */}
        <div className="absolute -top-1 left-1.5 w-1.5 h-2 md:left-2 md:w-2 md:h-3 bg-gray-400 rounded-full"></div>
        <div className="absolute -top-1 right-1.5 w-1.5 h-2 md:right-2 md:w-2 md:h-3 bg-gray-400 rounded-full"></div>
        {/* Calendar content */}
        <div className="mt-1.5 md:mt-2 px-1.5 md:px-2 space-y-0.5 md:space-y-1">
          <div className="flex justify-between">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
          <div className="flex justify-between">
            <div className="w-1 h-1 bg-red-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
          <div className="flex justify-center">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Globe/World icon */}
    <div className="relative">
      <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-400 rounded-full relative overflow-hidden shadow-lg">
        {/* Continents */}
        <div className="absolute top-2 left-1.5 w-3 h-2 md:top-3 md:left-2 md:w-4 md:h-3 bg-green-400 rounded-lg transform rotate-12"></div>
        <div className="absolute bottom-2 right-0.5 w-2 h-3 md:bottom-3 md:right-1 md:w-3 md:h-4 bg-green-400 rounded-lg"></div>
        <div className="absolute top-5 right-2 w-1.5 h-1.5 md:top-6 md:right-3 md:w-2 md:h-2 bg-green-400 rounded-full"></div>
        {/* Grid lines */}
        <div className="absolute inset-0 border-2 border-blue-300 rounded-full"></div>
        <div className="absolute top-0 left-1/2 w-px h-full bg-blue-300"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-blue-300"></div>
      </div>
    </div>
  </div>
);

export default function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loginMethod, setLoginMethod] = useState<"sso" | "credentials">("sso");
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [apiUrl, setApiUrl] = useState<string>("");
  const [isApiConnected, setIsApiConnected] = useState<boolean>(true);

  const [formData, setFormData] = useState<LoginFormData>({
    email: process.env.NEXT_PUBLIC_DEFAULT_EMAIL || "",
    password: "",
  });

  const [resetData, setResetData] = useState<PasswordResetData>({
    email: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const resetToken = searchParams.get("token");
  const message = searchParams.get("message");
  const emailParam = searchParams.get("email");
  const forgotParam = searchParams.get("forgot");

  // Initialize API URL and handle reset token
  useEffect(() => {
    const url = getApiUrl();
    setApiUrl(url);

    if (resetToken) {
      setViewMode("resetPassword");
      setResetData((prev) => ({ ...prev, token: resetToken }));
    }

    if (forgotParam === "true") {
      setViewMode("resetRequest");
    }

    if (message === "email-changed" && emailParam) {
      setSuccess(
        `Your email has been successfully changed to ${emailParam}. Please sign in with your new email address.`
      );
      setFormData((prev) => ({ ...prev, email: emailParam }));
    }

    if (message === "password-reset" && emailParam) {
      setSuccess(
        `Your password has been successfully reset. Please sign in with your new password.`
      );
      setFormData((prev) => ({ ...prev, email: emailParam }));
    }

    if (message === "password-changed") {
      setSuccess(
        `Your password has been successfully changed. Please sign in with your new password.`
      );
    }

    checkApiConnectivity(url);
  }, [resetToken, message, emailParam, forgotParam]);

  const checkApiConnectivity = async (url: string) => {
    try {
      const healthUrl = `${url.replace("/api/v1", "")}/health`;

      const response = await fetch(healthUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        setIsApiConnected(true);
      } else {
        setIsApiConnected(false);
        console.warn("⚠️ API health check failed:", response.status);
      }
    } catch (error) {
      console.warn("⚠️ API server appears to be offline:", error);
      setIsApiConnected(false);
    }
  };

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    setError("");
    setSuccess("");

    if (mode === "login") {
      setResetData({ email: "" });
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");
      setLoginMethod("sso");

      const result = await signIn("azure-ad", {
        redirect: false,
        callbackUrl: redirectTo,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        setSuccess("Redirecting to Microsoft...");
        // Let NextAuth handle the redirect
      }
    } catch (error) {
      console.error("🚨 === MICROSOFT SSO ERROR ===");
      console.error("Error details:", error);
      console.error("Error type:", typeof error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown error"
      );

      const errorMessage =
        error instanceof Error ? error.message : "Microsoft SSO login failed";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");
      setLoginMethod("credentials");

      if (!formData.email || !formData.password) {
        throw new Error("Please enter both email and password");
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: redirectTo,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          throw new Error(
            "Invalid email or password. Please check your credentials."
          );
        }
        throw new Error("Login failed. Please try again.");
      }

      if (result?.ok) {
        setSuccess("Login successful! Redirecting...");

        // Check if password must be changed (either default password or API flag)
        const mustChangePassword = formData.password === "password@1234";
        
        // Make direct API call to check must_change_password flag and get all roles
        let userRole = null;
        let allRoles = [];
        let userTenants = [];
        let apiMustChangePassword = false;
        try {
          const loginResponse = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              username: formData.email,
              password: formData.password,
            }),
          });
          
          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log("🔐 USER LOGIN DATA:", {
              email: loginData.email,
              role: loginData.role,
              all_roles: loginData.all_roles,
              tenant_id: loginData.tenant_id,
              user_tenants: loginData.user_tenants,
              must_change_password: loginData.must_change_password
            });
            
            userRole = loginData.role;
            allRoles = loginData.all_roles || [loginData.role];
            userTenants = loginData.user_tenants || [];
            apiMustChangePassword = loginData.must_change_password;
            
            // Check if user has multiple tenants
            if (userTenants.length > 1) {
              // Store login data and redirect to tenant selection
              sessionStorage.setItem('pendingLogin', JSON.stringify({
                email: formData.email,
                allRoles,
                userTenants,
                redirectTo
              }));
              router.push('/select-tenant');
              return;
            }
            
            // Check if user has required roles for admin portal
            const adminRoles = [
              'SUPER_ADMIN', 'MT_ADMIN', 'HR_ADMIN', 'EVENT_ADMIN',
              'VETTING_COMMITTEE', 'VETTING_APPROVER'
            ];
            
            const hasAdminAccess = allRoles.some(role => 
              adminRoles.includes(role) || adminRoles.includes(role.toUpperCase())
            );
            
            if (!hasAdminAccess) {
              throw new Error(`Access denied - insufficient role: ${userRole}. Required roles: ${adminRoles.join(', ')}`);
            }
          }
        } catch (apiError) {
          console.log("API check failed, using default logic", apiError);
          // If API call fails, continue with NextAuth result
        }
        
        // Check if password must be changed (API flag takes precedence)
        if (apiMustChangePassword || mustChangePassword) {
          setTimeout(() => {
            router.push("/change-password?required=true");
          }, 1000);
          return;
        }
        
        setTimeout(() => {
          if (mustChangePassword) {
            router.push("/change-password?required=true");
          } else {
            // Super admin should go to main dashboard, others to tenant dashboard
            if (userRole === "SUPER_ADMIN" || userRole === "super_admin") {
              router.push("/dashboard");
            } else {
              router.push(redirectTo);
            }
          }
        }, 1000);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      if (!resetData.email) {
        throw new Error("Please enter your email address");
      }

      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetData.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send reset email");
      }

      setSuccess("Password reset link has been sent to your email address.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send reset email";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      if (!resetData.newPassword || !resetData.confirmPassword) {
        throw new Error("Please fill in all password fields");
      }

      if (resetData.newPassword !== resetData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (resetData.newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: resetData.token,
          newPassword: resetData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }

      setSuccess(
        "Password has been successfully reset. Redirecting to login..."
      );
      setTimeout(() => {
        router.push("/login?message=password-reset");
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reset password";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange =
    (field: keyof LoginFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError("");
    };

  const handleResetInputChange =
    (field: keyof PasswordResetData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setResetData((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError("");
    };

  const renderLoginContent = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100 flex flex-col xl:flex-row">
      {/* Left side - Branding and illustration (hidden on mobile/tablet, shown on extra large screens only) */}
      <div className="hidden xl:flex xl:flex-1 flex-col justify-center items-center p-8 xl:p-12 bg-white/80 backdrop-blur-sm">
        {/* Logo */}
        <div>
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/portal/icon/MSF_logo_square.png"
              alt="MSF Logo"
              width={200}
              height={200}
              className="w-32 h-32 xl:w-40 xl:h-40"
              priority
            />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6 xl:mb-8 max-w-md px-4">
          <h3 className="text-2xl xl:text-4xl font-bold text-gray-800 mb-3 xl:mb-4">
            Visitor Travel & Events Management
          </h3>
          <p className="text-gray-600 text-sm xl:text-md">
            Manage tenants, streamline event planning, invite and track
            visitors, allocate rooms and transport, and approve per diem—all in
            one secure platform.
          </p>
        </div>

        {/* Travel and Events Illustration */}
        <TravelEventsIllustration />
      </div>

      {/* Right side - Login form (full width on mobile/tablet, half width on xl screens) */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen xl:min-h-0">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          {/* Mobile/Tablet logo (shown on screens smaller than xl) */}
          <div className="flex justify-center xl:hidden mb-2 sm:mb-4">
            <Image
              src="/portal/icon/MSF_logo_square.png"
              alt="MSF Logo"
              width={80}
              height={80}
              className="w-16 h-16 sm:w-20 sm:h-20"
              priority
            />
          </div>

          <Card className="w-full bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center space-y-2 sm:space-y-3 md:space-y-4 pb-2 px-4 sm:px-6 pt-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                Welcome to MSF Msafiri
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Your One-Stop Companion for MSF Traveller
              </p>
              <p className="text-xs text-gray-400">
                v{APP_VERSION}
              </p>
              {/* Mobile/Tablet description */}
              <p className="text-xs text-gray-500 xl:hidden px-2">
                Manage visitors, events, and travel arrangements
              </p>
            </CardHeader>

          <CardContent className="space-y-3 sm:space-y-4 md:space-y-6 px-4 sm:px-6 pb-6">
            {/* Alert Messages */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-xs sm:text-sm text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-xs sm:text-sm text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleCredentialLogin} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm text-gray-600">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  placeholder="admin@msafiri.com"
                  className="h-10 sm:h-11 md:h-12 text-sm sm:text-base border-gray-200 focus:border-red-600 focus:ring-red-600"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm text-gray-600">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    placeholder="Enter password"
                    className="h-10 sm:h-11 md:h-12 pr-10 text-sm sm:text-base border-gray-200 focus:border-red-600 focus:ring-red-600"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-manipulation"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleViewChange("resetRequest")}
                  className="text-xs sm:text-sm text-gray-600 hover:text-red-600 hover:underline touch-manipulation"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isApiConnected}
                className="w-full h-10 sm:h-11 md:h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm sm:text-base touch-manipulation"
              >
                {isLoading && loginMethod === "credentials" ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Admin Login"
                )}
              </Button>
            </form>

            {/* Microsoft SSO Button */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                handleMicrosoftLogin();
              }}
              disabled={isLoading}
              variant="outline"
              className="w-full h-10 sm:h-11 md:h-12 border-gray-200 hover:bg-gray-50 text-xs sm:text-sm md:text-base touch-manipulation"
            >
              {isLoading && loginMethod === "sso" ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  Redirecting to Microsoft...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#00a1f1" d="M0 0h11v11H0z" />
                    <path fill="#00a1f1" d="M13 0h11v11H13z" />
                    <path fill="#00a1f1" d="M0 13h11v11H0z" />
                    <path fill="#00a1f1" d="M13 13h11v11H13z" />
                  </svg>
                  Sign in with Microsoft
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        {/* Version info at bottom */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">
            MSF Admin Portal v{APP_VERSION} • {new Date().getFullYear()}
          </p>
        </div>
        </div>
      </div>
    </div>
  );

  const renderResetRequestContent = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center space-y-2 sm:space-y-4 px-4 sm:px-6 pt-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Enter your email address and we&apos;ll send you a reset link
          </p>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-xs sm:text-sm text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs sm:text-sm text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handlePasswordResetRequest} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="resetEmail" className="text-xs sm:text-sm text-gray-600">
                Email Address
              </Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetData.email}
                onChange={handleResetInputChange("email")}
                placeholder="admin@msafiri.com"
                className="h-10 sm:h-11 md:h-12 text-sm sm:text-base border-gray-200 focus:border-red-600 focus:ring-red-600"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !apiUrl}
              className="w-full h-10 sm:h-11 md:h-12 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base touch-manipulation"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Send Reset Link
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleViewChange("login")}
                className="text-xs sm:text-sm text-gray-600 hover:text-red-600 hover:underline inline-flex items-center touch-manipulation"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Back to Login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderResetPasswordContent = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center space-y-2 sm:space-y-4 px-4 sm:px-6 pt-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Set New Password</h2>
          <p className="text-xs sm:text-sm text-gray-600">Enter your new password below</p>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-xs sm:text-sm text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs sm:text-sm text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="newPassword" className="text-xs sm:text-sm text-gray-600">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={resetData.newPassword || ""}
                onChange={handleResetInputChange("newPassword")}
                placeholder="Enter new password"
                className="h-10 sm:h-11 md:h-12 text-sm sm:text-base border-gray-200 focus:border-red-600 focus:ring-red-600"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs sm:text-sm text-gray-600">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={resetData.confirmPassword || ""}
                onChange={handleResetInputChange("confirmPassword")}
                placeholder="Confirm new password"
                className="h-10 sm:h-11 md:h-12 text-sm sm:text-base border-gray-200 focus:border-red-600 focus:ring-red-600"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !apiUrl}
              className="w-full h-10 sm:h-11 md:h-12 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base touch-manipulation"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Update Password
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleViewChange("login")}
                className="text-xs sm:text-sm text-gray-600 hover:text-red-600 hover:underline inline-flex items-center touch-manipulation"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Back to Login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  if (viewMode === "resetRequest") return renderResetRequestContent();
  if (viewMode === "resetPassword") return renderResetPasswordContent();

  return renderLoginContent();
}
