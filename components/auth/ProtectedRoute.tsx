"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireTenantAdmin?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireSuperAdmin = false,
  requireTenantAdmin = false,
  redirectTo = "/dashboard",
}: ProtectedRouteProps) {
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);

  // Check tenant admin status
  useEffect(() => {
    const checkTenantAdmin = async () => {
      if (requireTenantAdmin && user?.email) {
        try {
          const pathname = window.location.pathname;
          const tenantSlugMatch = pathname.match(/\/tenant\/([^/]+)/);
          const tenantSlug = tenantSlugMatch ? tenantSlugMatch[1] : null;
          
          if (tenantSlug) {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`);
            if (response.ok) {
              const tenant = await response.json();
              setIsTenantAdmin(tenant.admin_email === user.email);
            }
          }
        } catch (error) {
          console.error('Error checking tenant admin:', error);
          setIsTenantAdmin(false);
        }
      }
    };
    
    if (user && requireTenantAdmin) {
      checkTenantAdmin();
    }
  }, [user, requireTenantAdmin]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setRedirecting(true);
      router.push("/login");
      return;
    }

    if (requireSuperAdmin && !isSuperAdmin) {
      setAccessDenied(true);
      setRedirecting(true);
      setTimeout(() => {
        router.push(redirectTo);
      }, 2000);
      return;
    }

    if (requireTenantAdmin && !isSuperAdmin && !isTenantAdmin) {
      setAccessDenied(true);
      setRedirecting(true);
      setTimeout(() => {
        router.push(redirectTo);
      }, 2000);
      return;
    }

    if (requireAdmin && !isAdmin) {
      setAccessDenied(true);
      setRedirecting(true);
      setTimeout(() => {
        router.push(redirectTo);
      }, 2000);
      return;
    }
  }, [user, isAdmin, isSuperAdmin, isTenantAdmin, loading, router, requireAdmin, requireSuperAdmin, requireTenantAdmin, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (requireSuperAdmin && !isSuperAdmin) || (requireTenantAdmin && !isSuperAdmin && !isTenantAdmin) || (requireAdmin && !isAdmin)) {
    if (accessDenied) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-2">
                  <p className="font-medium">Access Denied</p>
                  <p className="text-sm">
                    You don&apos;t have permission to access this page. 
                    {redirecting && "Redirecting to dashboard..."}
                  </p>
                  {redirecting && (
                    <div className="flex items-center gap-2 mt-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Redirecting...</span>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}