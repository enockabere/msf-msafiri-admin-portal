"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import apiClient from "@/lib/api";

interface AcceptInvitationResponse {
  message: string;
  must_change_password?: boolean;
}

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const acceptInvitation = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await apiClient.acceptInvitation(token) as AcceptInvitationResponse;
      setSuccess(true);
      setMustChangePassword(response.must_change_password || false);
      
      setTimeout(() => {
        router.push("/login?message=invitation-accepted");
      }, 3000);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to accept invitation");
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      return;
    }

    acceptInvitation();
  }, [token, acceptInvitation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
              <h2 className="text-xl font-semibold">Processing Invitation</h2>
              <p className="text-gray-600">Please wait while we activate your account...</p>
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
              Invitation Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
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
              Invitation Accepted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your super admin invitation has been accepted successfully!
            </p>
            
            {mustChangePassword && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Important:</h4>
                <p className="text-yellow-700 text-sm">
                  You must change your password on first login. Use the temporary password sent to your email.
                </p>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Login Details:</h4>
              <p className="text-blue-700 text-sm">
                Email: Your invitation email<br/>
                {mustChangePassword && "Password: password@1234 (temporary)"}
              </p>
            </div>
            
            <p className="text-sm text-gray-500">
              Redirecting to login page in a few seconds...
            </p>
            
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}