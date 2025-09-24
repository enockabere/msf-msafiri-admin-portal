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
      const localUrl = "http://localhost:8000";
      return localUrl;
    }

    // Vercel deployment or other production
    const prodUrl = "https://msafiri-visitor-api.onrender.com";
    return prodUrl;
  }

  // Server-side fallback
  const fallbackUrl = "https://msafiri-visitor-api.onrender.com";
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

// Travel and Events Illustration component
const TravelEventsIllustration = () => (
  <div className="relative flex justify-center items-center space-x-6 mb-8">
    {/* Plane */}
    <div className="relative">
      <div className="w-20 h-8 bg-white rounded-full shadow-lg relative overflow-hidden border-2 border-gray-200">
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-12 h-4 bg-red-500 rounded-full"></div>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-300 rounded-full"></div>
      </div>
      {/* Wings */}
      <div className="absolute top-2 left-8 w-8 h-2 bg-gray-300 rounded-full"></div>
      <div className="absolute bottom-2 left-8 w-8 h-2 bg-gray-300 rounded-full"></div>
      {/* Flight path dots */}
      <div className="absolute -right-8 top-1 flex space-x-1">
        <div className="w-1 h-1 bg-red-400 rounded-full"></div>
        <div className="w-1 h-1 bg-red-300 rounded-full"></div>
        <div className="w-1 h-1 bg-red-200 rounded-full"></div>
      </div>
    </div>

    {/* Event venue/building */}
    <div className="flex flex-col items-center">
      {/* Building */}
      <div className="w-16 h-20 bg-gray-700 rounded-t-lg relative">
        {/* Windows */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-300 rounded-sm"></div>
        <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-300 rounded-sm"></div>
        <div className="absolute top-6 left-2 w-2 h-2 bg-yellow-300 rounded-sm"></div>
        <div className="absolute top-6 right-2 w-2 h-2 bg-yellow-300 rounded-sm"></div>
        <div className="absolute top-10 left-2 w-2 h-2 bg-yellow-300 rounded-sm"></div>
        <div className="absolute top-10 right-2 w-2 h-2 bg-yellow-300 rounded-sm"></div>
        {/* Entrance */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-8 bg-red-500 rounded-t-lg"></div>
      </div>
      {/* Base */}
      <div className="w-20 h-4 bg-gray-600 rounded-b-lg"></div>
    </div>

    {/* Calendar/Event icon */}
    <div className="flex flex-col items-center">
      <div className="w-14 h-16 bg-white rounded-lg shadow-lg border-2 border-gray-200 relative">
        {/* Calendar header */}
        <div className="w-full h-4 bg-red-500 rounded-t-lg"></div>
        {/* Calendar rings */}
        <div className="absolute -top-1 left-2 w-2 h-3 bg-gray-400 rounded-full"></div>
        <div className="absolute -top-1 right-2 w-2 h-3 bg-gray-400 rounded-full"></div>
        {/* Calendar content */}
        <div className="mt-2 px-2 space-y-1">
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
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Globe/World icon */}
    <div className="relative">
      <div className="w-16 h-16 bg-blue-400 rounded-full relative overflow-hidden shadow-lg">
        {/* Continents */}
        <div className="absolute top-3 left-2 w-4 h-3 bg-green-400 rounded-lg transform rotate-12"></div>
        <div className="absolute bottom-3 right-1 w-3 h-4 bg-green-400 rounded-lg"></div>
        <div className="absolute top-6 right-3 w-2 h-2 bg-green-400 rounded-full"></div>
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
    email: "abereenock95@gmail.com",
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

      // Determine callback URL based on password
      const callbackUrl =
        formData.password === "password@1234"
          ? "/change-password?required=true&default=true"
          : redirectTo;

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: callbackUrl,
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

        // Use NextAuth's built-in callback URL mechanism
        setTimeout(() => {
          if (formData.password === "password@1234") {
            router.push("/change-password?required=true&default=true");
          } else {
            router.push(redirectTo);
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100 flex">
      {/* Left side - Branding and illustration */}
      <div className="flex-1 flex flex-col justify-center items-center p-12 bg-white/80 backdrop-blur-sm">
        {/* Logo */}
        <div>
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/icon/MSF_logo_square.png"
              alt="MSF Logo"
              width={200}
              height={200}
              className="w-40 h-40"
              priority
            />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8 max-w-md">
          <h3 className="text-4xl font-bold text-gray-800 mb-4">
            Visitor Travel & Events Management
          </h3>
          <p className="text-gray-600 text-md">
            Manage tenants, streamline event planning, invite and track
            visitors, allocate rooms and transport, and approve per diem—all in
            one secure platform.
          </p>
        </div>

        {/* Travel and Events Illustration */}
        <TravelEventsIllustration />
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-2">
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome to MSF Msafiri
            </h2>
            <p className="text-sm text-gray-600">
              Travel & Events Admin Portal
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Alert Messages */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-600">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  placeholder="admin@msafiri.com"
                  className="h-12 border-gray-200 focus:border-red-600 focus:ring-red-600"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-600">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    placeholder="Enter password"
                    className="h-12 pr-10 border-gray-200 focus:border-red-600 focus:ring-red-600"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleViewChange("resetRequest")}
                  className="text-sm text-gray-600 hover:text-red-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isApiConnected}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                {isLoading && loginMethod === "credentials" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
              <div className="relative flex justify-center text-xs uppercase">
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
              className="w-full h-12 border-gray-200 hover:bg-gray-50"
            >
              {isLoading && loginMethod === "sso" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting to Microsoft...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
      </div>
    </div>
  );

  const renderResetRequestContent = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100 flex items-center justify-center p-8">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-sm text-gray-600">
            Enter your email address and we&apos;ll send you a reset link
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handlePasswordResetRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail" className="text-gray-600">
                Email Address
              </Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetData.email}
                onChange={handleResetInputChange("email")}
                placeholder="admin@msafiri.com"
                className="h-12 border-gray-200 focus:border-red-600 focus:ring-red-600"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !apiUrl}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reset Link
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => handleViewChange("login")}
                className="text-sm text-gray-600 hover:text-red-600 hover:underline inline-flex items-center"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back to Login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderResetPasswordContent = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100 flex items-center justify-center p-8">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Set New Password</h2>
          <p className="text-sm text-gray-600">Enter your new password below</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-600">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={resetData.newPassword || ""}
                onChange={handleResetInputChange("newPassword")}
                placeholder="Enter new password"
                className="h-12 border-gray-200 focus:border-red-600 focus:ring-red-600"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-600">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={resetData.confirmPassword || ""}
                onChange={handleResetInputChange("confirmPassword")}
                placeholder="Confirm new password"
                className="h-12 border-gray-200 focus:border-red-600 focus:ring-red-600"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !apiUrl}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => handleViewChange("login")}
                className="text-sm text-gray-600 hover:text-red-600 hover:underline inline-flex items-center"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
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
