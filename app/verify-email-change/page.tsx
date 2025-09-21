"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, LogOut } from "lucide-react";
import apiClient from "@/lib/api";

export default function VerifyEmailChangePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setError("Invalid verification link");
      return;
    }

    verifyEmailChange();
  }, [token]);

  const verifyEmailChange = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await apiClient.confirmEmailChange(token);
      setSuccess(true);
      setNewEmail(response.new_email);
      
      // Log out the user after successful email change to refresh session
      setTimeout(async () => {
        await signOut({
          redirect: true,
          callbackUrl: "/login?message=email-changed&email=" + encodeURIComponent(response.new_email)
        });
      }, 3000);
    } catch (error: any) {
      setError(error.message || "Failed to verify email change");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutNow = async () => {
    await signOut({
      redirect: true,
      callbackUrl: "/login?message=email-changed&email=" + encodeURIComponent(newEmail)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
              <h2 className="text-xl font-semibold">Verifying Email Change</h2>
              <p className="text-gray-600">Please wait while we update your email address...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <XCircle className="w-6 h-6 mr-2" />
              Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="w-6 h-6 mr-2" />
              Email Changed Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your email address has been successfully changed to:
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-800">{newEmail}</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center text-blue-800">
                <LogOut className="w-4 h-4 mr-2" />
                <p className="text-sm font-medium">
                  You will be logged out automatically to refresh your session with the new email.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              Logging out in a few seconds...
            </p>
            
            <Button onClick={handleLogoutNow} className="w-full">
              Log Out Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}