"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Robust API URL detection
const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000/api/v1";
    }

    return "https://msafiri-visitor-api.onrender.com/api/v1";
  }

  return "https://msafiri-visitor-api.onrender.com/api/v1";
};

interface PasswordResetData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [apiUrl, setApiUrl] = useState<string>("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const [formData, setFormData] = useState<PasswordResetData>({
    token: "",
    newPassword: "",
    confirmPassword: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize and verify token
  useEffect(() => {
    const url = getApiUrl();
    setApiUrl(url);

    const token = searchParams.get("token");
    if (token) {
      setFormData((prev) => ({ ...prev, token }));
      verifyToken(token, url);
    } else {
      setError(
        "No reset token provided. Please request a new password reset link."
      );
      setTokenValid(false);
    }
  }, [searchParams]);

  // Verify if the token is valid
  const verifyToken = async (token: string, apiUrl: string) => {
    try {
      const response = await fetch(`${apiUrl}/password/verify-reset-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setTokenValid(true);
        console.log("Token verified:", data);
      } else {
        setTokenValid(false);
        setError(
          "Invalid or expired reset token. Please request a new password reset link."
        );
      }
    } catch {
      setTokenValid(false);
      setError("Unable to verify reset token. Please try again.");
    }
  };

  // Handle password reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      // Validate inputs
      if (!formData.newPassword || !formData.confirmPassword) {
        throw new Error("Please fill in both password fields");
      }

      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (formData.newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }

      // Check for password strength
      const hasUppercase = /[A-Z]/.test(formData.newPassword);
      const hasLowercase = /[a-z]/.test(formData.newPassword);
      const hasNumbers = /\d/.test(formData.newPassword);

      if (!hasUppercase || !hasLowercase || !hasNumbers) {
        throw new Error(
          "Password must contain uppercase, lowercase, and numeric characters"
        );
      }

      const response = await fetch(`${apiUrl}/password/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          token: formData.token,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword,
        }),
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textData = await response.text();
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

      // Redirect to login after success
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      console.error("Password reset error:", error);

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
    (field: keyof PasswordResetData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError("");
    };

  // Show loading while verifying token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/90 backdrop-blur-sm border shadow-xl">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Verifying reset token...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
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
                Invalid Reset Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show reset form if token is valid
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
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
            <CardTitle className="text-xl font-bold">
              Set New Password
            </CardTitle>
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
                  value={formData.newPassword}
                  onChange={handleInputChange("newPassword")}
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
                  value={formData.confirmPassword}
                  onChange={handleInputChange("confirmPassword")}
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
                  onClick={() => router.push("/login")}
                  className="text-sm text-gray-600 hover:text-gray-700 hover:underline inline-flex items-center"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Back to Login
                </button>
              </div>
            </form>
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
