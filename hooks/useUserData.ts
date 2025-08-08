// hooks/useUserData.ts
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import apiClient, { User } from "@/lib/api";

export function useUserData() {
  const { isAuthenticated, loading: sessionLoading, accessToken } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!isAuthenticated || sessionLoading || !accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Set token in API client
        apiClient.setToken(accessToken);

        // Fetch current user data from the API
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch user data"
        );
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [isAuthenticated, sessionLoading, accessToken]);

  const refetchUser = async () => {
    if (!isAuthenticated || !accessToken) return;

    try {
      setError(null);
      apiClient.setToken(accessToken);
      const userData = await apiClient.getCurrentUser();
      setUser(userData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch user data"
      );
    }
  };

  return {
    user,
    loading,
    error,
    refetchUser,
    isAuthenticated,
  };
}
