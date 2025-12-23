"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, ArrowRight, Users, Shield } from "lucide-react";

interface UserTenant {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  role: string;
}

interface PendingLogin {
  email: string;
  allRoles: string[];
  userTenants: UserTenant[];
  redirectTo: string;
}

export default function SelectTenantPage() {
  const [pendingLogin, setPendingLogin] = useState<PendingLogin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingLogin');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setPendingLogin(data);
      } catch (e) {
        console.error('Failed to parse pending login data:', e);
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleTenantSelect = async (tenant: UserTenant) => {
    try {
      setIsLoading(true);
      setError("");

      // Make API call to select tenant and get new token
      const response = await fetch('/api/auth/select-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_slug: tenant.tenant_slug,
          email: pendingLogin?.email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to select tenant');
      }

      // Clear pending login data
      sessionStorage.removeItem('pendingLogin');

      // Redirect to appropriate dashboard
      const redirectPath = tenant.role === 'SUPER_ADMIN' 
        ? '/dashboard' 
        : `/tenant/${tenant.tenant_slug}/dashboard`;
      
      router.push(redirectPath);

    } catch (error) {
      console.error('Tenant selection error:', error);
      setError('Failed to select tenant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800';
      case 'MT_ADMIN': return 'bg-blue-100 text-blue-800';
      case 'HR_ADMIN': return 'bg-green-100 text-green-800';
      case 'EVENT_ADMIN': return 'bg-orange-100 text-orange-800';
      case 'VETTING_COMMITTEE': return 'bg-indigo-100 text-indigo-800';
      case 'VETTING_APPROVER': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!pendingLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center space-y-4 px-6 pt-6">
          <div className="flex justify-center">
            <Building2 className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Select Organization</h2>
          <p className="text-sm text-gray-600">
            You have access to multiple organizations. Please select which one you'd like to access.
          </p>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Logged in as:</strong> {pendingLogin.email}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {pendingLogin.allRoles.map((role, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-6 pb-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-sm text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {pendingLogin.userTenants.map((tenant, index) => (
              <Card
                key={index}
                className="border border-gray-200 hover:border-red-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => !isLoading && handleTenantSelect(tenant)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {tenant.tenant_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {tenant.tenant_slug}
                        </p>
                        {tenant.role && (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleColor(tenant.role)}`}>
                            {tenant.role}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem('pendingLogin');
                router.push('/login');
              }}
              className="w-full"
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}