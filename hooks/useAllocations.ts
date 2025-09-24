import { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '@/lib/auth';
import { usePathname } from 'next/navigation';

export function useAllocations() {
  const [pendingCount, setPendingCount] = useState(0);
  const { apiClient } = useAuthenticatedApi();
  const pathname = usePathname();

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const tenantSlugMatch = pathname?.match(/\/tenant\/([^/]+)/);
        const tenantSlug = tenantSlugMatch ? tenantSlugMatch[1] : null;
        
        if (tenantSlug) {
          const data = await apiClient.request<Array<{ id: number }>>(`/allocations/pending/${tenantSlug}`);
          setPendingCount(data.length);
        }
      } catch (error) {
        console.error('Error fetching pending allocations:', error);
        setPendingCount(0);
      }
    };

    fetchPendingCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [apiClient, pathname]);

  return { pendingCount };
}