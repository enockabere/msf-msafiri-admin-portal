"use client";

import { useState } from "react";
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

export default function SimplifiedLoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loginMethod, setLoginMethod] = useState<"sso" | "credentials">("sso");
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [resetData, setResetData] = useState<PasswordResetData>({
    email: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const resetToken = searchParams.get("token");

  // Handle view mode changes
  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    setError("");
    setSuccess("");
    
    // If coming with a reset token, go directly to reset password
    if (resetToken && mode === "login") {
      setViewMode("resetPassword");
      setResetData(prev => ({ ...prev, token: resetToken }));
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
        throw new Error("Microsoft SSO authentication failed. Please try again.");
      }

      if (result?.ok) {
        setSuccess("Successfully authenticated with Microsoft!");
        setTimeout(() => router.push(redirectTo), 1000);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Microsoft SSO login failed");
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

  // Handle Password Reset Request
  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/password/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to send reset email");
      }

      setSuccess("If an account exists with that email, a reset link has been sent.");
      setTimeout(() => setViewMode("login"), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      if (resetData.newPassword !== resetData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (!resetData.newPassword || resetData.newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/password/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetData.token || resetToken,
          new_password: resetData.newPassword,
          confirm_password: resetData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to reset password");
      }

      setSuccess("Password reset successfully! You can now log in.");
      setTimeout(() => setViewMode("login"), 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError("");
  };

  const handleResetInputChange = (field: keyof PasswordResetData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetData(prev => ({ ...prev, [field]: e.target.value }));
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
          />
        </div>
        <CardTitle className="text-2xl font-bold">MSF Msafiri Admin</CardTitle>
        <p className="text-sm text-muted-foreground">Super Admin Portal Access</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error/Success Alerts */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Login Methods */}
        <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as "sso" | "credentials")}>
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
                  placeholder="superadmin@msafiri.org"
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
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
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
              placeholder="superadmin@msafiri.org"
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
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
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
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
            disabled={isLoading}
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