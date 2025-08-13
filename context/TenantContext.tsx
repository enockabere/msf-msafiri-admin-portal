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
    console.log("Setting selected tenant:", tenant?.name || "null");
    setSelectedTenantState(tenant);
    setIsAllTenantsSelected(false);
    if (typeof window !== "undefined") {
      if (tenant) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tenant));
        sessionStorage.removeItem(ALL_TENANTS_KEY);
        console.log("Saved tenant to storage:", tenant.name);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(ALL_TENANTS_KEY);
        console.log("Cleared tenant from storage");
      }
    }
  };

  const setAllTenantsSelected = () => {
    console.log("Setting all tenants selected");
    setSelectedTenantState(null);
    setIsAllTenantsSelected(true);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.setItem(ALL_TENANTS_KEY, "true");
      console.log("Saved all tenants selection to storage");
    }
  };

  const loadSelectedTenantFromStorage = useCallback(() => {
    if (typeof window !== "undefined" && !hasLoadedFromStorage.current) {
      console.log("Loading tenant selection from storage...");
      try {
        const allTenantsSelected = sessionStorage.getItem(ALL_TENANTS_KEY);
        const storedTenant = sessionStorage.getItem(STORAGE_KEY);

        console.log("Storage values:", { allTenantsSelected, storedTenant });

        if (allTenantsSelected === "true") {
          console.log("Setting all tenants selected");
          setIsAllTenantsSelected(true);
          setSelectedTenantState(null);
        } else if (storedTenant) {
          console.log("Setting specific tenant from storage");
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
      user.role !== "super_admin"
    ) {
      console.log(
        "Skipping tenant refresh - not super admin or not authenticated"
      );
      return;
    }

    console.log("Refreshing tenants...");
    try {
      setLoading(true);
      setError(null);
      apiClient.setToken(accessToken);

      const tenantsData = await apiClient.getTenants();
      console.log("Fetched tenants:", tenantsData.length);
      setTenants(tenantsData);

      // Update selected tenant if it exists, but use a ref or state updater to avoid dependency
      setSelectedTenantState((currentSelected) => {
        if (currentSelected) {
          const updatedSelectedTenant = tenantsData.find(
            (t) => t.id === currentSelected.id
          );
          if (updatedSelectedTenant) {
            console.log(
              "Updated selected tenant from API:",
              updatedSelectedTenant.name
            );
            return updatedSelectedTenant;
          } else {
            console.log("Selected tenant no longer exists, clearing selection");
            return null;
          }
        }
        console.log("No tenant currently selected");
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
      console.log("Auth still loading, waiting...");
      return;
    }

    console.log(
      "Auth loaded. User role:",
      user?.role,
      "Authenticated:",
      isAuthenticated
    );

    if (user?.role === "super_admin" && isAuthenticated && accessToken) {
      console.log("User is super admin, fetching tenants...");
      // Only fetch tenants, don't clear the selection
      refreshTenants();
    } else if (isAuthenticated && user && user.role !== "super_admin") {
      // Only clear if we have a confirmed user who is NOT a super admin
      console.log(
        "User is authenticated but not super admin, clearing tenant selection"
      );
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
