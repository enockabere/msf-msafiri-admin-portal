"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import apiClient, { Tenant } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface TenantContextType {
  selectedTenant: Tenant | null;
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  isAllTenantsSelected: boolean;
  setSelectedTenant: (tenant: Tenant | null) => void;
  setAllTenantsSelected: () => void;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const pathname = usePathname();

  // Skip authentication for public routes
  const isPublicRoute = pathname?.startsWith('/public') || pathname === '/login' || pathname === '/';

  if (isPublicRoute) {
    return <TenantProviderSimple>{children}</TenantProviderSimple>;
  }

  return <TenantProviderWithAuth>{children}</TenantProviderWithAuth>;
}

// Simple provider for public routes without authentication
function TenantProviderSimple({ children }: TenantProviderProps) {
  const contextValue: TenantContextType = {
    selectedTenant: null,
    tenants: [],
    loading: false,
    error: null,
    isAllTenantsSelected: false,
    setSelectedTenant: () => {},
    setAllTenantsSelected: () => {},
    refreshTenants: async () => {},
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

// Full provider with authentication for protected routes
function TenantProviderWithAuth({ children }: TenantProviderProps) {
  const {
    user,
    isAuthenticated,
    accessToken,
    loading: authLoading,
  } = useAuth();
  const [selectedTenant, setSelectedTenantState] = useState<Tenant | null>(
    null
  );
  const [isAllTenantsSelected, setIsAllTenantsSelected] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedFromStorage = useRef(false);
  const isInitialized = useRef(false);

  const STORAGE_KEY = "msafiri_selected_tenant";
  const ALL_TENANTS_KEY = "msafiri_all_tenants_selected";

  const setSelectedTenant = (tenant: Tenant | null) => {
    setSelectedTenantState(tenant);
    setIsAllTenantsSelected(false);
    if (typeof window !== "undefined") {
      if (tenant) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tenant));
        sessionStorage.removeItem(ALL_TENANTS_KEY);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(ALL_TENANTS_KEY);
      }
    }
  };

  const setAllTenantsSelected = () => {
    setSelectedTenantState(null);
    setIsAllTenantsSelected(true);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.setItem(ALL_TENANTS_KEY, "true");
    }
  };

  const loadSelectedTenantFromStorage = useCallback(() => {
    if (typeof window !== "undefined" && !hasLoadedFromStorage.current) {
      try {
        const allTenantsSelected = sessionStorage.getItem(ALL_TENANTS_KEY);
        const storedTenant = sessionStorage.getItem(STORAGE_KEY);

        if (allTenantsSelected === "true") {
          setIsAllTenantsSelected(true);
          setSelectedTenantState(null);
        } else if (storedTenant) {
          const tenant = JSON.parse(storedTenant) as Tenant;
          setSelectedTenantState(tenant);
          setIsAllTenantsSelected(false);
        }

        hasLoadedFromStorage.current = true;
      } catch (error) {
        console.warn("Failed to load selected tenant from storage:", error);
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(ALL_TENANTS_KEY);
        hasLoadedFromStorage.current = true;
      }
    }
  }, []);

  const refreshTenants = useCallback(async (): Promise<void> => {
    if (
      !isAuthenticated ||
      !accessToken ||
      !user?.role ||
      (user.role !== "super_admin" && user.role !== "SUPER_ADMIN")
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      apiClient.setToken(accessToken);

      const tenantsData = await apiClient.getTenants();

      setTenants(tenantsData);

      // Update selected tenant if it exists, but use a ref or state updater to avoid dependency
      setSelectedTenantState((currentSelected) => {
        if (currentSelected) {
          const updatedSelectedTenant = tenantsData.find(
            (t) => t.id === currentSelected.id
          );
          if (updatedSelectedTenant) {
            return updatedSelectedTenant;
          } else {
            return null;
          }
        }

        return currentSelected;
      });
    } catch (err) {
      console.error("Failed to fetch tenants:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch tenants";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, accessToken, user?.role]);

  // Load from storage on component mount (only once)
  useEffect(() => {
    if (!isInitialized.current && typeof window !== "undefined") {
      loadSelectedTenantFromStorage();
      isInitialized.current = true;
    }
  }, [loadSelectedTenantFromStorage]);

  // Handle user role changes and authentication
  useEffect(() => {
    // Don't do anything while auth is still loading
    if (authLoading) {
      return;
    }

    if (
      (user?.role === "super_admin" || user?.role === "SUPER_ADMIN") &&
      isAuthenticated &&
      accessToken
    ) {
      refreshTenants();
    } else if (
      isAuthenticated &&
      user &&
      user.role !== "super_admin" &&
      user.role !== "SUPER_ADMIN"
    ) {
      setTenants([]);
      setSelectedTenant(null);
      hasLoadedFromStorage.current = false;
      isInitialized.current = false;
    }
    // If not authenticated or no user yet, don't clear anything - wait for auth to complete
  }, [user, isAuthenticated, accessToken, authLoading, refreshTenants]);

  const contextValue: TenantContextType = {
    selectedTenant,
    tenants,
    loading,
    error,
    isAllTenantsSelected,
    setSelectedTenant,
    setAllTenantsSelected,
    refreshTenants,
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
