import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { signOut } from "next-auth/react";
import apiClient, { User } from "@/lib/api";

export function useUserData() {
  const { isAuthenticated, loading: sessionLoading, accessToken } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSessionExpiry = async () => {
    console.warn("Session expired in useUserData - logging out");
    setUser(null);
    setError("Session expired");

    await signOut({
      redirect: false,
      callbackUrl: "/login",
    });

    window.location.href = "/login?sessionExpired=true";
  };

  useEffect(() => {
    async function fetchUserData() {
      if (!isAuthenticated || sessionLoading || !accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        apiClient.setToken(accessToken);

        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch user data";

        if (
          errorMessage.includes("Session expired") ||
          errorMessage.includes("please log in again")
        ) {
          await handleSessionExpiry();
          return;
        }

        setError(errorMessage);
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
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch user data";

      if (
        errorMessage.includes("Session expired") ||
        errorMessage.includes("please log in again")
      ) {
        await handleSessionExpiry();
        return;
      }

      setError(errorMessage);
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
