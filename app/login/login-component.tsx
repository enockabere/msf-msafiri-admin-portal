"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Microsoft icon as SVG component
const MicrosoftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
  </svg>
);

// FIXED: Robust API URL detection with better logging
const getApiUrl = (): string => {
  // Try environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log("🔧 Using API URL from env:", process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Client-side fallback logic
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    console.log("🔧 Detecting API URL for hostname:", hostname);

    // Local development
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const localUrl = "http://localhost:8000/api/v1";
      console.log("🏠 Using local API URL:", localUrl);
      return localUrl;
    }

    // Vercel deployment or other production
    const prodUrl = "https://msafiri-visitor-api.onrender.com/api/v1";
    console.log("🌐 Using production API URL:", prodUrl);
    return prodUrl;
  }

  // Server-side fallback
  const fallbackUrl = "https://msafiri-visitor-api.onrender.com/api/v1";
  console.log("🔄 Using server-side fallback:", fallbackUrl);
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

export default function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loginMethod, setLoginMethod] = useState<"sso" | "credentials">(
    "credentials"
  );
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [apiUrl, setApiUrl] = useState<string>("");

  const [formData, setFormData] = useState<LoginFormData>({
    email: "abereenock95@gmail.com", // Pre-fill for convenience
    password: "",
  });

  const [resetData, setResetData] = useState<PasswordResetData>({
    email: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const resetToken = searchParams.get("token");

  // Initialize API URL and handle reset token
  useEffect(() => {
    const url = getApiUrl();
    setApiUrl(url);
    console.log("🎯 API URL initialized:", url);

    // Handle reset token from URL
    if (resetToken) {
      console.log("🔐 Reset token detected, switching to reset password view");
      setViewMode("resetPassword");
      setResetData((prev) => ({ ...prev, token: resetToken }));
    }
  }, [resetToken]);

  // Handle view mode changes
  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    setError("");
    setSuccess("");

    // Clear form data when switching views
    if (mode === "login") {
      setResetData({ email: "" });
    }
  };

  // Handle Microsoft SSO Login
  const handleMicrosoftLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const result = await signIn("azure-ad", {
        redirect: false,
        callbackUrl: redirectTo,
      });

      if (result?.error) {
        throw new Error(
          "Microsoft SSO authentication failed. Please try again."
        );
      }

      if (result?.ok) {
        setSuccess("Successfully authenticated with Microsoft!");
        setTimeout(() => router.push(redirectTo), 1000);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Microsoft SSO login failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Credential Login
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      if (!formData.email || !formData.password) {
        throw new Error("Please enter both email and password");
      }

      const result = await signIn("admin-credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: redirectTo,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          throw new Error("Invalid email or password");
        }
        throw new Error("Login failed. Please check your credentials");
      }

      if (result?.ok) {
        setSuccess("Login successful! Redirecting...");
        router.push(redirectTo);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ENHANCED: Handle Password Reset Request with robust error handling
  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      if (!resetData.email) {
        throw new Error("Please enter your email address");
      }

      if (!apiUrl) {
        throw new Error("API configuration error. Please refresh the page.");
      }

      const requestUrl = `${apiUrl}/password/request-reset`;
      console.log("🔧 Sending password reset request to:", requestUrl);

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: resetData.email }),
      });

      console.log("📡 Response status:", response.status);
      console.log(
        "📡 Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log("📡 Response data:", data);
      } else {
        const textData = await response.text();
        console.log("📡 Response text:", textData);
        data = { message: textData };
      }

      if (!response.ok) {
        const errorMessage =
          data?.detail || data?.message || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const successMessage =
        data?.message ||
        "If an account exists with that email, a reset link has been sent.";
      setSuccess(successMessage);

      // Clear the email field and switch back to login after a delay
      setTimeout(() => {
        setResetData({ email: "" });
        setViewMode("login");
      }, 4000);
    } catch (error) {
      console.error("🚨 Password reset request error:", error);

      let errorMessage = "Failed to send reset email";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Provide helpful error messages
      if (errorMessage.includes("fetch")) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (errorMessage.includes("404")) {
        errorMessage =
          "Password reset service is not available. Please contact support.";
      } else if (
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("TypeError")
      ) {
        errorMessage = "Unable to connect to server. Please try again later.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ENHANCED: Handle Password Reset with Token with enhanced validation
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      // Validate inputs
      if (!resetData.newPassword || !resetData.confirmPassword) {
        throw new Error("Please fill in both password fields");
      }

      if (resetData.newPassword !== resetData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (resetData.newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }

      // Check for password strength
      const hasUppercase = /[A-Z]/.test(resetData.newPassword);
      const hasLowercase = /[a-z]/.test(resetData.newPassword);
      const hasNumbers = /\d/.test(resetData.newPassword);

      if (!hasUppercase || !hasLowercase || !hasNumbers) {
        throw new Error(
          "Password must contain uppercase, lowercase, and numeric characters"
        );
      }

      const tokenToUse = resetData.token || resetToken;
      if (!tokenToUse) {
        throw new Error(
          "Invalid or missing reset token. Please request a new password reset link."
        );
      }

      if (!apiUrl) {
        throw new Error("API configuration error. Please refresh the page.");
      }

      const requestUrl = `${apiUrl}/password/reset-password`;
      console.log("🔧 Resetting password with token to:", requestUrl);

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          token: tokenToUse,
          new_password: resetData.newPassword,
          confirm_password: resetData.confirmPassword,
        }),
      });

      console.log("📡 Reset response status:", response.status);

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log("📡 Reset response data:", data);
      } else {
        const textData = await response.text();
        console.log("📡 Reset response text:", textData);
        data = { message: textData };
      }

      if (!response.ok) {
        const errorMessage =
          data?.detail || data?.message || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const successMessage =
        data?.message || "Password reset successfully! You can now log in.";
      setSuccess(successMessage);

      // Clear form and redirect to login
      setTimeout(() => {
        setResetData({ email: "" });
        setViewMode("login");
        // Clear URL parameters
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("token");
          window.history.replaceState({}, "", url.toString());
        }
      }, 2000);
    } catch (error) {
      console.error("🚨 Password reset error:", error);

      let errorMessage = "Failed to reset password";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

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
    <>
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
        <CardTitle className="text-2xl font-bold">MSF Msafiri Admin</CardTitle>
        <p className="text-sm text-muted-foreground">
          Super Admin Portal Access
        </p>
        {/* Debug info in development */}
        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-gray-400">API: {apiUrl}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error/Success Alerts */}
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

        {/* Login Methods */}
        <Tabs
          value={loginMethod}
          onValueChange={(value) =>
            setLoginMethod(value as "sso" | "credentials")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sso">Microsoft SSO</TabsTrigger>
            <TabsTrigger value="credentials">Super Admin</TabsTrigger>
          </TabsList>

          {/* Microsoft SSO */}
          <TabsContent value="sso" className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              For MSF staff with Microsoft work accounts
            </p>
            <Button
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading && loginMethod === "sso" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <MicrosoftIcon className="w-4 h-4 mr-2" />
                  Sign in with Microsoft
                </>
              )}
            </Button>
          </TabsContent>

          {/* Super Admin Login */}
          <TabsContent value="credentials" className="space-y-4">
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  placeholder="abereenock95@gmail.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading && loginMethod === "credentials" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => handleViewChange("resetRequest")}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  );

  const renderResetRequestContent = () => (
    <>
      <CardHeader className="text-center space-y-4">
        <CardTitle className="text-xl font-bold">Reset Password</CardTitle>
        <p className="text-sm text-muted-foreground">
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
            <Label htmlFor="resetEmail">Email Address</Label>
            <Input
              id="resetEmail"
              type="email"
              value={resetData.email}
              onChange={handleResetInputChange("email")}
              placeholder="abereenock95@gmail.com"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Enter the email address associated with your admin account
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !apiUrl}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
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
              className="text-sm text-gray-600 hover:text-gray-700 hover:underline inline-flex items-center"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Back to Login
            </button>
          </div>
        </form>
      </CardContent>
    </>
  );

  const renderResetPasswordContent = () => (
    <>
      <CardHeader className="text-center space-y-4">
        <CardTitle className="text-xl font-bold">Set New Password</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your new password below
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

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={resetData.newPassword || ""}
              onChange={handleResetInputChange("newPassword")}
              placeholder="Enter new password"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Must be at least 8 characters with uppercase, lowercase, and
              numbers
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={resetData.confirmPassword || ""}
              onChange={handleResetInputChange("confirmPassword")}
              placeholder="Confirm new password"
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
              className="text-sm text-gray-600 hover:text-gray-700 hover:underline inline-flex items-center"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Back to Login
            </button>
          </div>
        </form>
      </CardContent>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-sm border shadow-xl">
          {viewMode === "login" && renderLoginContent()}
          {viewMode === "resetRequest" && renderResetRequestContent()}
          {viewMode === "resetPassword" && renderResetPasswordContent()}
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          © 2025 MSF Msafiri. All rights reserved.
        </div>
      </div>
    </div>
  );
}
