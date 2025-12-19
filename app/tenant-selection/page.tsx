"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticatedApi } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export default function TenantSelectionPage() {
  const router = useRouter();
  const { apiClient } = useAuthenticatedApi();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserTenants();
  }, []);

  const loadUserTenants = async () => {
    try {
      const response = await apiClient.request("/users/me/tenants");
      setTenants(response);
    } catch (error) {
      console.error("Failed to load user tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectTenant = async (tenantSlug: string) => {
    try {
      localStorage.setItem("selectedTenant", tenantSlug);
      router.push(`/tenant/${tenantSlug}/dashboard`);
    } catch (error) {
      console.error("Failed to select tenant:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Tenant</h1>
          <p className="text-gray-600">You have access to multiple tenants. Please select one to continue.</p>
        </div>

        <div className="grid gap-4">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                      <p className="text-sm text-gray-500">Role: {tenant.role}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => selectTenant(tenant.slug)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Select
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}